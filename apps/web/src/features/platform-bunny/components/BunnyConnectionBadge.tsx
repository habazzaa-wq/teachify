"use client";

import { CircleCheck, CircleX, TriangleAlert, Loader2 } from "lucide-react";
import { StudioBadge, type BadgeTone } from "@/components/studio";
import { BUNNY_CONNECTION_STATUS_TONE } from "../constants";
import { bunnyMessages as m } from "../messages";
import type { BunnyConnectionStatus } from "../types";

const ICONS: Record<BunnyConnectionStatus, React.ReactNode> = {
  connected: <CircleCheck className="h-3 w-3" />,
  disconnected: <CircleX className="h-3 w-3" />,
  unauthorized: <CircleX className="h-3 w-3" />,
  region_error: <TriangleAlert className="h-3 w-3" />,
  storage_missing: <CircleX className="h-3 w-3" />,
  library_missing: <CircleX className="h-3 w-3" />,
  api_error: <TriangleAlert className="h-3 w-3" />,
  timeout: <Loader2 className="h-3 w-3" />,
};

const STATUS_LABELS: Record<BunnyConnectionStatus, string> = {
  connected: m.statusConnected,
  disconnected: m.statusDisconnected,
  unauthorized: m.statusUnauthorized,
  region_error: m.statusRegionError,
  storage_missing: m.statusStorageMissing,
  library_missing: m.statusLibraryMissing,
  api_error: m.statusApiError,
  timeout: m.statusTimeout,
};

export function BunnyConnectionBadge({ status }: { status: BunnyConnectionStatus }) {
  return (
    <StudioBadge
      tone={BUNNY_CONNECTION_STATUS_TONE[status] as BadgeTone}
      size="sm"
      icon={ICONS[status]}
    >
      {STATUS_LABELS[status]}
    </StudioBadge>
  );
}
