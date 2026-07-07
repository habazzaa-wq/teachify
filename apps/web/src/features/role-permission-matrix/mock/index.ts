import type { MatrixRole, MatrixPermission, MatrixData } from "../types";

export const mockMatrixRoles: MatrixRole[] = [
  { id: "role_01", name: "Owner", nameAr: "مالك", slug: "owner", icon: "Crown", color: "#6366f1", isSystem: true, isDefault: false, usersCount: 1, permissionsCount: 24, priority: 1 },
  { id: "role_02", name: "Admin", nameAr: "مدير النظام", slug: "admin", icon: "ShieldCheck", color: "#ef4444", isSystem: true, isDefault: false, usersCount: 2, permissionsCount: 22, priority: 2 },
  { id: "role_03", name: "Manager", nameAr: "مدير", slug: "manager", icon: "UserCog", color: "#3b82f6", isSystem: true, isDefault: false, usersCount: 3, permissionsCount: 18, priority: 3 },
  { id: "role_04", name: "Instructor", nameAr: "مدرب", slug: "instructor", icon: "GraduationCap", color: "#22c55e", isSystem: true, isDefault: true, usersCount: 8, permissionsCount: 12, priority: 4 },
  { id: "role_05", name: "Support", nameAr: "دعم", slug: "support", icon: "Headphones", color: "#f59e0b", isSystem: true, isDefault: false, usersCount: 4, permissionsCount: 8, priority: 5 },
  { id: "role_06", name: "Finance", nameAr: "المالية", slug: "finance", icon: "Key", color: "#22c55e", isSystem: true, isDefault: false, usersCount: 2, permissionsCount: 6, priority: 9 },
  { id: "role_07", name: "Marketing", nameAr: "تسويق", slug: "marketing", icon: "Star", color: "#ec4899", isSystem: true, isDefault: false, usersCount: 2, permissionsCount: 5, priority: 7 },
  { id: "role_08", name: "Student Affairs", nameAr: "شؤون الطلاب", slug: "student-affairs", icon: "HeartHandshake", color: "#14b8a6", isSystem: true, isDefault: false, usersCount: 5, permissionsCount: 7, priority: 8 },
  { id: "role_11", name: "Content Manager", nameAr: "مدير محتوى", slug: "custom", icon: "Settings", color: "#06b6d4", isSystem: false, isDefault: false, usersCount: 1, permissionsCount: 10, priority: 50 },
];

export const mockMatrixPermissions: MatrixPermission[] = [
  { id: "perm_01", key: "dashboard.view", nameAr: "عرض لوحة القيادة", nameEn: "View Dashboard", module: "dashboard", action: "view", description: "السماح بعرض لوحة القيادة الرئيسية", riskLevel: "low", isSystem: true },
  { id: "perm_23", key: "users.view", nameAr: "عرض المستخدمين", nameEn: "View Users", module: "users", action: "view", description: "السماح بعرض قائمة المستخدمين وبياناتهم الأساسية", riskLevel: "low", isSystem: true },
  { id: "perm_02", key: "users.create", nameAr: "إنشاء مستخدمين", nameEn: "Create Users", module: "users", action: "create", description: "السماح بإضافة مستخدمين جدد إلى النظام", riskLevel: "medium", isSystem: true },
  { id: "perm_03", key: "users.update", nameAr: "تعديل المستخدمين", nameEn: "Update Users", module: "users", action: "update", description: "السماح بتعديل بيانات المستخدمين", riskLevel: "medium", isSystem: true },
  { id: "perm_04", key: "users.delete", nameAr: "حذف المستخدمين", nameEn: "Delete Users", module: "users", action: "delete", description: "السماح بحذف المستخدمين من النظام", riskLevel: "high", isSystem: true },
  { id: "perm_24", key: "users.export", nameAr: "تصدير المستخدمين", nameEn: "Export Users", module: "users", action: "export", description: "السماح بتصدير بيانات المستخدمين", riskLevel: "high", isSystem: true },
  { id: "perm_25", key: "roles.view", nameAr: "عرض الأدوار", nameEn: "View Roles", module: "roles", action: "view", description: "السماح بعرض قائمة الأدوار", riskLevel: "low", isSystem: true },
  { id: "perm_05", key: "roles.create", nameAr: "إنشاء أدوار", nameEn: "Create Roles", module: "roles", action: "create", description: "السماح بإنشاء أدوار جديدة وتحديد صلاحياتها", riskLevel: "high", isSystem: true },
  { id: "perm_26", key: "roles.update", nameAr: "تعديل الأدوار", nameEn: "Update Roles", module: "roles", action: "update", description: "السماح بتعديل الأدوار الموجودة", riskLevel: "high", isSystem: true },
  { id: "perm_27", key: "roles.delete", nameAr: "حذف الأدوار", nameEn: "Delete Roles", module: "roles", action: "delete", description: "السماح بحذف الأدوار من النظام", riskLevel: "critical", isSystem: true },
  { id: "perm_28", key: "permissions.view", nameAr: "عرض الصلاحيات", nameEn: "View Permissions", module: "permissions", action: "view", description: "السماح بعرض قائمة الصلاحيات", riskLevel: "low", isSystem: true },
  { id: "perm_29", key: "permissions.manage", nameAr: "إدارة الصلاحيات", nameEn: "Manage Permissions", module: "permissions", action: "manage", description: "السماح بإدارة الصلاحيات وتعديلها", riskLevel: "critical", isSystem: true },
  { id: "perm_30", key: "courses.view", nameAr: "عرض الدورات", nameEn: "View Courses", module: "courses", action: "view", description: "السماح بعرض قائمة الدورات ومحتواها", riskLevel: "low", isSystem: true },
  { id: "perm_31", key: "courses.create", nameAr: "إنشاء دورات", nameEn: "Create Courses", module: "courses", action: "create", description: "السماح بإنشاء دورات تعليمية جديدة", riskLevel: "medium", isSystem: true },
  { id: "perm_32", key: "courses.update", nameAr: "تعديل الدورات", nameEn: "Update Courses", module: "courses", action: "update", description: "السماح بتعديل الدورات الموجودة", riskLevel: "medium", isSystem: true },
  { id: "perm_33", key: "courses.delete", nameAr: "حذف الدورات", nameEn: "Delete Courses", module: "courses", action: "delete", description: "السماح بحذف الدورات من النظام", riskLevel: "high", isSystem: true },
  { id: "perm_34", key: "courses.publish", nameAr: "نشر الدورات", nameEn: "Publish Courses", module: "courses", action: "publish", description: "السماح بنشر الدورات وجعلها متاحة للطلاب", riskLevel: "medium", isSystem: true },
  { id: "perm_35", key: "lessons.view", nameAr: "عرض الدروس", nameEn: "View Lessons", module: "lessons", action: "view", description: "السماح بعرض قائمة الدروس", riskLevel: "low", isSystem: true },
  { id: "perm_36", key: "lessons.create", nameAr: "إنشاء دروس", nameEn: "Create Lessons", module: "lessons", action: "create", description: "السماح بإنشاء دروس جديدة", riskLevel: "medium", isSystem: true },
  { id: "perm_37", key: "lessons.update", nameAr: "تعديل الدروس", nameEn: "Update Lessons", module: "lessons", action: "update", description: "السماح بتعديل الدروس الموجودة", riskLevel: "medium", isSystem: true },
  { id: "perm_38", key: "lessons.delete", nameAr: "حذف الدروس", nameEn: "Delete Lessons", module: "lessons", action: "delete", description: "السماح بحذف الدروس", riskLevel: "high", isSystem: true },
  { id: "perm_39", key: "students.view", nameAr: "عرض الطلاب", nameEn: "View Students", module: "students", action: "view", description: "السماح بعرض قائمة الطلاب وبياناتهم", riskLevel: "low", isSystem: true },
  { id: "perm_40", key: "students.create", nameAr: "إنشاء طلاب", nameEn: "Create Students", module: "students", action: "create", description: "السماح بإضافة طلاب جدد", riskLevel: "medium", isSystem: true },
  { id: "perm_41", key: "students.update", nameAr: "تعديل بيانات الطلاب", nameEn: "Update Students", module: "students", action: "update", description: "السماح بتعديل بيانات الطلاب", riskLevel: "medium", isSystem: true },
  { id: "perm_42", key: "students.delete", nameAr: "حذف الطلاب", nameEn: "Delete Students", module: "students", action: "delete", description: "السماح بحذف الطلاب", riskLevel: "high", isSystem: true },
  { id: "perm_43", key: "students.export", nameAr: "تصدير بيانات الطلاب", nameEn: "Export Students", module: "students", action: "export", description: "السماح بتصدير بيانات الطلاب", riskLevel: "high", isSystem: true },
  { id: "perm_44", key: "teachers.view", nameAr: "عرض المدربين", nameEn: "View Teachers", module: "teachers", action: "view", description: "السماح بعرض قائمة المدربين", riskLevel: "low", isSystem: true },
  { id: "perm_45", key: "teachers.approve", nameAr: "الموافقة على المدربين", nameEn: "Approve Teachers", module: "teachers", action: "approve", description: "السماح بالموافقة على طلبات تسجيل المدربين", riskLevel: "medium", isSystem: true },
  { id: "perm_46", key: "certificates.view", nameAr: "عرض الشهادات", nameEn: "View Certificates", module: "certificates", action: "view", description: "السماح بعرض الشهادات", riskLevel: "low", isSystem: true },
  { id: "perm_47", key: "certificates.manage", nameAr: "إدارة الشهادات", nameEn: "Manage Certificates", module: "certificates", action: "manage", description: "السماح بإدارة الشهادات وإصدارها", riskLevel: "medium", isSystem: true },
  { id: "perm_48", key: "orders.view", nameAr: "عرض الطلبات", nameEn: "View Orders", module: "orders", action: "view", description: "السماح بعرض الطلبات", riskLevel: "low", isSystem: true },
  { id: "perm_49", key: "orders.manage", nameAr: "إدارة الطلبات", nameEn: "Manage Orders", module: "orders", action: "manage", description: "السماح بإدارة الطلبات والمشتريات", riskLevel: "medium", isSystem: true },
  { id: "perm_50", key: "payments.view", nameAr: "عرض المدفوعات", nameEn: "View Payments", module: "payments", action: "view", description: "السماح بعرض سجلات المدفوعات", riskLevel: "medium", isSystem: true },
  { id: "perm_51", key: "payments.manage", nameAr: "إدارة المدفوعات", nameEn: "Manage Payments", module: "payments", action: "manage", description: "السماح بإدارة المدفوعات", riskLevel: "high", isSystem: true },
  { id: "perm_52", key: "payments.delete", nameAr: "حذف المدفوعات", nameEn: "Delete Payments", module: "payments", action: "delete", description: "السماح بحذف سجلات المدفوعات", riskLevel: "critical", isSystem: true },
  { id: "perm_53", key: "analytics.view", nameAr: "عرض التحليلات", nameEn: "View Analytics", module: "analytics", action: "view", description: "السماح بعرض التقارير والتحليلات", riskLevel: "low", isSystem: true },
  { id: "perm_54", key: "analytics.export", nameAr: "تصدير التحليلات", nameEn: "Export Analytics", module: "analytics", action: "export", description: "السماح بتصدير التقارير التحليلية", riskLevel: "medium", isSystem: true },
  { id: "perm_55", key: "reports.view", nameAr: "عرض التقارير", nameEn: "View Reports", module: "reports", action: "view", description: "السماح بعرض التقارير", riskLevel: "low", isSystem: true },
  { id: "perm_56", key: "reports.export", nameAr: "تصدير التقارير", nameEn: "Export Reports", module: "reports", action: "export", description: "السماح بتصدير التقارير", riskLevel: "high", isSystem: true },
  { id: "perm_57", key: "settings.view", nameAr: "عرض الإعدادات", nameEn: "View Settings", module: "settings", action: "view", description: "السماح بعرض الإعدادات", riskLevel: "low", isSystem: true },
  { id: "perm_58", key: "settings.manage", nameAr: "إدارة الإعدادات", nameEn: "Manage Settings", module: "settings", action: "manage", description: "السماح بإدارة إعدادات المنصة", riskLevel: "critical", isSystem: true },
  { id: "perm_59", key: "media.view", nameAr: "عرض الوسائط", nameEn: "View Media", module: "media", action: "view", description: "السماح بعرض ملفات الوسائط", riskLevel: "low", isSystem: true },
  { id: "perm_60", key: "media.upload", nameAr: "رفع الوسائط", nameEn: "Upload Media", module: "media", action: "create", description: "السماح برفع ملفات الوسائط", riskLevel: "low", isSystem: true },
  { id: "perm_61", key: "media.delete", nameAr: "حذف الوسائط", nameEn: "Delete Media", module: "media", action: "delete", description: "السماح بحذف ملفات الوسائط", riskLevel: "medium", isSystem: true },
  { id: "perm_62", key: "notifications.view", nameAr: "عرض الإشعارات", nameEn: "View Notifications", module: "notifications", action: "view", description: "السماح بعرض الإشعارات", riskLevel: "low", isSystem: true },
  { id: "perm_63", key: "notifications.manage", nameAr: "إدارة الإشعارات", nameEn: "Manage Notifications", module: "notifications", action: "manage", description: "السماح بإدارة الإشعارات", riskLevel: "medium", isSystem: true },
  { id: "perm_64", key: "api.view", nameAr: "عرض API", nameEn: "View API", module: "api", action: "view", description: "السماح بعرض إعدادات API", riskLevel: "medium", isSystem: true },
  { id: "perm_65", key: "api.manage", nameAr: "إدارة API", nameEn: "Manage API", module: "api", action: "manage", description: "السماح بإدارة مفاتيح API", riskLevel: "critical", isSystem: true },
  { id: "perm_66", key: "integrations.view", nameAr: "عرض التكاملات", nameEn: "View Integrations", module: "integrations", action: "view", description: "السماح بعرض التكاملات", riskLevel: "medium", isSystem: true },
  { id: "perm_67", key: "integrations.manage", nameAr: "إدارة التكاملات", nameEn: "Manage Integrations", module: "integrations", action: "manage", description: "السماح بإدارة التكاملات", riskLevel: "high", isSystem: true },
];

export const mockInitialMatrix: MatrixData = {
  role_01: Object.fromEntries(mockMatrixPermissions.map((p) => [p.key, true])),
  role_02: Object.fromEntries(mockMatrixPermissions.map((p) => [p.key, true])),
  role_03: Object.fromEntries(
    mockMatrixPermissions.map((p) => [
      p.key,
      ["dashboard", "users", "courses", "lessons", "students", "teachers", "analytics", "reports", "media", "notifications"].includes(p.module),
    ]),
  ),
  role_04: Object.fromEntries(
    mockMatrixPermissions.map((p) => [
      p.key,
      ["courses", "lessons", "students", "media"].includes(p.module),
    ]),
  ),
  role_05: Object.fromEntries(
    mockMatrixPermissions.map((p) => [
      p.key,
      ["dashboard", "users", "courses", "students", "notifications"].includes(p.module) && ["view", "update"].includes(p.action),
    ]),
  ),
  role_06: Object.fromEntries(
    mockMatrixPermissions.map((p) => [
      p.key,
      ["dashboard", "orders", "payments", "reports"].includes(p.module),
    ]),
  ),
  role_07: Object.fromEntries(
    mockMatrixPermissions.map((p) => [
      p.key,
      ["dashboard", "courses", "analytics", "reports", "media"].includes(p.module) && ["view", "export"].includes(p.action),
    ]),
  ),
  role_08: Object.fromEntries(
    mockMatrixPermissions.map((p) => [
      p.key,
      ["dashboard", "students", "courses", "certificates", "notifications"].includes(p.module) && ["view", "update", "create"].includes(p.action),
    ]),
  ),
  role_11: Object.fromEntries(
    mockMatrixPermissions.map((p) => [
      p.key,
      ["courses", "lessons", "media"].includes(p.module),
    ]),
  ),
};

export function getMatrixMetrics(matrix: MatrixData): { totalAssignments: number; rolesWithFullAccess: number; rolesWithNoAccess: number; highRiskAssignments: number } {
  const roles = Object.keys(matrix);
  const totalPermissions = mockMatrixPermissions.length;
  const highRiskKeys = new Set(mockMatrixPermissions.filter((p) => p.riskLevel === "high" || p.riskLevel === "critical").map((p) => p.key));

  let totalAssignments = 0;
  let rolesWithFullAccess = 0;
  let rolesWithNoAccess = 0;
  let highRiskAssignments = 0;

  for (const roleId of roles) {
    const perms = matrix[roleId] ?? {};
    const assigned = Object.keys(perms).filter((k) => perms[k]);
    totalAssignments += assigned.length;
    if (assigned.length === totalPermissions) rolesWithFullAccess++;
    if (assigned.length === 0) rolesWithNoAccess++;
    highRiskAssignments += assigned.filter((k) => highRiskKeys.has(k)).length;
  }

  return { totalAssignments, rolesWithFullAccess, rolesWithNoAccess, highRiskAssignments };
}
