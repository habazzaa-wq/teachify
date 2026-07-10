export type PermissionStatus = "active" | "inactive" | "archived";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type PermissionModule =
  | "dashboard"
  | "users"
  | "roles"
  | "permissions"
  | "courses"
  | "lessons"
  | "students"
  | "teachers"
  | "certificates"
  | "orders"
  | "payments"
  | "analytics"
  | "settings"
  | "media"
  | "notifications"
  | "reports"
  | "api"
  | "integrations"
  | "exam"
  | "question";

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "export"
  | "import"
  | "manage"
  | "approve"
  | "publish"
  | "archive"
  | "restore";

export type PermissionActivityAction =
  | "created"
  | "updated"
  | "imported"
  | "archived"
  | "restored";

export interface TenantPermission {
  id: string;
  tenantId: string;
  key: string;
  nameAr: string;
  nameEn: string;
  module: PermissionModule;
  action: PermissionAction;
  description: string;
  riskLevel: RiskLevel;
  status: PermissionStatus;
  isSystem: boolean;
  isHidden: boolean;
  notes: string;
  rolesCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface TenantPermissionActivity {
  id: string;
  permissionId: string;
  action: PermissionActivityAction;
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface TenantPermissionRole {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  usersCount: number;
  color: string;
}

export interface CreateTenantPermissionPayload {
  key: string;
  nameAr: string;
  nameEn: string;
  module: PermissionModule;
  action: PermissionAction;
  description: string;
  riskLevel: RiskLevel;
  isSystem: boolean;
  isHidden: boolean;
  notes: string;
}

export interface UpdateTenantPermissionPayload {
  nameAr?: string;
  nameEn?: string;
  description?: string;
  riskLevel?: RiskLevel;
  isHidden?: boolean;
  notes?: string;
}

export interface TenantPermissionFilterParams {
  search?: string;
  module?: PermissionModule | "all";
  riskLevel?: RiskLevel | "all";
  isSystem?: boolean | "all";
  dateCreated?: "today" | "week" | "month" | "older" | "all";
  dateUpdated?: "today" | "week" | "month" | "older" | "all";
  sort?: "key" | "nameAr" | "nameEn" | "module" | "riskLevel" | "rolesCount" | "createdAt" | "updatedAt";
  sortDir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface TenantPermissionMetricData {
  totalPermissions: number;
  activePermissions: number;
  inactivePermissions: number;
  archivedPermissions: number;
  systemPermissions: number;
  customPermissions: number;
  totalRolesUsingPermissions: number;
  modulesCovered: number;
}
