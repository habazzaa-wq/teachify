export const INTEGRATIONS_QUERY_KEY = "tenant-integrations" as const;

export const INTEGRATION_STATUS_CONFIG = {
  pending: { label: "قيد الانتظار", color: "warning" },
  active: { label: "نشط", color: "success" },
  failed: { label: "فشل", color: "destructive" },
  disconnected: { label: "غير متصل", color: "muted" },
} as const;

export const KNOWN_PROVIDERS = ["bunny", "smtp", "sso", "google", "zoom", "webhook"] as const;
