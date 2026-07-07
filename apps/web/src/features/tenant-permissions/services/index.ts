import type { TenantPermission, TenantPermissionFilterParams, TenantPermissionMetricData, TenantPermissionActivity, TenantPermissionRole, CreateTenantPermissionPayload, UpdateTenantPermissionPayload } from "../types";
import { mockTenantPermissions, mockPermissionRoles, mockPermissionActivities } from "../mock";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = "app_tenant_permissions";

function getPermissions(): TenantPermission[] {
  if (typeof window === "undefined") return [...mockTenantPermissions];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as TenantPermission[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* empty */ }
  const initial = [...mockTenantPermissions];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); } catch { /* empty */ }
  return initial;
}

function persist(permissions: TenantPermission[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions)); } catch { /* empty */ }
}

export const tenantPermissionsService = {
  async list(params?: TenantPermissionFilterParams): Promise<{ data: TenantPermission[]; total: number }> {
    await delay(400);
    let filtered = [...getPermissions()];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.key.toLowerCase().includes(q) ||
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    if (params?.module && params.module !== "all") {
      filtered = filtered.filter((p) => p.module === params.module);
    }

    if (params?.riskLevel && params.riskLevel !== "all") {
      filtered = filtered.filter((p) => p.riskLevel === params.riskLevel);
    }

    if (params?.isSystem !== undefined && params.isSystem !== "all") {
      filtered = filtered.filter((p) => p.isSystem === params.isSystem);
    }

    if (params?.dateCreated && params.dateCreated !== "all") {
      const now = new Date();
      filtered = filtered.filter((p) => {
        const createdDate = new Date(p.createdAt);
        switch (params.dateCreated) {
          case "today": return createdDate.toDateString() === now.toDateString();
          case "week": return (now.getTime() - createdDate.getTime()) <= 7 * 86400000;
          case "month": return (now.getTime() - createdDate.getTime()) <= 30 * 86400000;
          case "older": return (now.getTime() - createdDate.getTime()) > 30 * 86400000;
          default: return true;
        }
      });
    }

    if (params?.dateUpdated && params.dateUpdated !== "all") {
      const now = new Date();
      filtered = filtered.filter((p) => {
        const updatedDate = new Date(p.updatedAt);
        switch (params.dateUpdated) {
          case "today": return updatedDate.toDateString() === now.toDateString();
          case "week": return (now.getTime() - updatedDate.getTime()) <= 7 * 86400000;
          case "month": return (now.getTime() - updatedDate.getTime()) <= 30 * 86400000;
          case "older": return (now.getTime() - updatedDate.getTime()) > 30 * 86400000;
          default: return true;
        }
      });
    }

    if (params?.sort) {
      const dir = params.sortDir === "desc" ? -1 : 1;
      filtered.sort((a, b) => {
        switch (params.sort) {
          case "key": return a.key.localeCompare(b.key) * dir;
          case "nameAr": return a.nameAr.localeCompare(b.nameAr) * dir;
          case "nameEn": return a.nameEn.localeCompare(b.nameEn) * dir;
          case "module": return a.module.localeCompare(b.module) * dir;
          case "riskLevel": return a.riskLevel.localeCompare(b.riskLevel) * dir;
          case "rolesCount": return (a.rolesCount - b.rolesCount) * dir;
          case "createdAt": return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
          case "updatedAt": return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
          default: return 0;
        }
      });
    }

    return { data: filtered, total: filtered.length };
  },

  async getById(id: string): Promise<TenantPermission | null> {
    await delay(200);
    return getPermissions().find((p) => p.id === id) ?? null;
  },

  async getMetrics(): Promise<TenantPermissionMetricData> {
    await delay(300);
    const permissions = getPermissions();
    const modulesCovered = new Set(permissions.map((p) => p.module)).size;
    return {
      totalPermissions: permissions.length,
      activePermissions: permissions.filter((p) => p.status === "active").length,
      inactivePermissions: permissions.filter((p) => p.status === "inactive").length,
      archivedPermissions: permissions.filter((p) => p.status === "archived").length,
      systemPermissions: permissions.filter((p) => p.isSystem).length,
      customPermissions: permissions.filter((p) => !p.isSystem).length,
      totalRolesUsingPermissions: permissions.reduce((acc, p) => acc + p.rolesCount, 0),
      modulesCovered,
    };
  },

  async create(data: CreateTenantPermissionPayload): Promise<TenantPermission> {
    await delay(500);
    const permissions = getPermissions();
    const now = new Date().toISOString();
    const permission: TenantPermission = {
      id: `perm_${Date.now()}`,
      tenantId: "tenant_01",
      key: data.key,
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      module: data.module,
      action: data.action,
      description: data.description,
      riskLevel: data.riskLevel,
      status: "active",
      isSystem: data.isSystem,
      isHidden: data.isHidden,
      notes: data.notes ?? "",
      rolesCount: 0,
      createdBy: "أحمد محمد",
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    permissions.unshift(permission);
    persist(permissions);
    return permission;
  },

  async update(id: string, data: UpdateTenantPermissionPayload): Promise<TenantPermission | null> {
    await delay(500);
    const permissions = getPermissions();
    const index = permissions.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const updated = {
      ...permissions[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    } as TenantPermission;
    permissions[index] = updated;
    persist(permissions);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const permissions = getPermissions();
    const index = permissions.findIndex((p) => p.id === id);
    if (index !== -1) {
      permissions.splice(index, 1);
      persist(permissions);
    }
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await delay(600);
    const permissions = getPermissions();
    const filtered = permissions.filter((p) => !ids.includes(p.id));
    persist(filtered);
  },

  async archive(id: string): Promise<TenantPermission | null> {
    await delay(300);
    const permissions = getPermissions();
    const permission = permissions.find((p) => p.id === id);
    if (permission) {
      permission.status = "archived";
      permission.archivedAt = new Date().toISOString();
      permission.updatedAt = new Date().toISOString();
      persist(permissions);
    }
    return permission ?? null;
  },

  async restore(id: string): Promise<TenantPermission | null> {
    await delay(300);
    const permissions = getPermissions();
    const permission = permissions.find((p) => p.id === id);
    if (permission) {
      permission.status = "active";
      permission.archivedAt = null;
      permission.updatedAt = new Date().toISOString();
      persist(permissions);
    }
    return permission ?? null;
  },

  async bulkArchive(ids: string[]): Promise<void> {
    await delay(500);
    const permissions = getPermissions();
    const now = new Date().toISOString();
    ids.forEach((id) => {
      const permission = permissions.find((p) => p.id === id);
      if (permission) {
        permission.status = "archived";
        permission.archivedAt = now;
        permission.updatedAt = now;
      }
    });
    persist(permissions);
  },

  async bulkRestore(ids: string[]): Promise<void> {
    await delay(500);
    const permissions = getPermissions();
    const now = new Date().toISOString();
    ids.forEach((id) => {
      const permission = permissions.find((p) => p.id === id);
      if (permission) {
        permission.status = "active";
        permission.archivedAt = null;
        permission.updatedAt = now;
      }
    });
    persist(permissions);
  },

  async getRoles(permissionId: string): Promise<TenantPermissionRole[]> {
    await delay(200);
    return mockPermissionRoles[permissionId] ?? [];
  },

  async getActivities(permissionId: string): Promise<TenantPermissionActivity[]> {
    await delay(200);
    return mockPermissionActivities[permissionId] ?? [];
  },

  async exportCSV(): Promise<void> {
    await delay(300);
    const permissions = getPermissions();
    const headers = ["المفتاح", "الاسم بالعربية", "الاسم بالإنجليزية", "الوحدة", "الإجراء", "المخاطرة", "الحالة", "نظام", "مخفي", "الأدوار", "تاريخ الإنشاء", "تاريخ التحديث"];
    const rows = permissions.map((p) => [
      p.key, p.nameAr, p.nameEn, p.module, p.action, p.riskLevel, p.status,
      p.isSystem ? "نعم" : "لا", p.isHidden ? "نعم" : "لا",
      p.rolesCount.toString(),
      new Date(p.createdAt).toLocaleDateString("ar"), new Date(p.updatedAt).toLocaleDateString("ar"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permissions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
