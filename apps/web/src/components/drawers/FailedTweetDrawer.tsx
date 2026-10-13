import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import React from "react";
import type { FailedTweet } from "../../lib/api";
import { Drawer } from "../ui/Overlay";
import { Tag } from "../ui/Tag";
import { FailedTweetQueue } from "../jobs/FailedTweetQueue";

export interface FailedTweetDrawerProps {
  open: boolean;
  onClose: () => void;
  items: FailedTweet[];
  total: number;
}

export function FailedTweetDrawer({
  open,
  onClose,
  items,
  total,
}: FailedTweetDrawerProps) {
  const { t } = useTranslation();
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="44rem"
      title={
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-danger shrink-0" />
          <span className="font-semibold text-fg">{t("failed.title")}</span>
          <Tag tone="danger" className="font-mono">
            {total}
          </Tag>
        </div>
      }
    >
      <div className="p-4">
        <FailedTweetQueue items={items} total={total} />
      </div>
    </Drawer>
  );
}
