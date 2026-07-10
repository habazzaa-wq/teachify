import type { BunnyConnectionStatus, BunnyRegion, BunnySection } from "../types";

export const BUNNY_SETTINGS_QUERY_KEY = "platform-bunny-settings" as const;

export const BUNNY_PERMISSION = "platform.settings.bunny" as const;

export const BUNNY_REGIONS: BunnyRegion[] = ["de", "uk", "gb", "sg", "la", "ny"];

export const BUNNY_PRIVACY_OPTIONS: ("private" | "public" | "paid")[] = [
  "private",
  "public",
  "paid",
];

export const BUNNY_SECTION_ORDER: BunnySection[] = [
  "connection",
  "storage",
  "streaming",
  "security",
  "upload",
  "verification",
  "danger",
];

export const BUNNY_SECTION_ICONS: Record<BunnySection, string> = {
  connection: "plug",
  storage: "database",
  streaming: "radio",
  security: "shield",
  upload: "upload",
  verification: "activity",
  danger: "alert-triangle",
};

export const BUNNY_CONNECTION_STATUS_TONE: Record<
  BunnyConnectionStatus,
  "success" | "danger" | "warning" | "info" | "default"
> = {
  connected: "success",
  disconnected: "default",
  unauthorized: "danger",
  region_error: "warning",
  storage_missing: "danger",
  library_missing: "danger",
  api_error: "danger",
  timeout: "warning",
};
