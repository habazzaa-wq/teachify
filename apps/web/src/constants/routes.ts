/**
 * Centralized route paths. Always reference these instead of hardcoding strings.
 */
export const routes = {
  // Public
  home: "/",
  publicCourse: "/courses",
  // Auth
  login: "/login",
  tenantLogin: "/tenant-login",
  // Teacher control panel (tenant dashboard) — all under /teacher/
  dashboard: "/teacher/dashboard",
  dashboardCourses: "/teacher/courses",
  dashboardCategories: "/teacher/categories",
  dashboardSections: "/teacher/sections",
  dashboardLessons: "/teacher/lessons",
  dashboardStudents: "/teacher/students",
  dashboardContent: "/teacher/content",
  dashboardMedia: "/teacher/media",
  dashboardExams: "/teacher/exams",
  dashboardDiscussions: "/teacher/discussions",
  dashboardNotifications: "/teacher/notifications",
  dashboardAnalytics: "/teacher/analytics",
  dashboardCertificates: "/teacher/certificates",
  dashboardActivityLog: "/teacher/activity-log",
  dashboardAuditLog: "/teacher/audit-log",
  dashboardCalendar: "/teacher/calendar",
  dashboardProfile: "/teacher/profile",
  dashboardHelp: "/teacher/help",
  dashboardSettings: "/teacher/settings",
  homepageNews: "/teacher/homepage/news",
  homepageHero: "/teacher/homepage/hero",
  homepageWhyChooseUs: "/teacher/homepage/why-choose-us",
  homepageEducationalStages: "/teacher/homepage/educational-stages",
  dashboardRolePermissionMatrix: "/teacher/role-permission-matrix",
  dashboardRoles: "/teacher/roles",
  dashboardUsers: "/teacher/users",
  dashboardPermissions: "/teacher/permissions",
  // Tenant-specific route aliases
  tenantDashboard: "/teacher/dashboard",
  tenantCourses: "/teacher/courses",
  tenantSections: "/teacher/sections",
  tenantLessons: "/teacher/lessons",
  tenantStudents: "/teacher/students",
  tenantInstructors: "/teacher/instructors",
  tenantSettings: "/teacher/settings",
  // Platform Super Admin (separate from tenant system)
  superadminLogin: "/superadmin/login",
  superadminDashboard: "/superadmin/dashboard",
  superadminPlans: "/superadmin/dashboard/plans",
  superadminTenants: "/superadmin/dashboard/tenants",
  superadminDomains: "/superadmin/dashboard/domains",
  superadminBunnySettings: "/superadmin/dashboard/bunny-settings",
  superadminBunnyCenter: "/superadmin/dashboard/bunny-center",
} as const;

export type RoutePath = (typeof routes)[keyof typeof routes];

/** True when the path belongs to the platform super-admin app (not tenant dashboard). */
export function isSuperAdminPath(pathname: string): boolean {
  return pathname === routes.superadminLogin
    || pathname.startsWith(`${routes.superadminDashboard}`)
    || pathname.startsWith("/superadmin/");
}
