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
  | "reports"
  | "settings"
  | "media"
  | "notifications"
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

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface MatrixPermission {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  module: PermissionModule;
  action: PermissionAction;
  description: string;
  riskLevel: RiskLevel;
  isSystem: boolean;
}

export interface MatrixRole {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  color: string;
  isSystem: boolean;
  isDefault: boolean;
  usersCount: number;
  permissionsCount: number;
  priority: number;
}

export interface RolePermissionMatrix {
  roleId: string;
  permissionKey: string;
  enabled: boolean;
}

export type MatrixData = Record<string, Record<string, boolean>>;

export type CloneMode = "replace" | "merge";

export interface CloneRolePayload {
  sourceRoleId: string;
  destinationRoleId: string;
  mode: CloneMode;
}

export interface MatrixMetricData {
  totalRoles: number;
  totalPermissions: number;
  totalAssignments: number;
  rolesWithFullAccess: number;
  rolesWithNoAccess: number;
  highRiskAssignments: number;
  modulesCovered: number;
}

export type ExpandedModules = Record<string, boolean>;
