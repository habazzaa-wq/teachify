"use client";

import { StudioBadge } from "@/components/studio";
import { UPLOAD_STATUS_CONFIG } from "../constants";
import { UPLOAD_STATUS_ICONS } from "./icons";
import type { UploadStatus } from "../types";

interface UploadStatusBadgeProps {
  status: UploadStatus;
  className?: string;
}

export function UploadStatusBadge({ status, className }: UploadStatusBadgeProps) {
  const config = UPLOAD_STATUS_CONFIG[status];
  const Icon = UPLOAD_STATUS_ICONS[status]!;
  return (
    <StudioBadge tone={config.tone} size="sm" icon={<Icon className="h-3 w-3" />} className={className}>
      {config.label}
    </StudioBadge>
  );
}
