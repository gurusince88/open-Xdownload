import i18n from "../i18n";
import type { Job } from "./api";

export interface AggregatedErrorGroup {
  id: string;
  reason: string;
  action?: string;
  targets: string[];
  count: number;
}

/** Exact English / legacy Chinese reasons → `errors.*` (full-string match only). */
const REASON_I18N: Record<string, string> = {
  "X clients temporarily rate limited; retry later": "errors.rateLimited",
  "X 客户端暂时全部限流，请稍后重试": "errors.rateLimited",
  "No available X client": "errors.noClient",
  "没有可用 X 客户端": "errors.noClient",
  "All X cookies are unavailable": "errors.allCookiesUnavailable",
  "所有 X Cookie 均不可用": "errors.allCookiesUnavailable",
  "所有 X Cookie 都不可用": "errors.allCookiesUnavailable",
  "X cookie marked unavailable": "errors.cookieDisabled",
  "X Cookie 已被标记为不可用": "errors.cookieDisabled",
  "Configure auth_token and ct0 first": "errors.cookieRequired",
  "请先配置 auth_token 和 ct0": "errors.cookieRequired",
  "This tweet has no downloadable media": "errors.noMedia",
  "这条推文没有可下载媒体": "errors.noMedia",
  "Tweet unavailable (deleted or restricted)": "errors.tweetUnavailable",
  "推文不可用（已删除或受限）": "errors.tweetUnavailable",
  "User unavailable": "errors.userUnavailable",
  "用户不可用": "errors.userUnavailable",
  "Job is still running or queued and cannot be retried": "errors.jobRetryBusy",
  "任务仍在运行或排队中，不能重试": "errors.jobRetryBusy",
};

const ACTION_I18N: Record<string, string> = {
  "Failed to read timeline": "errors.timelineReadFailed",
  "读取媒体时间线失败": "errors.timelineReadFailed",
  "Failed to create archive link": "errors.archiveLinkFailed",
  "创建归档链接失败": "errors.archiveLinkFailed",
};

const CODE_I18N: Record<string, string> = {
  rate_limited: "errors.rateLimited",
  cookie_required: "errors.cookieRequired",
  cookie_disabled: "errors.cookieDisabled",
  no_client: "errors.noClient",
  all_cookies_unavailable: "errors.allCookiesUnavailable",
  no_media: "errors.noMedia",
  tweet_unavailable: "errors.tweetUnavailable",
  user_unavailable: "errors.userUnavailable",
  job_retry_busy: "errors.jobRetryBusy",
  timeline_read_failed: "errors.timelineReadFailed",
  archive_link_failed: "errors.archiveLinkFailed",
};

function translateKey(key: string): string | undefined {
  const translated = i18n.t(key);
  if (translated && translated !== key) return translated;
  return undefined;
}

function localizeReason(reason: string): string {
  const codeMatch = reason.match(/^([a-z][a-z0-9_]*)\s*:\s*(.+)$/i);
  if (codeMatch && CODE_I18N[codeMatch[1].toLowerCase()]) {
    const translated = translateKey(CODE_I18N[codeMatch[1].toLowerCase()]);
    if (translated) return translated;
  }
  const key = REASON_I18N[reason];
  if (key) {
    const translated = translateKey(key);
    if (translated) return translated;
  }
  return reason;
}

function localizeAction(action?: string): string | undefined {
  if (!action) return undefined;
  const key = ACTION_I18N[action];
  if (key) {
    const translated = translateKey(key);
    if (translated) return translated;
  }
  return action;
}

/**
 * Parse and aggregate job error strings into structured groups.
 * Compatible with:
 * 1. Historical CN concatenated rows: `读取 @u1 … 读取 @u2 … 另有 23 个错误`
 * 2. Newline-separated multi-line errors
 * 3. Backend pre-aggregated CN/EN: `(共 31 个账号: …)` / `(31 accounts: …)`
 * 4. New English shapes: `Failed to read timeline for @user: …` / `and N more errors`
 * 5. Simple single-line errors
 */
export function parseAggregatedErrors(errorText?: string): AggregatedErrorGroup[] {
  if (!errorText || !errorText.trim()) {
    return [];
  }

  const raw = errorText.trim();

  let rawLines: string[];
  if (raw.includes("\n")) {
    rawLines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  } else {
    rawLines = [raw];
  }

  const chunks: string[] = [];
  // CN: 读取 @ / 创建 @ / 另有 N 个错误
  // EN: Failed to read timeline for @ / Failed to create archive link for @ / and N more errors
  const concatSplitRegex =
    /(?=(?:读取|创建)\s+@|另有\s*\d+\s*个错误|Failed to (?:read timeline|create archive link) for @|and\s+\d+\s+more errors)/gi;

  for (const line of rawLines) {
    const parts = line.split(concatSplitRegex).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      chunks.push(...parts);
    } else {
      chunks.push(line);
    }
  }

  const groups: AggregatedErrorGroup[] = [];
  const groupMap = new Map<string, AggregatedErrorGroup>();
  let trailerCount = 0;

  for (const chunk of chunks) {
    const trailerMatch = chunk.match(/^(?:另有\s*(\d+)\s*个错误|and\s+(\d+)\s+more errors)$/i);
    if (trailerMatch) {
      trailerCount += parseInt(trailerMatch[1] || trailerMatch[2], 10) || 0;
      continue;
    }

    // Backend pre-aggregated:
    // CN: 读取媒体时间线失败: reason (共 31 个账号: @u1、@u2 等)
    // EN: Failed to read timeline: reason (31 accounts: @u1, @u2)
    const backendGroupMatch = chunk.match(
      /^(?:([^:：]+)[:：]\s*)?(.*?)\s*\((?:共\s*)?(\d+)\s*(?:个(?:账号|目标|错误|次)?|accounts?|times?)(?::|：)?\s*(.*?)\)$/i,
    );
    if (backendGroupMatch && backendGroupMatch[3]) {
      const action = localizeAction(backendGroupMatch[1]?.trim()) || backendGroupMatch[1]?.trim();
      const reasonRaw = backendGroupMatch[2]?.trim() || chunk;
      const reason = localizeReason(reasonRaw);
      const count = parseInt(backendGroupMatch[3], 10) || 1;
      const targetStr = backendGroupMatch[4] || "";
      const targets = targetStr.match(/@[a-zA-Z0-9_]+/g) || [];

      const key = `${action || ""}:::${reason}`;
      if (groupMap.has(key)) {
        const g = groupMap.get(key)!;
        g.count += count;
        for (const t of targets) {
          if (!g.targets.includes(t)) g.targets.push(t);
        }
      } else {
        const group: AggregatedErrorGroup = {
          id: `err-${groups.length + 1}`,
          reason,
          action: action || undefined,
          targets,
          count,
        };
        groupMap.set(key, group);
        groups.push(group);
      }
      continue;
    }

    // Single-line:
    // CN: 读取 @alice 的媒体时间线失败: timeout
    // EN: Failed to read timeline for @alice: timeout
    let action: string | undefined;
    let target: string | undefined;
    let reason = chunk;

    const colonIdx = chunk.indexOf(": ") !== -1 ? chunk.indexOf(": ") : chunk.indexOf("：");
    if (colonIdx !== -1) {
      const prefix = chunk.slice(0, colonIdx).trim();
      reason = chunk.slice(colonIdx + (chunk[colonIdx] === "：" ? 1 : 2)).trim();

      const enPrefix = prefix.match(
        /^(Failed to read timeline|Failed to create archive link)\s+for\s+@([a-zA-Z0-9_]+)$/i,
      );
      if (enPrefix) {
        action = enPrefix[1];
        target = `@${enPrefix[2]}`;
      } else {
        const targetMatch = prefix.match(/@([a-zA-Z0-9_]+)/);
        if (targetMatch) {
          target = `@${targetMatch[1]}`;
          const cleanPrefix = prefix
            .replace(/@[a-zA-Z0-9_]+/g, "")
            .replace(/\s*的\s*/g, "")
            .replace(/\s+for\s*$/i, "")
            .replace(/\s+/g, "")
            .trim();
          action = cleanPrefix || undefined;
        } else if (prefix.length < 40) {
          action = prefix;
        }
      }
    }

    // Prefer stable apperr codes when the prefix is a known code token.
    if (action && CODE_I18N[action.toLowerCase()]) {
      const translated = translateKey(CODE_I18N[action.toLowerCase()]);
      if (translated) {
        reason = translated;
        action = undefined;
      }
    } else {
      action = localizeAction(action) || action;
      reason = localizeReason(reason);
    }

    const key = `${action || ""}:::${reason}`;
    if (groupMap.has(key)) {
      const g = groupMap.get(key)!;
      g.count += 1;
      if (target && !g.targets.includes(target)) {
        g.targets.push(target);
      }
    } else {
      const group: AggregatedErrorGroup = {
        id: `err-${groups.length + 1}`,
        reason,
        action: action || undefined,
        targets: target ? [target] : [],
        count: 1,
      };
      groupMap.set(key, group);
      groups.push(group);
    }
  }

  if (trailerCount > 0) {
    if (groups.length > 0) {
      groups[0].count += trailerCount;
    } else {
      groups.push({
        id: "err-1",
        reason: i18n.t("tasks.otherReason"),
        targets: [],
        count: trailerCount,
      });
    }
  }

  return groups;
}

/**
 * Compact progress-column label and hover tooltip for a job.
 */
export function getJobProgressDisplay(job: Job): {
  displayMsg: string;
  tooltip: string;
  hasError: boolean;
} {
  const isFailed = job.status === "failed";
  const isPartial = job.status === "completed_with_errors";
  const hasError = isFailed || isPartial || Boolean(job.error);

  if (
    job.status === "pending" ||
    job.status === "downloading" ||
    job.status === "resolving"
  ) {
    const msg = job.message || i18n.t("tasks.statusRunning");
    return { displayMsg: msg, tooltip: msg, hasError: false };
  }

  if (job.status === "completed" && !job.error) {
    const msg = job.message || i18n.t("tasks.statusDone");
    return { displayMsg: msg, tooltip: msg, hasError: false };
  }

  if (job.status === "canceled") {
    const msg = job.message || i18n.t("tasks.statusCanceled");
    return { displayMsg: msg, tooltip: msg, hasError: false };
  }

  const groups = parseAggregatedErrors(job.error);

  if (groups.length === 0) {
    const msg =
      job.error ||
      job.message ||
      (isFailed ? i18n.t("tasks.statusFailed") : i18n.t("tasks.statusRunning"));
    return { displayMsg: localizeReason(msg), tooltip: localizeReason(msg), hasError };
  }

  if (groups.length === 1 && groups[0].count <= 1 && groups[0].targets.length <= 1) {
    const msg =
      groups[0].reason ||
      job.error ||
      (isFailed ? i18n.t("tasks.statusFailed") : i18n.t("tasks.partialAnomaly"));
    const tooltip =
      job.message && job.message !== msg
        ? `${msg}\n${i18n.t("tasks.statusPrefix", { message: job.message })}`
        : msg;
    return { displayMsg: msg, tooltip, hasError };
  }

  const totalCount = groups.reduce((acc, g) => acc + g.count, 0);
  let displayMsg: string;
  if (groups.length === 1) {
    displayMsg = `${groups[0].reason} ${i18n.t("tasks.countItems", { count: groups[0].count })}`;
  } else {
    displayMsg = i18n.t("tasks.partialFail", { count: totalCount });
  }

  const tooltipLines: string[] = [];
  if (job.message) {
    tooltipLines.push(job.message);
  }
  for (const g of groups) {
    const targetsStr =
      g.targets.length > 0
        ? ` (${g.targets.slice(0, 5).join(", ")}${g.targets.length > 5 ? i18n.t("tasks.etc") : ""})`
        : "";
    tooltipLines.push(
      `• ${g.reason} ${i18n.t("tasks.countBracket", { count: g.count })}${targetsStr}`,
    );
  }

  return {
    displayMsg,
    tooltip: tooltipLines.join("\n"),
    hasError: true,
  };
}
