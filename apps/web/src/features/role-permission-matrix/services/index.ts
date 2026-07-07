import type { MatrixData, MatrixRole, MatrixPermission, CloneMode } from "../types";
import { mockMatrixRoles, mockMatrixPermissions, mockInitialMatrix, getMatrixMetrics } from "../mock";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = "app_role_permission_matrix";

function getMatrix(): MatrixData {
  if (typeof window === "undefined") return { ...mockInitialMatrix };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as MatrixData;
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch { /* empty */ }
  const initial = { ...mockInitialMatrix };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); } catch { /* empty */ }
  return initial;
}

function persist(matrix: MatrixData): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix)); } catch { /* empty */ }
}

export const rolePermissionMatrixService = {
  async getMatrix(): Promise<MatrixData> {
    await delay(300);
    return getMatrix();
  },

  async getMatrixForRole(roleId: string): Promise<Record<string, boolean>> {
    await delay(200);
    const matrix = getMatrix();
    return matrix[roleId] ?? {};
  },

  async saveMatrix(matrix: MatrixData): Promise<void> {
    await delay(400);
    persist(matrix);
  },

  async saveRoleMatrix(roleId: string, permissions: Record<string, boolean>): Promise<void> {
    await delay(300);
    const matrix = getMatrix();
    matrix[roleId] = permissions;
    persist(matrix);
  },

  async clonePermissions(sourceRoleId: string, destinationRoleId: string, mode: CloneMode): Promise<void> {
    await delay(500);
    const matrix = getMatrix();
    const sourcePermissions = matrix[sourceRoleId];
    if (!sourcePermissions) return;
    if (mode === "replace") {
      matrix[destinationRoleId] = { ...sourcePermissions };
    } else {
      const existing = matrix[destinationRoleId] ?? {};
      matrix[destinationRoleId] = { ...existing, ...sourcePermissions };
    }
    persist(matrix);
  },

  async getRoles(): Promise<MatrixRole[]> {
    await delay(200);
    return [...mockMatrixRoles];
  },

  async getPermissions(): Promise<MatrixPermission[]> {
    await delay(200);
    return [...mockMatrixPermissions];
  },

  async getMetrics(): Promise<{
    totalRoles: number;
    totalPermissions: number;
    totalAssignments: number;
    rolesWithFullAccess: number;
    rolesWithNoAccess: number;
    highRiskAssignments: number;
    modulesCovered: number;
  }> {
    await delay(300);
    const matrix = getMatrix();
    const metrics = getMatrixMetrics(matrix);
    const modulesCovered = new Set(mockMatrixPermissions.map((p) => p.module)).size;
    return {
      totalRoles: mockMatrixRoles.length,
      totalPermissions: mockMatrixPermissions.length,
      ...metrics,
      modulesCovered,
    };
  },

  async copyPermissionsToClipboard(roleId: string): Promise<string> {
    await delay(200);
    const matrix = getMatrix();
    const perms = matrix[roleId] ?? {};
    const enabled = Object.entries(perms)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const text = enabled.join("\n");
    if (typeof navigator !== "undefined") {
      await navigator.clipboard.writeText(text);
    }
    return text;
  },

  async exportMatrixCSV(): Promise<void> {
    await delay(300);
    const matrix = getMatrix();
    const permissions = mockMatrixPermissions;
    const roles = mockMatrixRoles;

    const headers = ["الصلاحية", "الوحدة", ...roles.map((r) => r.nameAr)];
    const rows = permissions.map((perm) => {
      const roleValues = roles.map((role) => {
        const enabled = matrix[role.id]?.[perm.key] ?? false;
        return enabled ? "✓" : "✗";
      });
      return [perm.key, perm.module, ...roleValues];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permission_matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async printMatrix(): Promise<void> {
    await delay(100);
    window.print();
  },
};
