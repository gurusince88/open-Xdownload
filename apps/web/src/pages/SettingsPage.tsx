import { useTranslation } from "react-i18next";
import React from "react";
import type { AppConfig } from "../lib/api";
import { ConfigForm } from "../components/settings/ConfigForm";

export interface SettingsPageProps {
  config: AppConfig;
  onRefresh?: () => void;
  refreshPending?: boolean;
}

export function SettingsPage({
  config,
  onRefresh,
  refreshPending = false,
}: SettingsPageProps) {
  // Settings copy lives mostly in ConfigForm; keep hook ready for page chrome.
  useTranslation();
  return (
    <ConfigForm
      config={config}
      onRefresh={onRefresh}
      refreshPending={refreshPending}
    />
  );
}
