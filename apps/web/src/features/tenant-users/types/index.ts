export type UserStatus = "active" | "inactive" | "suspended";

export type UserRoleSlug =
  | "owner"
  | "admin"
  | "manager"
  | "instructor"
  | "support"
  | "reviewer"
  | "marketing"
  | "sales"
  | "custom";

export type DepartmentSlug =
  | "management"
  | "academic"
  | "support"
  | "marketing"
  | "sales"
  | "finance"
  | "hr"
  | "it"
  | "operations";

export interface TenantUserRole {
  id: string;
  name: string;
  slug: UserRoleSlug;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  avatar: string | null;
  fullName: string;
  email: string;
  phone: string;
  department: DepartmentSlug;
  jobTitle: string;
  role: TenantUserRole;
  status: UserStatus;
  twoFactorEnabled: boolean;
  language: string;
  timezone: string;
  lastLogin: string | null;
  lastPasswordChange: string | null;
  recoveryEmail: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUserActivity {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface TenantUserDevice {
  id: string;
  userId: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  os: string;
  browser: string;
  ipAddress: string;
  lastUsed: string;
  trusted: boolean;
}

export interface TenantUserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  isCurrent: boolean;
  lastActive: string;
  createdAt: string;
}

export interface TenantUserSecurity {
  twoFactorEnabled: boolean;
  lastPasswordChange: string | null;
  recoveryEmail: string | null;
  trustedDevices: number;
  activeSessions: number;
  failedLoginAttempts: number;
}

export interface CreateTenantUserPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  department: DepartmentSlug;
  jobTitle: string;
  roleSlug: UserRoleSlug;
  status: UserStatus;
  language: string;
  timezone: string;
  avatar: string | null;
  notes: string;
}

export interface UpdateTenantUserPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  department?: DepartmentSlug;
  jobTitle?: string;
  roleSlug?: UserRoleSlug;
  status?: UserStatus;
  language?: string;
  timezone?: string;
  avatar?: string | null;
  notes?: string;
}

export interface TenantUserFilterParams {
  search?: string;
  status?: UserStatus | "all";
  department?: DepartmentSlug | "all";
  role?: UserRoleSlug | "all";
  twoFactor?: boolean | "all";
  lastLogin?: "today" | "week" | "month" | "older" | "all";
  dateCreated?: "today" | "week" | "month" | "older" | "all";
  sort?: "fullName" | "email" | "createdAt" | "lastLogin" | "status";
  sortDir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface TenantUserMetricData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  twoFactorEnabled: number;
  newThisMonth: number;
  departmentCount: number;
  pendingInvites: number;
}
