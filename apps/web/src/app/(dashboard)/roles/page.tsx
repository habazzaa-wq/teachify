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
  useTenantRoles,
  useTenantRolesMetrics,
  useCreateTenantRole,
  useUpdateTenantRole,
  useDeleteTenantRole,
  useBulkDeleteTenantRoles,
  useDuplicateTenantRole,
  useArchiveTenantRole,
  useRestoreTenantRole,
  useActivateTenantRole,
  useDeactivateTenantRole,
  useBulkArchiveTenantRoles,
  useBulkRestoreTenantRoles,
} from "@/features/tenant-roles/hooks";
import { TenantRoleMetricCards } from "@/features/tenant-roles/components/TenantRoleMetricCards";
import { TenantRolesToolbar } from "@/features/tenant-roles/components/TenantRolesToolbar";
import { TenantRolesTable } from "@/features/tenant-roles/components/TenantRolesTable";
import { TenantRoleCreateDrawer } from "@/features/tenant-roles/components/TenantRoleCreateDrawer";
import { TenantRoleEditDrawer } from "@/features/tenant-roles/components/TenantRoleEditDrawer";
import { TenantRoleDetailsDrawer } from "@/features/tenant-roles/components/TenantRoleDetailsDrawer";
import { TenantRoleDeleteDialog } from "@/features/tenant-roles/components/TenantRoleDeleteDialog";
import { TenantRoleEmptyState } from "@/features/tenant-roles/components/TenantRoleEmptyState";
import { TenantRoleLoadingState } from "@/features/tenant-roles/components/TenantRoleLoadingState";
import { TenantRoleErrorState } from "@/features/tenant-roles/components/TenantRoleErrorState";
import type { TenantRole, RoleStatus, CreateTenantRolePayload, UpdateTenantRolePayload } from "@/features/tenant-roles/types";
import { tenantRolesService } from "@/features/tenant-roles/services";

function RolesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoleStatus | "all">("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [defaultFilter, setDefaultFilter] = useState<string>("all");
  const [usersCountFilter, setUsersCountFilter] = useState<string>("all");
  const [dateCreatedFilter, setDateCreatedFilter] = useState<string>("all");
  const [dateUpdatedFilter, setDateUpdatedFilter] = useState<string>("all");
  const [sort, setSort] = useState("createdAt");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TenantRole | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const params = useMemo(() => ({
    search,
    status: statusFilter,
    isSystem: systemFilter === "true" ? true : systemFilter === "false" ? false : "all" as const,
    isDefault: defaultFilter === "true" ? true : defaultFilter === "false" ? false : "all" as const,
    usersCount: usersCountFilter as "none" | "few" | "many" | "all",
    dateCreated: dateCreatedFilter as "today" | "week" | "month" | "older" | "all",
    dateUpdated: dateUpdatedFilter as "today" | "week" | "month" | "older" | "all",
    sort: sort as "name" | "nameAr" | "usersCount" | "permissionsCount" | "priority" | "createdAt" | "updatedAt" | "status",
  }), [search, statusFilter, systemFilter, defaultFilter, usersCountFilter, dateCreatedFilter, dateUpdatedFilter, sort]);

  const rolesQuery = useTenantRoles(params);
  const metricsQuery = useTenantRolesMetrics();
  const createRole = useCreateTenantRole();
  const updateRole = useUpdateTenantRole();
  const deleteRole = useDeleteTenantRole();
  const bulkDelete = useBulkDeleteTenantRoles();
  const duplicateRole = useDuplicateTenantRole();
  const archiveRole = useArchiveTenantRole();
  const restoreRole = useRestoreTenantRole();
  const activateRole = useActivateTenantRole();
  const deactivateRole = useDeactivateTenantRole();
  const bulkArchive = useBulkArchiveTenantRoles();
  const bulkRestore = useBulkRestoreTenantRoles();

  const roles = rolesQuery.data?.data ?? [];
  const isLoading = rolesQuery.isLoading || metricsQuery.isLoading;
  const isError = rolesQuery.isError;

  const openCreateDrawer = useCallback(() => setCreateDrawerOpen(true), []);

  const openViewDrawer = useCallback((role: TenantRole) => {
    setSelectedRoleId(role.id);
    setDetailsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((role: TenantRole) => {
    setSelectedRoleId(role.id);
    setEditDrawerOpen(true);
  }, []);

  const handleCreateSave = useCallback(
    (data: CreateTenantRolePayload) => {
      createRole.mutate(data, {
        onSuccess: () => setCreateDrawerOpen(false),
      });
    },
    [createRole],
  );

  const handleEditSave = useCallback(
    (id: string, data: UpdateTenantRolePayload) => {
      updateRole.mutate({ id, data }, {
        onSuccess: () => setEditDrawerOpen(false),
      });
    },
    [updateRole],
  );

  const handleDuplicate = useCallback(
    (role: TenantRole) => duplicateRole.mutate(role.id),
    [duplicateRole],
  );

  const handleArchive = useCallback(
    (role: TenantRole) => archiveRole.mutate(role.id),
    [archiveRole],
  );

  const handleRestore = useCallback(
    (role: TenantRole) => restoreRole.mutate(role.id),
    [restoreRole],
  );

  const handleActivate = useCallback(
    (role: TenantRole) => activateRole.mutate(role.id),
    [activateRole],
  );

  const handleDeactivate = useCallback(
    (role: TenantRole) => deactivateRole.mutate(role.id),
    [deactivateRole],
  );

  const handleAssignUsers = useCallback(
    (role: TenantRole) => {
      openEditDrawer(role);
    },
    [openEditDrawer],
  );

  const handleExport = useCallback(
    () => tenantRolesService.exportCSV(),
    [],
  );

  const handleDelete = useCallback((role: TenantRole) => {
    setDeleteTarget(role);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteRole.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteRole]);

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
        title="إدارة الأدوار"
        description="إدارة أدوار المستخدمين والصلاحيات في هذه الأكاديمية"
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
              تصدير
            </AppButton>
            <AppButton size="sm" onClick={openCreateDrawer}>
              <Plus className="h-4 w-4" />
              إضافة دور
            </AppButton>
          </>
        }
      />

      <AppDivider className="mb-8" />

      <AppSection>
        <TenantRoleMetricCards
          data={metricsQuery.data}
          loading={metricsQuery.isLoading}
        />
      </AppSection>

      <AppSection>
        {isError ? (
          <TenantRoleErrorState onRetry={() => rolesQuery.refetch()} />
        ) : isLoading ? (
          <TenantRoleLoadingState />
        ) : roles.length === 0 && !search && statusFilter === "all" ? (
          <TenantRoleEmptyState onCreate={openCreateDrawer} />
        ) : (
          <>
            <div className="mb-4">
              <TenantRolesToolbar
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                systemFilter={systemFilter}
                onSystemChange={setSystemFilter}
                defaultFilter={defaultFilter}
                onDefaultChange={setDefaultFilter}
                usersCountFilter={usersCountFilter}
                onUsersCountChange={setUsersCountFilter}
                dateCreatedFilter={dateCreatedFilter}
                onDateCreatedChange={setDateCreatedFilter}
                dateUpdatedFilter={dateUpdatedFilter}
                onDateUpdatedChange={setDateUpdatedFilter}
                sort={sort}
                onSortChange={setSort}
                onRefresh={() => rolesQuery.refetch()}
                refreshing={rolesQuery.isRefetching}
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
                <span className="text-sm text-muted-foreground">
                  تم تحديد <span className="font-semibold text-foreground">{selectedIds.length}</span> دور
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
            <TenantRolesTable
              roles={roles}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onView={openViewDrawer}
              onEdit={openEditDrawer}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              onAssignUsers={handleAssignUsers}
              onExport={handleExport}
              onDelete={handleDelete}
            />
            {roles.length > 0 && (
              <p className="mt-3 text-xs text-center text-muted-foreground/60">
                إجمالي {roles.length} دور
              </p>
            )}
          </>
        )}
      </AppSection>

      <TenantRoleCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSave={handleCreateSave}
        saving={createRole.isPending}
      />

      <TenantRoleEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        roleId={selectedRoleId}
        onSave={handleEditSave}
        saving={updateRole.isPending}
      />

      <TenantRoleDetailsDrawer
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        roleId={selectedRoleId}
      />

      <TenantRoleDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        roleName={deleteTarget?.nameAr ?? ""}
        onConfirm={confirmDelete}
        loading={deleteRole.isPending}
      />

      <TenantRoleDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        roleName=""
        onConfirm={confirmBulkDelete}
        loading={bulkDelete.isPending}
        bulk
        bulkCount={selectedIds.length}
      />
    </AppPage>
  );
}

export default RolesPage;
