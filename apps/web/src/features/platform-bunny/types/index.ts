export type BunnyConnectionStatus =
  | "connected"
  | "disconnected"
  | "unauthorized"
  | "region_error"
  | "storage_missing"
  | "library_missing"
  | "api_error"
  | "timeout";

export type BunnyRegion = "de" | "uk" | "gb" | "sg" | "la" | "ny";

export type BunnyPrivacy = "private" | "public" | "paid";

export interface BunnySettings {
  id: number | null;
  storageZoneName: string | null;
  storageZoneRegion: BunnyRegion;
  cdnHostname: string | null;
  libraryId: string | null;
  enabled: boolean;
  defaultPrivacy: BunnyPrivacy;
  defaultExpirationDays: number | null;
  maxUploadSize: number | null;
  chunkSize: number | null;
  enableStream: boolean;
  enableCdn: boolean;
  enableSignedUrls: boolean;
  enableTranscoding: boolean;
  enableResumableUpload: boolean;
  enableDuplicateDetection: boolean;
  enableChecksumValidation: boolean;
  defaultThumbnailTime: number;
  connectionStatus: BunnyConnectionStatus;
  lastError: string | null;
  lastVerifiedAt: string | null;
  hasApiKey: boolean;
  hasStoragePassword: boolean;
  hasStreamApiKey: boolean;
  hasSignedUrlSecret: boolean;
  apiKeyMasked: string | null;
  streamApiKeyMasked: string | null;
  storageZonePasswordMasked: string | null;
  signedUrlSecretMasked: string | null;
  metadata: Record<string, unknown> | null;
  storageZonePasswordValue?: string | null;
  apiKeyValue?: string | null;
  streamApiKeyValue?: string | null;
}

export type BunnySecretField =
  | "api_key"
  | "stream_api_key"
  | "storage_zone_password"
  | "signed_url_secret";

export interface BunnyVerifyResult {
  status: BunnyConnectionStatus;
  error: string | null;
  details: Record<string, unknown>;
}

export interface BunnyRevealResult {
  field: BunnySecretField;
  value: string | null;
}

export const BUNNY_SECTIONS = [
  "connection",
  "storage",
  "streaming",
  "security",
  "upload",
  "verification",
  "danger",
] as const;

export type BunnySection = (typeof BUNNY_SECTIONS)[number];

export interface BunnySectionProps {
  settings: BunnySettings;
  draft: BunnySettings;
  onChange: (patch: Partial<BunnySettings>) => void;
  saving: boolean;
}
