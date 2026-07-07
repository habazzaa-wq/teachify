"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { AppPage, AppPageHeader, AppSection, AppDivider, AppButton } from "@/components/ui";
import { Table2 } from "lucide-react";
import {
  useMatrix,
  useMatrixRoles,
  useMatrixPermissions,
  useMatrixMetrics,
  useSaveMatrix,
  useClonePermissions,
  useCopyPermissions,
} from "../hooks";
import { rolePermissionMatrixService } from "../services";
import { MatrixMetricCards } from "./MatrixMetricCards";
import { MatrixToolbar } from "./MatrixToolbar";
import { RoleSidebar } from "./RoleSidebar";
import { PermissionModuleCard } from "./PermissionModuleCard";
import { CloneRoleDialog } from "./CloneRoleDialog";
import { UnsavedChangesBanner } from "./UnsavedChangesBanner";
import { MatrixEmptyState } from "./MatrixEmptyState";
import { MatrixLoadingState } from "./MatrixLoadingState";
import { MatrixErrorState } from "./MatrixErrorState";
import { MODULE_CONFIG } from "../constants";
import type { MatrixRole, PermissionModule, RiskLevel, CloneMode, MatrixData, ExpandedModules } from "../types";

function RolePermissionMatrixPage() {
  const [selectedRole, setSelectedRole] = useState<MatrixRole | null>(null);
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [originalPermissions, setOriginalPermissions] = useState<Record<string, boolean>>({});
  const [expandedModules, setExpandedModules] = useState<ExpandedModules>({});
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<PermissionModule | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);

  const matrixQuery = useMatrix();
  const rolesQuery = useMatrixRoles();
  const permissionsQuery = useMatrixPermissions();
  const metricsQuery = useMatrixMetrics();
  const saveMatrix = useSaveMatrix();
  const clonePermissions = useClonePermissions();
  const copyPermissions = useCopyPermissions();

  const matrix = matrixQuery.data ?? {};
  const roles = rolesQuery.data ?? [];
  const allPermissions = permissionsQuery.data ?? [];
  const isLoading = matrixQuery.isLoading || rolesQuery.isLoading || permissionsQuery.isLoading || metricsQuery.isLoading;
  const isError = matrixQuery.isError || rolesQuery.isError || permissionsQuery.isError;

  const hasChanges = useMemo(() => {
    if (!selectedRole) return false;
    const keys = new Set([...Object.keys(localPermissions), ...Object.keys(originalPermissions)]);
    for (const key of keys) {
      if ((localPermissions[key] ?? false) !== (originalPermissions[key] ?? false)) return true;
    }
    return false;
  }, [localPermissions, originalPermissions, selectedRole]);

  const selectRole = useCallback((role: MatrixRole) => {
    if (hasChanges) {
      const confirmed = window.confirm("لديك تغييرات غير محفوظة. هل تريد تجاهلها؟");
      if (!confirmed) return;
    }
    setSelectedRole(role);
    const rolePerms = matrix[role.id] ?? {};
    setLocalPermissions({ ...rolePerms });
    setOriginalPermissions({ ...rolePerms });
    setExpandedModules((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      return {
        dashboard: true,
        users: true,
        roles: true,
        permissions: true,
      };
    });
  }, [matrix, hasChanges]);

  const togglePermission = useCallback((key: string) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const selectModule = useCallback((module: string) => {
    const modulePerms = allPermissions
      .filter((p) => p.module === module)
      .map((p) => p.key);
    setLocalPermissions((prev) => {
      const next = { ...prev };
      modulePerms.forEach((key) => {
        next[key] = true;
      });
      return next;
    });
  }, [allPermissions]);

  const clearModule = useCallback((module: string) => {
    const modulePerms = allPermissions
      .filter((p) => p.module === module)
      .map((p) => p.key);
    setLocalPermissions((prev) => {
      const next = { ...prev };
      modulePerms.forEach((key) => {
        next[key] = false;
      });
      return next;
    });
  }, [allPermissions]);

  const toggleExpand = useCallback((module: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedRole) return;
    const updatedMatrix: MatrixData = {
      ...matrix,
      [selectedRole.id]: { ...localPermissions },
    };
    saveMatrix.mutate(updatedMatrix, {
      onSuccess: () => {
        setOriginalPermissions({ ...localPermissions });
      },
    });
  }, [selectedRole, localPermissions, matrix, saveMatrix]);

  const handleDiscard = useCallback(() => {
    setLocalPermissions({ ...originalPermissions });
  }, [originalPermissions]);

  const handleClone = useCallback(() => {
    setCloneDialogOpen(true);
  }, []);

  const handleCloneConfirm = useCallback(
    (sourceRoleId: string, destinationRoleId: string, mode: CloneMode) => {
      clonePermissions.mutate(
        { sourceRoleId, destinationRoleId, mode },
        {
          onSuccess: () => {
            setCloneDialogOpen(false);
          },
        },
      );
    },
    [clonePermissions],
  );

  const handleCopy = useCallback(() => {
    if (!selectedRole) return;
    copyPermissions.mutate(selectedRole.id);
  }, [selectedRole, copyPermissions]);

  const handleExport = useCallback(() => {
    rolePermissionMatrixService.exportMatrixCSV();
  }, []);

  const handlePrint = useCallback(() => {
    rolePermissionMatrixService.printMatrix();
  }, []);

  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, typeof allPermissions> = {};
    const sortedModules = Object.entries(MODULE_CONFIG).sort(([, a], [, b]) => a.order - b.order);

    for (const [moduleKey] of sortedModules) {
      const perms = allPermissions.filter((p) => p.module === moduleKey);
      if (perms.length > 0) {
        grouped[moduleKey] = perms;
      }
    }
    return grouped;
  }, [allPermissions]);

  useEffect(() => {
    if (selectedRole) {
      const rolePerms = matrix[selectedRole.id] ?? {};
      setLocalPermissions({ ...rolePerms });
      setOriginalPermissions({ ...rolePerms });
    }
  }, [matrix, selectedRole?.id]);

  return (
    <AppPage maxWidth="full">
      <AppPageHeader
        title="مصفوفة صلاحيات الأدوار"
        description="إدارة وتعيين الصلاحيات للأدوار المختلفة في المنصة"
      />

      <AppDivider className="mb-6" />

      <AppSection>
        <MatrixMetricCards
          data={metricsQuery.data}
          loading={metricsQuery.isLoading}
        />
      </AppSection>

      <AppSection className="mt-6">
        {isError ? (
          <MatrixErrorState onRetry={() => {
            matrixQuery.refetch();
            rolesQuery.refetch();
            permissionsQuery.refetch();
          }} />
        ) : isLoading ? (
          <MatrixLoadingState />
        ) : (
          <>
            <div className="mb-4">
              <MatrixToolbar
                search={search}
                onSearchChange={setSearch}
                moduleFilter={moduleFilter}
                onModuleChange={setModuleFilter}
                riskFilter={riskFilter}
                onRiskChange={setRiskFilter}
                onRefresh={() => {
                  matrixQuery.refetch();
                  rolesQuery.refetch();
                  permissionsQuery.refetch();
                }}
                refreshing={matrixQuery.isRefetching}
                hasChanges={hasChanges}
                onSave={handleSave}
                onDiscard={handleDiscard}
                onClone={handleClone}
                onCopy={handleCopy}
                onExport={handleExport}
                onPrint={handlePrint}
                saving={saveMatrix.isPending}
              />
            </div>

            {hasChanges && (
              <UnsavedChangesBanner
                onSave={handleSave}
                onDiscard={handleDiscard}
                saving={saveMatrix.isPending}
              />
            )}

            <div className="flex gap-6">
              <div className="w-72 shrink-0">
                <div className="sticky top-4 rounded-xl border bg-card shadow-sm p-3 max-h-[calc(100vh-16rem)] overflow-hidden">
                  <p className="px-1 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    الأدوار
                  </p>
                  <RoleSidebar
                    roles={roles}
                    selectedRoleId={selectedRole?.id ?? null}
                    onSelectRole={selectRole}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {!selectedRole ? (
                  <MatrixEmptyState />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: selectedRole?.color ?? "#6366f1" }}
                      />
                      <h2 className="text-lg font-bold">{selectedRole?.nameAr ?? ""}</h2>
                    </div>

                    {Object.entries(groupedPermissions).map(([moduleKey, perms]) => {
                      if (moduleFilter !== "all" && moduleKey !== moduleFilter) return null;

                      return (
                        <PermissionModuleCard
                          key={moduleKey}
                          module={moduleKey}
                          permissions={perms}
                          rolePermissions={localPermissions}
                          expanded={expandedModules[moduleKey] ?? false}
                          onToggleExpand={() => toggleExpand(moduleKey)}
                          onTogglePermission={togglePermission}
                          onSelectAll={() => selectModule(moduleKey)}
                          onClearAll={() => clearModule(moduleKey)}
                          search={search}
                          riskFilter={riskFilter}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </AppSection>

      <CloneRoleDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        roles={roles}
        currentRoleId={selectedRole?.id ?? null}
        matrix={matrix}
        onConfirm={handleCloneConfirm}
        loading={clonePermissions.isPending}
      />
    </AppPage>
  );
}

export default RolePermissionMatrixPage;
