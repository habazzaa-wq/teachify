"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Download, Trash2, Archive, RotateCcw } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppSection,
  AppDivider,
  AppButton,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import {
  useTenantPermissions,
  useTenantPermissionsMetrics,
  useCreateTenantPermission,
  useUpdateTenantPermission,
  useDeleteTenantPermission,
  useBulkDeleteTenantPermissions,
  useArchiveTenantPermission,
  useRestoreTenantPermission,
  useBulkArchiveTenantPermissions,
  useBulkRestoreTenantPermissions,
} from "../hooks";
import { TenantPermissionMetricCards } from "./TenantPermissionMetricCards";
import { TenantPermissionsToolbar } from "./TenantPermissionsToolbar";
import { TenantPermissionsTable } from "./TenantPermissionsTable";
import { TenantPermissionCreateDrawer } from "./TenantPermissionCreateDrawer";
import { TenantPermissionEditDrawer } from "./TenantPermissionEditDrawer";
import { TenantPermissionDetailsDrawer } from "./TenantPermissionDetailsDrawer";
import { TenantPermissionDeleteDialog } from "./TenantPermissionDeleteDialog";
import { TenantPermissionEmptyState } from "./TenantPermissionEmptyState";
import { TenantPermissionLoadingState } from "./TenantPermissionLoadingState";
import { TenantPermissionErrorState } from "./TenantPermissionErrorState";
import type { TenantPermission, PermissionModule, RiskLevel, CreateTenantPermissionPayload, UpdateTenantPermissionPayload } from "../types";
import { tenantPermissionsService } from "../services";

function TenantPermissionsPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<PermissionModule | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [dateCreatedFilter, setDateCreatedFilter] = useState<string>("all");
  const [dateUpdatedFilter, setDateUpdatedFilter] = useState<string>("all");
  const [sort, setSort] = useState("createdAt");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TenantPermission | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const params = useMemo(() => ({
    search,
    module: moduleFilter,
    riskLevel: riskFilter,
    isSystem: systemFilter === "true" ? true : systemFilter === "false" ? false : "all" as const,
    dateCreated: dateCreatedFilter as "today" | "week" | "month" | "older" | "all",
    dateUpdated: dateUpdatedFilter as "today" | "week" | "month" | "older" | "all",
    sort: sort as "key" | "nameAr" | "nameEn" | "module" | "riskLevel" | "rolesCount" | "createdAt" | "updatedAt",
  }), [search, moduleFilter, riskFilter, systemFilter, dateCreatedFilter, dateUpdatedFilter, sort]);

  const permissionsQuery = useTenantPermissions(params);
  const metricsQuery = useTenantPermissionsMetrics();
  const createPermission = useCreateTenantPermission();
  const updatePermission = useUpdateTenantPermission();
  const deletePermission = useDeleteTenantPermission();
  const bulkDelete = useBulkDeleteTenantPermissions();
  const archivePermission = useArchiveTenantPermission();
  const restorePermission = useRestoreTenantPermission();
  const bulkArchive = useBulkArchiveTenantPermissions();
  const bulkRestore = useBulkRestoreTenantPermissions();

  const permissions = permissionsQuery.data?.data ?? [];
  const isLoading = permissionsQuery.isLoading || metricsQuery.isLoading;
  const isError = permissionsQuery.isError;

  const openCreateDrawer = useCallback(() => setCreateDrawerOpen(true), []);

  const openViewDrawer = useCallback((permission: TenantPermission) => {
    setSelectedPermissionId(permission.id);
    setDetailsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((permission: TenantPermission) => {
    setSelectedPermissionId(permission.id);
    setEditDrawerOpen(true);
  }, []);

  const handleCreateSave = useCallback(
    (data: CreateTenantPermissionPayload) => {
      createPermission.mutate(data, {
        onSuccess: () => setCreateDrawerOpen(false),
      });
    },
    [createPermission],
  );

  const handleEditSave = useCallback(
    (id: string, data: UpdateTenantPermissionPayload) => {
      updatePermission.mutate({ id, data }, {
        onSuccess: () => setEditDrawerOpen(false),
      });
    },
    [updatePermission],
  );

  const handleArchive = useCallback(
    (permission: TenantPermission) => archivePermission.mutate(permission.id),
    [archivePermission],
  );

  const handleRestore = useCallback(
    (permission: TenantPermission) => restorePermission.mutate(permission.id),
    [restorePermission],
  );

  const handleExport = useCallback(
    () => tenantPermissionsService.exportCSV(),
    [],
  );

  const handleDelete = useCallback((permission: TenantPermission) => {
    setDeleteTarget(permission);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deletePermission.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deletePermission]);

  const handleBulkAction = useCallback(
    (action: string) => {
      if (selectedIds.length === 0) return;
      switch (action) {
        case "delete":
          setBulkDeleteOpen(true);
          return;
        case "archive":
          bulkArchive.mutate(selectedIds);
          break;
        case "restore":
          bulkRestore.mutate(selectedIds);
          break;
      }
      setSelectedIds([]);
    },
    [selectedIds, bulkArchive, bulkRestore],
  );

  const confirmBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    bulkDelete.mutate(selectedIds, {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setSelectedIds([]);
      },
    });
  }, [selectedIds, bulkDelete]);

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="إدارة الصلاحيات"
        description="إدارة صلاحيات النظام والصلاحيات المخصصة للأدوار"
        actions={
          <>
            <AppDropdownMenu>
              <AppDropdownMenuTrigger asChild>
                <AppButton variant="outline" size="sm" disabled={selectedIds.length === 0}>
                  إجراءات جماعية ({selectedIds.length})
                </AppButton>
              </AppDropdownMenuTrigger>
              <AppDropdownMenuContent align="end" className="w-48">
                <AppDropdownMenuItem onClick={() => handleBulkAction("archive")}>
                  <Archive className="h-4 w-4" />
                  أرشفة
                </AppDropdownMenuItem>
                <AppDropdownMenuItem onClick={() => handleBulkAction("restore")}>
                  <RotateCcw className="h-4 w-4" />
                  استعادة
                </AppDropdownMenuItem>
                <AppDropdownMenuSeparator />
                <AppDropdownMenuItem
                  onClick={() => handleBulkAction("delete")}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف
                </AppDropdownMenuItem>
              </AppDropdownMenuContent>
            </AppDropdownMenu>
            <AppButton variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              تصدير CSV
            </AppButton>
            <AppButton size="sm" onClick={openCreateDrawer}>
              <Plus className="h-4 w-4" />
              إضافة صلاحية
            </AppButton>
          </>
        }
      />

      <AppDivider className="mb-8" />

      <AppSection>
        <TenantPermissionMetricCards
          data={metricsQuery.data}
          loading={metricsQuery.isLoading}
        />
      </AppSection>

      <AppSection>
        {isError ? (
          <TenantPermissionErrorState onRetry={() => permissionsQuery.refetch()} />
        ) : isLoading ? (
          <TenantPermissionLoadingState />
        ) : permissions.length === 0 && !search && moduleFilter === "all" ? (
          <TenantPermissionEmptyState onCreate={openCreateDrawer} />
        ) : (
          <>
            <div className="mb-4">
              <TenantPermissionsToolbar
                search={search}
                onSearchChange={setSearch}
                moduleFilter={moduleFilter}
                onModuleChange={setModuleFilter}
                riskFilter={riskFilter}
                onRiskChange={setRiskFilter}
                systemFilter={systemFilter}
                onSystemChange={setSystemFilter}
                dateCreatedFilter={dateCreatedFilter}
                onDateCreatedChange={setDateCreatedFilter}
                dateUpdatedFilter={dateUpdatedFilter}
                onDateUpdatedChange={setDateUpdatedFilter}
                sort={sort}
                onSortChange={setSort}
                onRefresh={() => permissionsQuery.refetch()}
                refreshing={permissionsQuery.isRefetching}
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
                <span className="text-sm text-muted-foreground">
                  تم تحديد <span className="font-semibold text-foreground">{selectedIds.length}</span> صلاحية
                </span>
                <div className="mr-auto flex items-center gap-2">
                  <AppButton variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} loading={bulkDelete.isPending}>
                    <Trash2 className="h-4 w-4" />
                    حذف المحددة
                  </AppButton>
                  <AppButton variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                    إلغاء التحديد
                  </AppButton>
                </div>
              </div>
            )}
            <TenantPermissionsTable
              permissions={permissions}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onView={openViewDrawer}
              onEdit={openEditDrawer}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
            {permissions.length > 0 && (
              <p className="mt-3 text-xs text-center text-muted-foreground/60">
                إجمالي {permissions.length} صلاحية
              </p>
            )}
          </>
        )}
      </AppSection>

      <TenantPermissionCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSave={handleCreateSave}
        saving={createPermission.isPending}
      />

      <TenantPermissionEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        permissionId={selectedPermissionId}
        onSave={handleEditSave}
        saving={updatePermission.isPending}
      />

      <TenantPermissionDetailsDrawer
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        permissionId={selectedPermissionId}
      />

      <TenantPermissionDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        permissionKey={deleteTarget?.key ?? ""}
        onConfirm={confirmDelete}
        loading={deletePermission.isPending}
      />

      <TenantPermissionDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        permissionKey=""
        onConfirm={confirmBulkDelete}
        loading={bulkDelete.isPending}
        bulk
        bulkCount={selectedIds.length}
      />
    </AppPage>
  );
}

export default TenantPermissionsPage;
