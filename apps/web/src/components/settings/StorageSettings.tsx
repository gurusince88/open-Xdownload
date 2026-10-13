import React from "react";
import i18n from "../../i18n";
import type { AppConfig } from "../../lib/api";
import { Stack } from "../common/CommonUI";
import { LocalDirectoryPicker } from "./LocalDirectoryPicker";

export function storageTargetLabel(config: AppConfig) {
  return config.downloadDir || i18n.t("settings.localDirUnset");
}

export function StorageSettings({
  draft,
  onChange,
}: {
  draft: AppConfig;
  onChange: React.Dispatch<React.SetStateAction<AppConfig>>;
}) {
  return (
    <Stack size={16}>
      <LocalDirectoryPicker
        path={draft.downloadDir}
        onSelect={(downloadDir) => onChange((current) => ({ ...current, downloadDir }))}
      />
    </Stack>
  );
}
