import type { DomainType, DomainStatus, SslStatus, DnsStatus, VerificationStatus, HealthStatus } from "../types";

export const DOMAINS_QUERY_KEY = "platform-domains";

export const DOMAIN_TYPE_CONFIG: Record<DomainType, { label: string; color: "default" | "secondary" | "destructive" | "success" | "warning" | "outline" }> = {
  platform: { label: "النظام الأساسي", color: "secondary" },
  custom: { label: "مخصص", color: "success" },
  wildcard: { label: "شامل", color: "warning" },
  temporary: { label: "مؤقت", color: "outline" },
};

export const DOMAIN_STATUS_CONFIG: Record<DomainStatus, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "warning" },
  active: { label: "نشط", color: "success" },
  failed: { label: "فشل", color: "destructive" },
  removed: { label: "تمت الإزالة", color: "outline" },
};

export const SSL_STATUS_CONFIG: Record<SslStatus, { label: string; color: string }> = {
  active: { label: "نشط", color: "success" },
  pending: { label: "قيد الإصدار", color: "warning" },
  expired: { label: "منتهي", color: "destructive" },
  error: { label: "خطأ", color: "destructive" },
  none: { label: "غير مثبت", color: "outline" },
};

export const DNS_STATUS_CONFIG: Record<DnsStatus, { label: string; color: string }> = {
  verified: { label: "موثّق", color: "success" },
  pending: { label: "قيد التحقق", color: "warning" },
  failed: { label: "فشل", color: "destructive" },
  unconfigured: { label: "غير مهيأ", color: "outline" },
};

export const VERIFICATION_STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "secondary" },
  dns_found: { label: "تم العثور على DNS", color: "info" },
  ssl_requested: { label: "تم طلب SSL", color: "warning" },
  ssl_issued: { label: "تم إصدار SSL", color: "info" },
  active: { label: "نشط", color: "success" },
};

export const HEALTH_STATUS_CONFIG: Record<HealthStatus, { label: string; color: string }> = {
  healthy: { label: "سليم", color: "success" },
  degraded: { label: "أداء ضعيف", color: "warning" },
  unhealthy: { label: "غير صحي", color: "destructive" },
  unknown: { label: "غير معروف", color: "outline" },
};

export const TYPE_OPTIONS = [
  { value: "all", label: "جميع الأنواع" },
  { value: "platform", label: "النظام الأساسي" },
  { value: "custom", label: "مخصص" },
  { value: "wildcard", label: "شامل" },
  { value: "temporary", label: "مؤقت" },
];

export const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "active", label: "نشط" },
  { value: "failed", label: "فشل" },
  { value: "removed", label: "تمت الإزالة" },
];

export const SSL_OPTIONS = [
  { value: "all", label: "جميع حالات SSL" },
  { value: "active", label: "نشط" },
  { value: "pending", label: "قيد الإصدار" },
  { value: "expired", label: "منتهي" },
  { value: "error", label: "خطأ" },
  { value: "none", label: "غير مثبت" },
];

export const VERIFICATION_OPTIONS = [
  { value: "all", label: "جميع حالات التحقق" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "dns_found", label: "تم العثور على DNS" },
  { value: "ssl_requested", label: "تم طلب SSL" },
  { value: "ssl_issued", label: "تم إصدار SSL" },
  { value: "active", label: "نشط" },
];

export const DNS_OPTIONS = [
  { value: "all", label: "جميع حالات DNS" },
  { value: "verified", label: "موثّق" },
  { value: "pending", label: "قيد التحقق" },
  { value: "failed", label: "فشل" },
  { value: "unconfigured", label: "غير مهيأ" },
];

export const SORT_OPTIONS = [
  { value: "domain", label: "النطاق" },
  { value: "tenantName", label: "اسم العميل" },
  { value: "health.lastChecked", label: "آخر فحص" },
  { value: "status", label: "الحالة" },
];

export const DNS_RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS"] as const;
