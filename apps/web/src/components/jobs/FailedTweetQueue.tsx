import { AlertCircle, RotateCcw, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import {
  clearFailedTweets,
  deleteFailedTweet,
  getFailedTweets,
  retryFailedTweets,
  type Dashboard,
  type FailedTweet,
} from "../../lib/api";
import {
  AppEmpty,
  AppPagination,
  CopyButton,
  EllipsisText,
  ListSkeleton,
  LoadingSurface,
  Stack,
  Toolbar,
  failedTweetPageSizeOptions,
  formatDateTime,
  notifyError,
} from "../common/CommonUI";
import { Button } from "../ui/Button";
import { Popconfirm } from "../ui/Overlay";
import { Tag } from "../ui/Tag";
import { toast } from "../ui/Toast";
import { dashboardMetaQueryRoot, failedTweetQueryRoot, jobsQueryRoot } from "../../lib/api";

export function FailedTweetQueue({
  items,
  total,
}: {
  items: FailedTweet[];
  total: number;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const failedTweetsQuery = useQuery({
    queryKey: [...failedTweetQueryRoot, page, pageSize],
    queryFn: ({ signal }) => getFailedTweets({ page, pageSize, signal }),
  });

  const fallbackPagination: Dashboard["pagination"] = {
    page,
    pageSize,
    total,
    totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
  };

  const pageItems = failedTweetsQuery.data?.items ?? (page === 1 ? items.slice(0, pageSize) : []);
  const pagination = failedTweetsQuery.data?.pagination ?? fallbackPagination;

  const refreshFailedTweets = () => {
    queryClient.invalidateQueries({ queryKey: failedTweetQueryRoot });
    queryClient.invalidateQueries({ queryKey: dashboardMetaQueryRoot });
    queryClient.invalidateQueries({ queryKey: jobsQueryRoot });
  };

  const retryAll = useMutation({
    mutationFn: retryFailedTweets,
    onSuccess: (job) => {
      refreshFailedTweets();
      toast.success({
        message: t("failed.retryQueued"),
        description: job.title || t("failed.retryCreated"),
      });
    },
    onError: notifyError(t("failed.retryFailed")),
  });

  const removeOne = useMutation({
    mutationFn: deleteFailedTweet,
    onSuccess: () => {
      if (page > 1 && pageItems.length <= 1) {
        setPage(page - 1);
      }
      refreshFailedTweets();
      toast.success({ message: t("failed.recordDeleted") });
    },
    onError: notifyError(t("failed.deleteFailed")),
  });

  const clearAll = useMutation({
    mutationFn: clearFailedTweets,
    onSuccess: () => {
      setPage(1);
      refreshFailedTweets();
      toast.success({ message: t("failed.queueCleared") });
    },
    onError: notifyError(t("failed.clearFailed")),
  });

  return (
    <Stack size={12}>
      <Toolbar>
        <span className="text-xs text-fg-muted">
          {pagination.total > 0 ? t("failed.totalRecords", { count: pagination.total }) : t("failed.noRecords")}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<RotateCcw className="size-3.5" />}
            loading={retryAll.isPending}
            disabled={pagination.total === 0}
            onClick={() => retryAll.mutate()}
          >
            {t("failed.retryAll")}
          </Button>
          <Popconfirm
            title={t("failed.clearTitle")}
            description={t("failed.clearConfirm")}
            okText={t("common.clear")}
            cancelText={t("common.cancel")}
            disabled={pagination.total === 0}
            onConfirm={() => clearAll.mutate()}
          >
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="size-3.5" />}
              loading={clearAll.isPending}
              disabled={pagination.total === 0}
            >
              {t("common.clear")}
            </Button>
          </Popconfirm>
        </div>
      </Toolbar>

      {failedTweetsQuery.isLoading && pageItems.length === 0 ? (
        <ListSkeleton rows={pageSize} />
      ) : pageItems.length === 0 ? (
        <AppEmpty description={t("failed.empty")} />
      ) : (
        <LoadingSurface loading={failedTweetsQuery.isFetching}>
          <div className="divide-y divide-line rounded-card border border-line bg-surface">
            {pageItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 p-3 transition-colors hover:bg-surface-hover">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                    <AlertCircle className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-fg truncate">
                        {item.jobTitle || item.tweetId}
                      </span>
                      <Tag tone="neutral" className="font-mono">
                        {item.userScreenName ? `@${item.userScreenName}` : item.userId || t("common.unknownUser")}
                      </Tag>
                    </div>
                    <EllipsisText type="danger" title={item.error} className="text-xs">
                      {item.error || t("common.unknownError")}
                    </EllipsisText>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-fg-subtle">
                      <span className="font-mono">{t("failed.tweetLabel", { id: item.tweetId })}</span>
                      <span>{formatDateTime(item.updatedAt || item.createdAt)}</span>
                      {item.entityName && <span>{item.entityName}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <CopyButton value={item.tweetId} label={t("failed.copyTweetId")} />
                  <Popconfirm
                    title={t("failed.deleteTitle")}
                    description={t("failed.deleteConfirm")}
                    okText={t("common.delete")}
                    cancelText={t("common.cancel")}
                    onConfirm={() => removeOne.mutate(item.id)}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 className="size-3.5 text-danger" />}
                      loading={removeOne.isPending && removeOne.variables === item.id}
                      aria-label={t("failed.deleteAria")}
                    />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        </LoadingSurface>
      )}

      <AppPagination
        current={pagination.page}
        itemName={t("failed.itemName")}
        pageSize={pagination.pageSize}
        pageSizeOptions={failedTweetPageSizeOptions}
        total={pagination.total}
        onChange={(nextPage, nextPageSize) => {
          setPage(nextPageSize === pageSize ? nextPage : 1);
          setPageSize(nextPageSize);
        }}
      />
    </Stack>
  );
}
