import type { TenantRole, TenantRoleFilterParams, TenantRoleMetricData, TenantRoleActivity, TenantRoleUser, CreateTenantRolePayload, UpdateTenantRolePayload } from "../types";
import { mockTenantRoles, mockRoleUsers, mockRoleActivities, getTenantRolesMetrics } from "../mock";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = "app_tenant_roles";

function getRoles(): TenantRole[] {
  if (typeof window === "undefined") return [...mockTenantRoles];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as TenantRole[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* empty */ }
  const initial = [...mockTenantRoles];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); } catch { /* empty */ }
  return initial;
}

function persist(roles: TenantRole[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(roles)); } catch { /* empty */ }
}

export const tenantRolesService = {
  async list(params?: TenantRoleFilterParams): Promise<{ data: TenantRole[]; total: number }> {
    await delay(400);
    let filtered = [...getRoles()];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.nameAr.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }

    if (params?.status && params.status !== "all") {
      filtered = filtered.filter((r) => r.status === params.status);
    }

    if (params?.isSystem !== undefined && params.isSystem !== "all") {
      filtered = filtered.filter((r) => r.isSystem === params.isSystem);
    }

    if (params?.isDefault !== undefined && params.isDefault !== "all") {
      filtered = filtered.filter((r) => r.isDefault === params.isDefault);
    }

    if (params?.usersCount && params.usersCount !== "all") {
      filtered = filtered.filter((r) => {
        switch (params.usersCount) {
          case "none": return r.usersCount === 0;
          case "few": return r.usersCount < 10;
          case "many": return r.usersCount >= 10;
          default: return true;
        }
      });
    }

    if (params?.dateCreated && params.dateCreated !== "all") {
      const now = new Date();
      filtered = filtered.filter((r) => {
        const createdDate = new Date(r.createdAt);
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
      filtered = filtered.filter((r) => {
        const updatedDate = new Date(r.updatedAt);
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
          case "name": return a.name.localeCompare(b.name) * dir;
          case "nameAr": return a.nameAr.localeCompare(b.nameAr) * dir;
          case "usersCount": return (a.usersCount - b.usersCount) * dir;
          case "permissionsCount": return (a.permissionsCount - b.permissionsCount) * dir;
          case "priority": return (a.priority - b.priority) * dir;
          case "createdAt": return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
          case "updatedAt": return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
          case "status": return a.status.localeCompare(b.status) * dir;
          default: return 0;
        }
      });
    }

    return { data: filtered, total: filtered.length };
  },

  async getById(id: string): Promise<TenantRole | null> {
    await delay(200);
    return getRoles().find((r) => r.id === id) ?? null;
  },

  async getMetrics(): Promise<TenantRoleMetricData> {
    await delay(300);
    const roles = getRoles();
    return {
      totalRoles: roles.length,
      activeRoles: roles.filter((r) => r.status === "active").length,
      inactiveRoles: roles.filter((r) => r.status === "inactive").length,
      archivedRoles: roles.filter((r) => r.status === "archived").length,
      systemRoles: roles.filter((r) => r.isSystem).length,
      customRoles: roles.filter((r) => !r.isSystem).length,
      totalUsersInRoles: roles.reduce((acc, r) => acc + r.usersCount, 0),
      totalPermissions: roles.reduce((acc, r) => acc + r.permissionsCount, 0),
    };
  },

  async create(data: CreateTenantRolePayload): Promise<TenantRole> {
    await delay(500);
    const roles = getRoles();
    const now = new Date().toISOString();
    const role: TenantRole = {
      id: `role_${Date.now()}`,
      tenantId: "tenant_01",
      name: data.name,
      nameAr: data.nameAr,
      description: data.description,
      slug: data.isSystem ? "custom" : "custom",
      icon: data.icon,
      color: data.color,
      status: data.status,
      isSystem: data.isSystem,
      isDefault: data.isDefault,
      priority: data.priority,
      usersCount: 0,
      permissionsCount: 0,
      notes: data.notes ?? "",
      createdBy: "أحمد محمد",
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    roles.unshift(role);
    persist(roles);
    return role;
  },

  async update(id: string, data: UpdateTenantRolePayload): Promise<TenantRole | null> {
    await delay(500);
    const roles = getRoles();
    const index = roles.findIndex((r) => r.id === id);
    if (index === -1) return null;
    const updated = {
      ...roles[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    } as TenantRole;
    roles[index] = updated;
    persist(roles);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const roles = getRoles();
    const index = roles.findIndex((r) => r.id === id);
    if (index !== -1) {
      roles.splice(index, 1);
      persist(roles);
    }
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await delay(600);
    const roles = getRoles();
    const filtered = roles.filter((r) => !ids.includes(r.id));
    persist(filtered);
  },

  async duplicate(id: string): Promise<TenantRole | null> {
    await delay(400);
    const roles = getRoles();
    const source = roles.find((r) => r.id === id);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy: TenantRole = {
      ...source,
      id: `role_${Date.now()}`,
      name: `${source.name} (نسخة)`,
      nameAr: `${source.nameAr} (نسخة)`,
      slug: "custom",
      status: "inactive",
      usersCount: 0,
      isSystem: false,
      isDefault: false,
      createdBy: "أحمد محمد",
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    roles.unshift(copy);
    persist(roles);
    return copy;
  },

  async archive(id: string): Promise<TenantRole | null> {
    await delay(300);
    const roles = getRoles();
    const role = roles.find((r) => r.id === id);
    if (role) {
      role.status = "archived";
      role.archivedAt = new Date().toISOString();
      role.updatedAt = new Date().toISOString();
      persist(roles);
    }
    return role ?? null;
  },

  async restore(id: string): Promise<TenantRole | null> {
    await delay(300);
    const roles = getRoles();
    const role = roles.find((r) => r.id === id);
    if (role) {
      role.status = "inactive";
      role.archivedAt = null;
      role.updatedAt = new Date().toISOString();
      persist(roles);
    }
    return role ?? null;
  },

  async activate(id: string): Promise<TenantRole | null> {
    await delay(300);
    const roles = getRoles();
    const role = roles.find((r) => r.id === id);
    if (role) {
      role.status = "active";
      role.updatedAt = new Date().toISOString();
      persist(roles);
    }
    return role ?? null;
  },

  async deactivate(id: string): Promise<TenantRole | null> {
    await delay(300);
    const roles = getRoles();
    const role = roles.find((r) => r.id === id);
    if (role) {
      role.status = "inactive";
      role.updatedAt = new Date().toISOString();
      persist(roles);
    }
    return role ?? null;
  },

  async bulkArchive(ids: string[]): Promise<void> {
    await delay(500);
    const roles = getRoles();
    const now = new Date().toISOString();
    ids.forEach((id) => {
      const role = roles.find((r) => r.id === id);
      if (role) {
        role.status = "archived";
        role.archivedAt = now;
        role.updatedAt = now;
      }
    });
    persist(roles);
  },

  async bulkRestore(ids: string[]): Promise<void> {
    await delay(500);
    const roles = getRoles();
    const now = new Date().toISOString();
    ids.forEach((id) => {
      const role = roles.find((r) => r.id === id);
      if (role) {
        role.status = "inactive";
        role.archivedAt = null;
        role.updatedAt = now;
      }
    });
    persist(roles);
  },

  async getUsers(roleId: string): Promise<TenantRoleUser[]> {
    await delay(200);
    return mockRoleUsers[roleId] ?? [];
  },

  async getActivities(roleId: string): Promise<TenantRoleActivity[]> {
    await delay(200);
    return mockRoleActivities[roleId] ?? [];
  },

  async assignUsers(roleId: string, userIds: string[]): Promise<void> {
    await delay(400);
  },

  async exportCSV(): Promise<void> {
    await delay(300);
    const roles = getRoles();
    const headers = ["الاسم", "الاسم بالعربية", "الوصف", "الحالة", "نظام", "افتراضي", "الأولوية", "المستخدمون", "الصلاحيات", "تاريخ الإنشاء", "تاريخ التحديث"];
    const rows = roles.map((r) => [
      r.name, r.nameAr, r.description, r.status, r.isSystem ? "نعم" : "لا", r.isDefault ? "نعم" : "لا",
      r.priority.toString(), r.usersCount.toString(), r.permissionsCount.toString(),
      new Date(r.createdAt).toLocaleDateString("ar"), new Date(r.updatedAt).toLocaleDateString("ar"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roles_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
