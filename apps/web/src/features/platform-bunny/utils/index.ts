import type { BunnySettings } from "../types";

const SNAKE_MAP: Record<string, string> = {
  storageZoneName: "storage_zone_name",
  storageZonePassword: "storage_zone_password",
  storageZoneRegion: "storage_zone_region",
  cdnHostname: "cdn_hostname",
  libraryId: "library_id",
  apiKey: "api_key",
  streamApiKey: "stream_api_key",
  signedUrlSecret: "signed_url_secret",
  defaultPrivacy: "default_privacy",
  defaultExpirationDays: "default_expiration_days",
  maxUploadSize: "max_upload_size",
  chunkSize: "chunk_size",
  enableStream: "enable_stream",
  enableCdn: "enable_cdn",
  enableSignedUrls: "enable_signed_urls",
  enableTranscoding: "enable_transcoding",
  defaultThumbnailTime: "default_thumbnail_time",
  connectionStatus: "connection_status",
  lastError: "last_error",
  lastVerifiedAt: "last_verified_at",
  metadata: "metadata",
  enabled: "enabled",
};

/**
 * Convert a camelCase partial settings object into the snake_case keys
 * expected by the Laravel API. Empty strings are dropped so they are not
 * persisted as empty credentials.
 */
export function toSnakeCase(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    const snake = SNAKE_MAP[key] ?? key;
    if (value === "" || value === undefined) {
      continue;
    }
    out[snake] = value;
  }

  return out;
}

export function coerceInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function coerceIntOrZero(value: string): number {
  const parsed = coerceInt(value);
  return parsed ?? 0;
}

/**
 * Client-side mask for display of a revealed secret when re-hiding it.
 */
export function maskSecret(value: string | null): string | null {
  if (value === null || value === "") {
    return null;
  }
  const len = value.length;
  if (len <= 8) {
    return "•".repeat(len);
  }
  return value.slice(0, 4) + "•".repeat(Math.max(4, len - 8)) + value.slice(-4);
}

/**
 * Build the API payload from the local draft, mapping transient
 * password fields onto their API counterparts and including only
 * provided credential values.
 */
export function buildUpdatePayload(
  draft: BunnySettings,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    storageZoneName: draft.storageZoneName,
    storageZoneRegion: draft.storageZoneRegion ?? "de",
    cdnHostname: draft.cdnHostname,
    libraryId: draft.libraryId,
    defaultPrivacy: draft.defaultPrivacy ?? "private",
    defaultExpirationDays: draft.defaultExpirationDays,
    maxUploadSize: draft.maxUploadSize,
    chunkSize: draft.chunkSize,
    enableStream: draft.enableStream,
    enableCdn: draft.enableCdn,
    enableSignedUrls: draft.enableSignedUrls,
    enableTranscoding: draft.enableTranscoding,
    enableResumableUpload: draft.enableResumableUpload,
    enableDuplicateDetection: draft.enableDuplicateDetection,
    enableChecksumValidation: draft.enableChecksumValidation,
    defaultThumbnailTime: draft.defaultThumbnailTime,
    enabled: draft.enabled,
  };

  if (draft.storageZonePasswordValue) {
    payload.storageZonePassword = draft.storageZonePasswordValue;
  }
  if (draft.apiKeyValue) {
    payload.apiKey = draft.apiKeyValue;
  }
  if (draft.streamApiKeyValue) {
    payload.streamApiKey = draft.streamApiKeyValue;
  }

  return payload;
}

export function emptyBunnySettings(): BunnySettings {  return {
    id: null,
    storageZoneName: null,
    storageZoneRegion: "de",
    cdnHostname: null,
    libraryId: null,
    enabled: false,
    defaultPrivacy: "private",
    defaultExpirationDays: null,
    maxUploadSize: null,
    chunkSize: null,
    enableStream: false,
    enableCdn: false,
    enableSignedUrls: false,
    enableTranscoding: false,
    enableResumableUpload: false,
    enableDuplicateDetection: false,
    enableChecksumValidation: false,
    defaultThumbnailTime: 0,
    connectionStatus: "disconnected",
    lastError: null,
    lastVerifiedAt: null,
    hasApiKey: false,
    hasStoragePassword: false,
    hasStreamApiKey: false,
    hasSignedUrlSecret: false,
    apiKeyMasked: null,
    streamApiKeyMasked: null,
    storageZonePasswordMasked: null,
    signedUrlSecretMasked: null,
    metadata: null,
  };
}
