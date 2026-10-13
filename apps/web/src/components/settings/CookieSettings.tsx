import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Key,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import type { AppConfig, AuthCheck, ClientStatus } from "../../lib/api";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Feedback";
import { Field, PasswordInput } from "../ui/Input";
import { Tooltip } from "../ui/Overlay";
import { Tag, type Tone } from "../ui/Tag";

export type CookieClientStatus = ClientStatus;

const COOKIE_HELP_STEP_KEYS = [
  "settings.guideStep1",
  "settings.guideStep2",
  "settings.guideStep3",
  "settings.guideStep4",
  "settings.guideStep5",
] as const;

const COOKIE_HELP_NOTE_KEYS = [
  "settings.guideNote1",
  "settings.guideNote2",
  "settings.guideNote3",
  "settings.guideNote4",
] as const;

function TipIcon({ content }: { content: React.ReactNode }) {
  return (
    <Tooltip content={content}>
      <span className="inline-flex cursor-help text-fg-subtle hover:text-fg-muted">
        <HelpCircle className="size-3.5" />
      </span>
    </Tooltip>
  );
}

export type BackupCookieRow = {
  id: string;
  authToken: string;
  csrfToken: string;
};

export function CookieSettingsFields({
  authError,
  authResult,
  checking,
  draft,
  onChange,
}: {
  authError: string;
  authResult: AuthCheck | null;
  checking: boolean;
  draft: AppConfig;
  onChange: React.Dispatch<React.SetStateAction<AppConfig>>;
}) {
  const { t } = useTranslation();
  const tips = useMemo(
    () => ({
      authToken: t("settings.helpAuthToken"),
      csrfToken: t("settings.helpCt0"),
      backupCookie: (
        <div className="space-y-1 text-xs">
          <div>{t("settings.helpBackup1")}</div>
          <div>{t("settings.helpBackup2")}</div>
          <div>{t("settings.helpBackup3")}</div>
        </div>
      ),
    }),
    [t],
  );
  const clients = authResult?.diagnostics?.clients ?? [];
  const primaryClient = clients.find((client) => client.primary) ?? clients[0];
  const backupClients = clients.filter((client) => !client.primary);
  const primaryComplete = Boolean((draft.authToken ?? "").trim() && (draft.csrfToken ?? "").trim());
  const sharedStatus = {
    checking,
    checked: Boolean(authResult),
    errorMessage: authError || (authResult && !authResult.diagnostics ? authResult.message : ""),
  };

  return (
    <div className="space-y-5">
      <CookieHelpAlert />

      {/* 主 Cookie */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-fg">{t("settings.primaryCookie")}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="auth_token"
            tooltip={<TipIcon content={tips.authToken} />}
          >
            <PasswordInput
              aria-label={`${t("settings.primaryCookie")} auth_token`}
              prefix={<Key className="size-3.5 text-fg-subtle" />}
              suffix={
                <CookieTokenStatus
                  {...sharedStatus}
                  client={primaryClient}
                  hasValue={Boolean((draft.authToken ?? "").trim())}
                  pairComplete={primaryComplete}
                />
              }
              value={draft.authToken ?? ""}
              onChange={(event) =>
                onChange((current) => ({ ...current, authToken: event.target.value }))
              }
              placeholder={t("settings.enterAuthToken")}
            />
          </Field>

          <Field
            label="ct0 (CSRF Token)"
            tooltip={<TipIcon content={tips.csrfToken} />}
          >
            <PasswordInput
              aria-label={`${t("settings.primaryCookie")} ct0`}
              prefix={<Key className="size-3.5 text-fg-subtle" />}
              suffix={
                <CookieTokenStatus
                  {...sharedStatus}
                  client={primaryClient}
                  hasValue={Boolean((draft.csrfToken ?? "").trim())}
                  pairComplete={primaryComplete}
                />
              }
              value={draft.csrfToken ?? ""}
              onChange={(event) =>
                onChange((current) => ({ ...current, csrfToken: event.target.value }))
              }
              placeholder={t("settings.enterCt0")}
            />
          </Field>
        </div>
      </div>

      {/* 备用 Cookie 账号池 */}
      <div className="pt-3 border-t border-line">
        <BackupCookieInputs
          clients={backupClients}
          {...sharedStatus}
          value={draft.additionalCookies ?? ""}
          onChange={(additionalCookies) =>
            onChange((current) => ({ ...current, additionalCookies }))
          }
        />
      </div>
    </div>
  );
}

export function CookieHelpAlert() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-card border border-info/30 bg-info-soft/60 p-3.5 text-xs text-fg-body">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-fg">
          <HelpCircle className="size-4 text-info" />
          <span>{t("settings.howToGetCookie")}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((c) => !c)}
          className="cursor-pointer text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          {open ? t("settings.collapseGuide") : t("settings.expandGuide")}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-info/20 pt-3">
          <ol className="list-decimal pl-4 space-y-1">
            {COOKIE_HELP_STEP_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ol>
          <div className="space-y-1 text-fg-muted pt-1">
            {COOKIE_HELP_NOTE_KEYS.map((key) => (
              <p key={key} className="text-[11px]">
                · {t(key)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CookieTokenStatus({
  aggregateClients,
  checked,
  checking,
  client,
  errorMessage,
  hasValue,
  pairComplete,
}: {
  aggregateClients?: CookieClientStatus[];
  checked: boolean;
  checking: boolean;
  client?: CookieClientStatus;
  errorMessage: string;
  hasValue: boolean;
  pairComplete: boolean;
}) {
  let tone: Tone = "neutral";
  let label = i18n.t("settings.statusPending");
  let detail = i18n.t("settings.statusPendingDetail");
  let icon: React.ReactNode = null;

  if (!hasValue) {
    label = i18n.t("settings.statusUnset");
    detail = i18n.t("settings.statusUnsetDetail");
  } else if (!pairComplete) {
    tone = "warning";
    label = i18n.t("settings.statusIncomplete");
    detail = i18n.t("settings.statusIncompleteDetail");
    icon = <AlertTriangle className="size-3" />;
  } else if (checking) {
    tone = "brand";
    label = i18n.t("settings.statusChecking");
    detail = i18n.t("settings.statusCheckingDetail");
    icon = <RefreshCw className="size-3 animate-spin" />;
  } else if (aggregateClients?.length) {
    const available = aggregateClients.filter((item) => item.ok).length;
    const hasTransientError = aggregateClients.some((item) => item.ok && item.error);
    tone =
      available === aggregateClients.length && !hasTransientError
        ? "success"
        : available === 0
        ? "danger"
        : "warning";
    label = i18n.t("settings.statusAvailable", {
      available,
      total: aggregateClients.length,
    });
    detail = aggregateClients.map((item) => cookieClientStatusDetail(item)).join("; ");
    icon =
      tone === "success" ? (
        <CheckCircle2 className="size-3" />
      ) : tone === "danger" ? (
        <AlertCircle className="size-3" />
      ) : (
        <AlertTriangle className="size-3" />
      );
  } else if (client) {
    if (!client.ok || client.disabled) {
      tone = "danger";
      label = i18n.t("settings.statusError");
      icon = <AlertCircle className="size-3" />;
    } else if (client.error) {
      tone = "warning";
      label = i18n.t("settings.statusLimited");
      icon = <AlertTriangle className="size-3" />;
    } else {
      tone = "success";
      label = i18n.t("settings.statusValid");
      icon = <CheckCircle2 className="size-3" />;
    }
    detail = cookieClientStatusDetail(client);
  } else if (errorMessage) {
    tone = "danger";
    label = i18n.t("settings.statusCheckFailed");
    detail = errorMessage;
    icon = <AlertCircle className="size-3" />;
  } else if (checked) {
    tone = "neutral";
    label = i18n.t("settings.statusSkipped");
    detail = i18n.t("settings.statusSkippedDetail");
  }

  return (
    <Tooltip content={detail}>
      <span>
        <Tag tone={tone} size="sm" icon={icon} aria-label={detail}>
          {label}
        </Tag>
      </span>
    </Tooltip>
  );
}

export function cookieClientStatusDetail(client: CookieClientStatus) {
  const account = client.screenName
    ? `@${client.screenName}`
    : i18n.t("settings.accountN", { n: client.index + 1 });
  if (client.error) {
    return `${account}: ${client.error}`;
  }
  return i18n.t("settings.cookieValidFor", { account });
}

export function BackupCookieInputs({
  checked,
  checking,
  clients,
  errorMessage,
  value,
  onChange,
}: {
  checked: boolean;
  checking: boolean;
  clients: CookieClientStatus[];
  errorMessage: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const backupTip = (
    <div className="space-y-1 text-xs">
      <div>{t("settings.helpBackup1")}</div>
      <div>{t("settings.helpBackup2")}</div>
      <div>{t("settings.helpBackup3")}</div>
    </div>
  );
  const redactedCookieValue = "********";
  const [rows, setRows] = useState<BackupCookieRow[]>(() => parseBackupCookieRows(value));

  useEffect(() => {
    const nextRows = parseBackupCookieRows(value);
    const nextValue = normalizeBackupCookieRows(nextRows);
    setRows((currentRows) =>
      normalizeBackupCookieRows(currentRows) === nextValue ? currentRows : nextRows,
    );
  }, [value]);

  function updateRow(index: number, field: keyof BackupCookieRow, nextValue: string) {
    setRows((currentRows) => {
      const nextRows = currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }
        if (isRedactedBackupCookieRow(row) && nextValue !== redactedCookieValue) {
          return {
            id: row.id,
            authToken: field === "authToken" ? nextValue : "",
            csrfToken: field === "csrfToken" ? nextValue : "",
          };
        }
        return { ...row, [field]: nextValue };
      });
      onChange(normalizeBackupCookieRows(nextRows));
      return nextRows;
    });
  }

  function addRow() {
    setRows((currentRows) => {
      const nextRows = [...currentRows, emptyBackupCookieRow()];
      onChange(normalizeBackupCookieRows(nextRows));
      return nextRows;
    });
  }

  function removeRow(index: number) {
    setRows((currentRows) => {
      const nextRows = currentRows.filter((_, rowIndex) => rowIndex !== index);
      const safeRows = nextRows.length > 0 ? nextRows : [emptyBackupCookieRow()];
      onChange(normalizeBackupCookieRows(safeRows));
      return safeRows;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-fg">{t("settings.backupPool")}</span>
          <TipIcon content={backupTip} />
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus className="size-3.5" />}
          onClick={addRow}
        >
          {t("settings.addBackup")}
        </Button>
      </div>

      <div className="space-y-2.5">
        {rows.map((row, index) => {
          const pairComplete = Boolean(row.authToken.trim() && row.csrfToken.trim());
          const aggregateClients =
            isRedactedBackupCookieRow(row) && clients.length > 1 ? clients : undefined;
          const client = aggregateClients ? undefined : clients[index];
          const statusProps = {
            aggregateClients,
            checked,
            checking,
            client,
            errorMessage,
            pairComplete,
          };

          return (
            <div
              key={row.id}
              className="flex flex-col gap-2 rounded-control border border-line bg-surface-muted/40 p-2.5 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <PasswordInput
                  aria-label={`${t("settings.backupPool")} ${index + 1} auth_token`}
                  prefix={<Key className="size-3.5 text-fg-subtle" />}
                  suffix={
                    <CookieTokenStatus
                      {...statusProps}
                      hasValue={Boolean(row.authToken.trim())}
                    />
                  }
                  value={row.authToken}
                  onChange={(event) => updateRow(index, "authToken", event.target.value)}
                  placeholder={t("settings.backupAuth", { n: index + 1 })}
                  size="sm"
                />
              </div>

              <div className="flex-1">
                <PasswordInput
                  aria-label={`${t("settings.backupPool")} ${index + 1} ct0`}
                  prefix={<Key className="size-3.5 text-fg-subtle" />}
                  suffix={
                    <CookieTokenStatus
                      {...statusProps}
                      hasValue={Boolean(row.csrfToken.trim())}
                    />
                  }
                  value={row.csrfToken}
                  onChange={(event) => updateRow(index, "csrfToken", event.target.value)}
                  placeholder={t("settings.backupCt0", { n: index + 1 })}
                  size="sm"
                />
              </div>

              <div className="flex shrink-0 items-center justify-end">
                <Tooltip content={t("settings.deleteBackup")}>
                  <Button
                    size="sm"
                    variant="ghost"
                    circle
                    icon={<Trash2 className="size-3.5 text-danger" />}
                    onClick={() => removeRow(index)}
                    aria-label={`${t("settings.deleteBackup")} ${index + 1}`}
                  />
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

let backupCookieRowSeq = 0;

export function emptyBackupCookieRow(): BackupCookieRow {
  backupCookieRowSeq += 1;
  return { id: `backup-cookie-${backupCookieRowSeq}`, authToken: "", csrfToken: "" };
}

export function parseBackupCookieRows(value: string): BackupCookieRow[] {
  const trimmed = value.trim();
  if (!trimmed) {
    return [emptyBackupCookieRow()];
  }
  if (trimmed === "********") {
    return [{ ...emptyBackupCookieRow(), authToken: "********", csrfToken: "********" }];
  }

  const jsonRows = parseBackupCookieRowsFromJSON(trimmed);
  if (jsonRows.length > 0) {
    return jsonRows;
  }

  const rows: BackupCookieRow[] = [];
  let current = emptyBackupCookieRow();
  const flush = () => {
    if (current.authToken || current.csrfToken) {
      rows.push(current);
    }
    current = emptyBackupCookieRow();
  };

  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^-+\s*/, "");
    if (!line) {
      flush();
      continue;
    }
    if (line.includes(":") && !/[;,]/.test(line)) {
      if (setBackupCookieValue(current, line) && current.authToken && current.csrfToken) {
        flush();
      }
      continue;
    }
    for (const token of line.split(/[;,\s]+/)) {
      setBackupCookieValue(current, token);
    }
    if (current.authToken && current.csrfToken) {
      flush();
    }
  }
  flush();
  return rows.length > 0 ? rows : [emptyBackupCookieRow()];
}

export function parseBackupCookieRowsFromJSON(value: string): BackupCookieRow[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }
      const record = item as Record<string, unknown>;
      const authToken = firstString(record.authToken, record.auth_token);
      const csrfToken = firstString(record.csrfToken, record.ct0);
      return authToken || csrfToken ? [{ ...emptyBackupCookieRow(), authToken, csrfToken }] : [];
    });
  } catch {
    return [];
  }
}

export function setBackupCookieValue(current: BackupCookieRow, raw: string) {
  const [key, value] = splitCookieKeyValue(raw);
  if (!key || !value) {
    return false;
  }
  if (key === "auth_token" || key === "authToken") {
    current.authToken = value;
    return true;
  }
  if (key === "ct0" || key === "csrfToken") {
    current.csrfToken = value;
    return true;
  }
  return false;
}

export function splitCookieKeyValue(raw: string) {
  const separatorIndex = raw.search(/[=:]/);
  if (separatorIndex < 0) {
    return ["", ""] as const;
  }
  const key = raw.slice(0, separatorIndex).trim();
  const value = raw
    .slice(separatorIndex + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
  return [key, value] as const;
}

export function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

export function normalizeBackupCookieRows(rows: BackupCookieRow[]) {
  return rows
    .map((row) => ({ authToken: row.authToken.trim(), csrfToken: row.csrfToken.trim() }))
    .filter((row) => Boolean(row.authToken || row.csrfToken))
    .map((row) =>
      [
        row.authToken ? `auth_token=${row.authToken}` : "",
        row.csrfToken ? `ct0=${row.csrfToken}` : "",
      ]
        .filter(Boolean)
        .join("; "),
    )
    .join("\n");
}

export function isRedactedBackupCookieRow(row: BackupCookieRow) {
  return row.authToken === "********" && row.csrfToken === "********";
}
