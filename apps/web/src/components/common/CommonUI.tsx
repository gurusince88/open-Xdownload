import { Check, Copy } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { JobKind } from "../../lib/api";
import i18n from "../../i18n";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Empty as UiEmpty, ListSkeleton as UiListSkeleton } from "../ui/Feedback";
import { Tooltip } from "../ui/Overlay";
import { Pagination as UiPagination } from "../ui/Pagination";
import { LoadingOverlay } from "../ui/Spinner";
import { toast } from "../ui/Toast";

export type TextTone = "secondary" | "success" | "warning" | "danger";

export const fullWidthStyle: React.CSSProperties = { width: "100%" };

export const defaultListPageSizeOptions = [5, 10, 20, 50];
export const tablePageSizeOptions = [10, 20, 50, 100];
export const failedTweetPageSizeOptions = [10, 20, 50];

export function AppEmpty({ description, className }: { description: string; className?: string }) {
  return <UiEmpty description={description} className={cn("my-2", className)} />;
}

export function ListSkeleton({ rows = 4, avatar = true }: { rows?: number; avatar?: boolean }) {
  return <UiListSkeleton rows={rows} avatar={avatar} />;
}

export function LoadingSurface({
  children,
  loading,
  tip,
}: {
  children: React.ReactNode;
  loading?: boolean;
  tip?: string;
}) {
  const { t } = useTranslation();
  return (
    <LoadingOverlay loading={!!loading} tip={tip ?? t("common.loading")}>
      <div className="min-w-0">{children}</div>
    </LoadingOverlay>
  );
}

export function Stack({
  children,
  size = 12,
  style,
  className,
}: {
  children: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      style={{ gap: `${size}px`, ...style }}
      className={cn("flex w-full flex-col", className)}
    >
      {children}
    </div>
  );
}

export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex w-full flex-wrap items-center justify-between gap-2.5", className)}>
      {children}
    </div>
  );
}

export function EllipsisText({
  children,
  code,
  style,
  title,
  type,
  className,
}: {
  children: React.ReactNode;
  code?: boolean;
  style?: React.CSSProperties;
  title?: string;
  type?: TextTone;
  className?: string;
}) {
  const toneClass = {
    secondary: "text-fg-muted",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };
  return (
    <span
      title={title}
      style={style}
      className={cn(
        "block max-w-full truncate",
        code && "font-mono text-xs rounded bg-surface-muted px-1 py-0.5",
        type ? toneClass[type] : "text-fg-body",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function useClientPagination<TItem>(items: TItem[], initialPageSize = 5) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const total = items.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, maxPage);

  useEffect(() => {
    setPage((current) => Math.min(current, maxPage));
  }, [maxPage]);

  const start = (currentPage - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  function handleChange(nextPage: number, nextPageSize?: number) {
    if (nextPageSize && nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }
    setPage(nextPage);
  }

  return {
    items: pagedItems,
    page: currentPage,
    pageSize,
    total,
    onChange: handleChange,
  };
}

export function AppPagination({
  current,
  itemName,
  onChange,
  pageSize,
  pageSizeOptions: _pageSizeOptions,
  simple,
  total,
}: {
  current: number;
  itemName: string;
  onChange: (page: number, pageSize: number) => void;
  pageSize: number;
  pageSizeOptions?: number[];
  simple?: boolean;
  total: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full justify-end">
      <UiPagination
        page={current}
        pageSize={pageSize}
        total={total}
        totalLabel={(count) =>
          simple ? undefined : t("common.itemsNamed", { count, name: itemName })
        }
        onPageChange={(p) => onChange(p, pageSize)}
        onPageSizeChange={(ps) => onChange(1, ps)}
      />
    </div>
  );
}

export function PaginatedList<TItem>({
  bordered = true,
  emptyDescription,
  itemName,
  items,
  loading,
  maxHeight,
  pageSize = 5,
  renderItem,
  simplePagination = false,
  skeletonRows = pageSize,
}: {
  bordered?: boolean;
  emptyDescription: string;
  itemName: string;
  items: TItem[];
  loading?: boolean;
  maxHeight?: number;
  pageSize?: number;
  renderItem: (item: TItem) => React.ReactNode;
  simplePagination?: boolean;
  skeletonRows?: number;
  size?: "small" | "default" | "large";
}) {
  const pagination = useClientPagination(items, pageSize);

  if (loading && items.length === 0) {
    return <ListSkeleton rows={skeletonRows} />;
  }

  if (items.length === 0) {
    return (
      <Stack size={8}>
        <AppEmpty description={emptyDescription} />
        <AppPagination
          current={pagination.page}
          itemName={itemName}
          pageSize={pagination.pageSize}
          simple={simplePagination}
          total={pagination.total}
          onChange={pagination.onChange}
        />
      </Stack>
    );
  }

  return (
    <LoadingSurface loading={loading}>
      <Stack size={8}>
        <div
          style={maxHeight ? { maxHeight, overflow: "auto" } : undefined}
          className={cn(
            "flex flex-col divide-y divide-line rounded-card",
            bordered && "border border-line bg-surface",
          )}
        >
          {pagination.items.map((item, index) => (
            <div key={index} className="p-3 transition-colors hover:bg-surface-hover">
              {renderItem(item)}
            </div>
          ))}
        </div>
        <AppPagination
          current={pagination.page}
          itemName={itemName}
          pageSize={pagination.pageSize}
          simple={simplePagination}
          total={pagination.total}
          onChange={pagination.onChange}
        />
      </Stack>
    </LoadingSurface>
  );
}

// 明文 HTTP（局域网部署的常态）下 navigator.clipboard 是 undefined，
// 直接调用会在事件处理里抛 TypeError。这里逐级降级到 execCommand，
// 返回真实结果交给调用方提示，不再无条件报“已复制”。
export async function writeClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 权限被拒时继续走 execCommand 兜底
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

export async function copyToClipboard(text: string, label?: string) {
  const resolvedLabel = label ?? i18n.t("common.path");
  const copied = await writeClipboard(text);
  if (copied) {
    toast.success({
      message: i18n.t("common.copySuccess"),
      description: i18n.t("common.copiedDesc", { label: resolvedLabel }),
    });
  } else {
    toast.warning({
      message: i18n.t("common.copyFailed"),
      description: i18n.t("common.clipboardUnsupported", { label: resolvedLabel }),
    });
  }
  return copied;
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (await writeClipboard(value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
      return;
    }
    setCopied(false);
    toast.warning({
      message: t("common.copyFailed"),
      description: t("common.clipboardUnsupported", { label }),
    });
  }

  return (
    <Tooltip content={copied ? t("common.copied") : label}>
      <Button
        size="sm"
        variant={copied ? "primary" : "ghost"}
        icon={copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        onClick={handleCopy}
        aria-label={label}
      />
    </Tooltip>
  );
}

export function formatIntervalMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return i18n.t("common.notSet");
  }
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return i18n.t("common.everyDays", { count: days });
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return i18n.t("common.everyHours", { count: hours });
  }
  return i18n.t("common.everyMinutes", { count: minutes });
}

// 表格每一行、媒体库每张卡片都会调用，formatter 提到模块级只构造一次。
const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateTimeFormatter.format(date);
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value * 100)));
}

export function kindLabel(kind: JobKind) {
  const key = `jobKind.${kind}` as const;
  const translated = i18n.t(key);
  if (translated !== key) return translated;
  return i18n.t("jobKind.unknown");
}

export function mediaTypeLabel(type: "photo" | "video" | "animated_gif" | "file") {
  return i18n.t(`mediaType.${type}`);
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return i18n.t("common.unknownError");
}

export function notifyError(title: string) {
  return (error: unknown) => {
    toast.error({
      message: title,
      description: getErrorMessage(error),
    });
  };
}
