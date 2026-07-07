/**
 * Centralized route paths. Always reference these instead of hardcoding strings.
 */
export const routes = {
  // Public
  home: "/",
  // Auth
  login: "/login",
  // Dashboard (route group — paths omit the group name)
  dashboard: "/",
  dashboardCourses: "/courses",
  dashboardCategories: "/categories",
  dashboardSections: "/sections",
  dashboardLessons: "/lessons",
  dashboardStudents: "/students",
  dashboardContent: "/content",
  dashboardMedia: "/media",
  dashboardDiscussions: "/discussions",
  dashboardNotifications: "/notifications",
  dashboardAnalytics: "/analytics",
  dashboardCertificates: "/certificates",
  dashboardActivityLog: "/activity-log",
  dashboardAuditLog: "/audit-log",
  dashboardCalendar: "/calendar",
  dashboardProfile: "/profile",
  dashboardHelp: "/help",
  dashboardSettings: "/settings",
  dashboardRolePermissionMatrix: "/role-permission-matrix",
  // Platform Super Admin (separate from tenant system)
  superadminLogin: "/superadmin/login",
  superadminDashboard: "/superadmin/dashboard",
  superadminPlans: "/superadmin/dashboard/plans",
  superadminTenants: "/superadmin/dashboard/tenants",
  superadminDomains: "/superadmin/dashboard/domains",
  // Tenant-specific routes
  tenantLogin: "/tenant-login",
  tenantDashboard: "/dashboard",
  tenantCourses: "/dashboard/courses",
  tenantSections: "/dashboard/sections",
  tenantLessons: "/dashboard/lessons",
  tenantStudents: "/dashboard/students",
  tenantInstructors: "/dashboard/instructors",
  tenantSettings: "/dashboard/settings",
} as const;

export type RoutePath = (typeof routes)[keyof typeof routes];

/** True when the path belongs to the platform super-admin app (not tenant dashboard). */
export function isSuperAdminPath(pathname: string): boolean {
  return pathname === routes.superadminLogin
    || pathname.startsWith(`${routes.superadminDashboard}`)
    || pathname.startsWith("/superadmin/");
}
