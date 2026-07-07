export type RoleStatus = "active" | "inactive" | "archived";

export type RoleSlug =
  | "owner"
  | "admin"
  | "manager"
  | "instructor"
  | "support"
  | "reviewer"
  | "marketing"
  | "sales"
  | "student-affairs"
  | "finance"
  | "custom";

export interface TenantRole {
  id: string;
  tenantId: string;
  name: string;
  nameAr: string;
  description: string;
  slug: RoleSlug;
  icon: string;
  color: string;
  status: RoleStatus;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  usersCount: number;
  permissionsCount: number;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface TenantRoleActivity {
  id: string;
  roleId: string;
  action: "created" | "edited" | "assigned" | "unassigned" | "imported" | "archived" | "restored" | "activated" | "deactivated" | "duplicated";
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface TenantRoleUser {
  id: string;
  fullName: string;
  email: string;
  department: string;
  status: string;
  avatar: string | null;
}

export interface CreateTenantRolePayload {
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  color: string;
  status: RoleStatus;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  notes: string;
}

export interface UpdateTenantRolePayload {
  name?: string;
  nameAr?: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: RoleStatus;
  isSystem?: boolean;
  isDefault?: boolean;
  priority?: number;
  notes?: string;
}

export interface TenantRoleFilterParams {
  search?: string;
  status?: RoleStatus | "all";
  isSystem?: boolean | "all";
  isDefault?: boolean | "all";
  usersCount?: "none" | "few" | "many" | "all";
  dateCreated?: "today" | "week" | "month" | "older" | "all";
  dateUpdated?: "today" | "week" | "month" | "older" | "all";
  sort?: "name" | "nameAr" | "usersCount" | "permissionsCount" | "priority" | "createdAt" | "updatedAt" | "status";
  sortDir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface TenantRoleMetricData {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  archivedRoles: number;
  systemRoles: number;
  customRoles: number;
  totalUsersInRoles: number;
  totalPermissions: number;
}
