export const PLATFORM_ADMINS_QUERY_KEY = "platform-admins" as const;

export const ADMIN_ROLE_CONFIG = {
  super_admin: { label: "مدير عام", color: "destructive" },
  support: { label: "دعم فني", color: "info" },
  analyst: { label: "محلل", color: "success" },
} as const;

export const ADMIN_STATUS_CONFIG = {
  active: { label: "نشط", color: "success" },
  inactive: { label: "غير نشط", color: "warning" },
  suspended: { label: "موقوف", color: "destructive" },
} as const;
