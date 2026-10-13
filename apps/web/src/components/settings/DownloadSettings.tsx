import { HelpCircle } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AppConfig, FileNamingMode } from "../../lib/api";
import { Select } from "../ui/Controls";
import { Switch } from "../ui/Controls";
import { Field, Input, NumberInput } from "../ui/Input";
import { Tooltip } from "../ui/Overlay";

function TipIcon({ content }: { content: React.ReactNode }) {
  return (
    <Tooltip content={content}>
      <span className="inline-flex cursor-help text-fg-subtle hover:text-fg-muted">
        <HelpCircle className="size-3.5" />
      </span>
    </Tooltip>
  );
}

export function DownloadSettingsFields({
  draft,
  onChange,
  onAuthChange,
}: {
  draft: AppConfig;
  onChange: React.Dispatch<React.SetStateAction<AppConfig>>;
  onAuthChange: React.Dispatch<React.SetStateAction<AppConfig>>;
}) {
  const { t } = useTranslation();

  const fileNamingOptions = useMemo(
    (): Array<{ value: FileNamingMode; label: string }> => [
      { value: "user_tweet", label: t("settings.namingUserTweet") },
      { value: "tweet_text", label: t("settings.namingTweet") },
    ],
    [t],
  );

  const tips = useMemo(
    () => ({
      proxy: (
        <div className="space-y-1 text-xs">
          <div>{t("settings.proxyHelp1")}</div>
          <div>{t("settings.proxyHelp2")}</div>
          <div>{t("settings.proxyHelp3")}</div>
        </div>
      ),
      maxFilenameLength: t("settings.maxFilenameHelp"),
      fileNaming: t("settings.fileNamingHelp"),
      autoRetryFailed: t("settings.autoRetryHelp"),
      autoFollowProtected: t("settings.autoFollowHelp"),
      includeNestedTweetMedia: t("settings.nestedHelp"),
      incrementalArchive: (
        <div className="space-y-1 text-xs">
          <div>{t("settings.incrementalHelp1")}</div>
          <div>{t("settings.incrementalHelp2")}</div>
        </div>
      ),
    }),
    [t],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <Field
            label={t("settings.proxyLabel")}
            tooltip={<TipIcon content={tips.proxy} />}
          >
            <Input
              value={draft.proxyUrl}
              onChange={(event) =>
                onAuthChange((current) => ({ ...current, proxyUrl: event.target.value }))
              }
              placeholder="http://127.0.0.1:7890 or socks5://127.0.0.1:1080"
            />
          </Field>
        </div>

        <div>
          <Field
            label={t("settings.maxFilename")}
            tooltip={<TipIcon content={tips.maxFilenameLength} />}
          >
            <NumberInput
              min={16}
              max={240}
              value={draft.maxFilenameLength}
              onChange={(value) =>
                onChange((current) => ({ ...current, maxFilenameLength: value ?? 120 }))
              }
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field
            label={t("settings.fileNaming")}
            tooltip={<TipIcon content={tips.fileNaming} />}
          >
            <Select
              value={draft.fileNamingMode}
              options={fileNamingOptions}
              onChange={(value) =>
                onChange((current) => ({
                  ...current,
                  fileNamingMode: value as FileNamingMode,
                }))
              }
            />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4 border-t border-line">
        <div className="flex items-center justify-between rounded-control border border-line bg-surface-muted/50 p-3">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-fg">
              <span>{t("settings.autoRetryLabel")}</span>
              <TipIcon content={tips.autoRetryFailed} />
            </div>
            <p className="text-[11px] text-fg-subtle mt-0.5">{t("settings.autoRetryHint")}</p>
          </div>
          <Switch
            checked={draft.autoRetryFailed}
            onChange={(checked) =>
              onChange((current) => ({ ...current, autoRetryFailed: checked }))
            }
            ariaLabel={t("settings.toggleAutoRetry")}
          />
        </div>

        <div className="flex items-center justify-between rounded-control border border-line bg-surface-muted/50 p-3">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-fg">
              <span>{t("settings.autoFollowLabel")}</span>
              <TipIcon content={tips.autoFollowProtected} />
            </div>
            <p className="text-[11px] text-fg-subtle mt-0.5">{t("settings.autoFollowHint")}</p>
          </div>
          <Switch
            checked={draft.autoFollowProtected}
            onChange={(checked) =>
              onChange((current) => ({ ...current, autoFollowProtected: checked }))
            }
            ariaLabel={t("settings.toggleAutoFollow")}
          />
        </div>

        <div className="flex items-center justify-between rounded-control border border-line bg-surface-muted/50 p-3">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-fg">
              <span>{t("settings.nestedLabel")}</span>
              <TipIcon content={tips.includeNestedTweetMedia} />
            </div>
            <p className="text-[11px] text-fg-subtle mt-0.5">{t("settings.nestedHint")}</p>
          </div>
          <Switch
            checked={draft.includeNestedTweetMedia}
            onChange={(checked) =>
              onChange((current) => ({ ...current, includeNestedTweetMedia: checked }))
            }
            ariaLabel={t("settings.toggleNested")}
          />
        </div>

        <div className="flex items-center justify-between rounded-control border border-line bg-surface-muted/50 p-3">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-fg">
              <span>{t("settings.incrementalLabel")}</span>
              <TipIcon content={tips.incrementalArchive} />
            </div>
            <p className="text-[11px] text-fg-subtle mt-0.5">{t("settings.incrementalHint")}</p>
          </div>
          <Switch
            checked={draft.incrementalArchive}
            onChange={(checked) =>
              onChange((current) => ({ ...current, incrementalArchive: checked }))
            }
            ariaLabel={t("settings.toggleIncremental")}
          />
        </div>
      </div>
    </div>
  );
}
