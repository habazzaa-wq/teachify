import type { Tenant, OwnerProfile, LastLoginInfo, OwnerSecurityInfo, OwnerStatusType } from "../types";

const IP_ADDRESSES = ["185.92.220.1", "91.108.56.100", "45.33.32.156", "103.235.46.92", "78.46.89.12"];
const BROWSERS = ["Chrome 125.0", "Firefox 128.0", "Edge 126.0", "Safari 17.5", "Opera 112.0"];
const OS_LIST = ["Windows 11", "macOS Sonoma 14.5", "Ubuntu 24.04", "iOS 17.5", "Android 14"];
const DEVICES = ["Desktop", "MacBook Pro", "iPhone 15", "Samsung Galaxy S24", "iPad Pro"];
const COUNTRIES = ["السعودية", "الإمارات", "مصر", "الأردن", "الولايات المتحدة"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateLastLoginDate(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return new Date().toISOString();
  const now = Date.now();
  const range = now - created;
  return new Date(created + Math.random() * range).toISOString();
}

const OWNER_ROLES = ["مالك", "مدير عام", "مدير تنفيذي", "رئيس مجلس إدارة", "مؤسس"];

function mapStatus(tenantStatus: string): OwnerStatusType {
  switch (tenantStatus) {
    case "active": return "active";
    case "suspended": return "suspended";
    case "pending": return "pending";
    case "trial": return "active";
    case "archived": return "inactive";
    case "cancelled": return "inactive";
    case "expired": return "inactive";
    default: return "active";
  }
}

export function getOwnerProfile(tenant: Tenant): OwnerProfile {
  const owner = tenant.owner ?? { name: "", email: "", phone: "" };
  return {
    id: tenant.id,
    avatar: tenant.logo,
    fullName: owner.name,
    email: owner.email,
    phone: owner.phone,
    role: pick(OWNER_ROLES),
    status: mapStatus(tenant.status),
    createdAt: tenant.createdAt,
    lastLogin: generateLastLoginDate(tenant.createdAt),
    lastLoginIP: pick(IP_ADDRESSES),
    lastBrowser: pick(BROWSERS),
    passwordLastChanged: tenant.security?.passwordLastChanged ?? tenant.createdAt,
    twoFactorEnabled: tenant.security?.twoFactorEnabled ?? false,
    recoveryEmail: `recovery-${owner.email}`,
    passwordStrength: (["weak", "medium", "strong"] as const)[Math.floor(Math.random() * 3)]!,
    trustedDevicesCount: Math.floor(Math.random() * 8) + 1,
    failedLoginAttempts: Math.floor(Math.random() * 10),
  };
}

export function getLastLoginInfo(profile: OwnerProfile): LastLoginInfo {
  const date = new Date(profile.lastLogin);
  return {
    date: profile.lastLogin,
    time: date.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }),
    country: pick(COUNTRIES),
    ip: profile.lastLoginIP,
    browser: profile.lastBrowser,
    operatingSystem: pick(OS_LIST),
    device: pick(DEVICES),
  };
}

export function getOwnerSecurityInfo(profile: OwnerProfile): OwnerSecurityInfo {
  return {
    failedLoginAttempts: profile.failedLoginAttempts,
    passwordStrength: profile.passwordStrength,
    twoFactorEnabled: profile.twoFactorEnabled,
    recoveryEmail: profile.recoveryEmail,
    trustedDevicesCount: profile.trustedDevicesCount,
  };
}
