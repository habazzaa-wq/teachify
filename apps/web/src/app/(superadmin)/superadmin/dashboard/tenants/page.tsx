"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, RefreshCw, Download, Upload, MoreHorizontal, Trash2, RotateCcw } from "lucide-react";
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
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
  useTenants,
  useTenantsMetrics,
  useCreateTenant,
  useCreateTenantWizard,
  useUpdateTenant,
  useSuspendTenant,
  useActivateTenant,
  useArchiveTenant,
  useDeleteTenant,
  useBulkDeleteTenants,
  useResetTenantData,
} from "@/features/platform-tenants/hooks/usePlatformTenants";

import { TenantMetricCards } from "@/features/platform-tenants/components/TenantMetricCards";
import { TenantsToolbar } from "@/features/platform-tenants/components/TenantsToolbar";
import { TenantsTable } from "@/features/platform-tenants/components/TenantsTable";
import { TenantEditDialog } from "@/features/platform-tenants/components/TenantEditDialog";
import { TenantCreateDialog } from "@/features/platform-tenants/components/TenantCreateDialog";
import { TenantDeleteDialog } from "@/features/platform-tenants/components/TenantDeleteDialog";
import { TenantEmptyState } from "@/features/platform-tenants/components/TenantEmptyState";
import { TenantLoadingState } from "@/features/platform-tenants/components/TenantLoadingState";
import { TenantErrorState } from "@/features/platform-tenants/components/TenantErrorState";
import type { Tenant, TenantStatus, TenantCreationResult, WizardState } from "@/features/platform-tenants/types";

function exportTenantsToCSV(tenants: Tenant[]) {
  const headers = ["الاسم", "الحالة", "الباقة", "المالك", "البريد", "الدولة", "التخزين المستخدم", "العرض الترددي", "الفيديوهات", "تاريخ الإنشاء"];
  const rows = tenants.map((t) => [
    t.name, t.status, t.subscription.planName, t.owner.name, t.owner.email,
    t.address.country, t.limits.storageUsed, t.limits.bandwidthUsed, t.limits.videosUsed,
    new Date(t.createdAt).toLocaleDateString("ar"),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tenants_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function TenantsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "all">("all");
  const [sort, setSort] = useState("newest");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creationResult, setCreationResult] = useState<TenantCreationResult | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const tenantsQuery = useTenants({ search, status: statusFilter, sort: sort as never });
  const metricsQuery = useTenantsMetrics();
  const createTenant = useCreateTenant();
  const createTenantWizard = useCreateTenantWizard();
  const updateTenant = useUpdateTenant();
  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();
  const archiveTenant = useArchiveTenant();
  const deleteTenant = useDeleteTenant();
  const bulkDeleteTenants = useBulkDeleteTenants();
  const resetData = useResetTenantData();

  const tenants = tenantsQuery.data?.data ?? [];
  const isLoading = tenantsQuery.isLoading || metricsQuery.isLoading;
  const isError = tenantsQuery.isError;

  const openEditDrawer = useCallback((tenant: Tenant) => {
    setSelectedTenantId(tenant.id);
    setSelectedTenant(tenant);
    setDrawerOpen(true);
  }, []);

  const openViewDrawer = useCallback((tenant: Tenant) => {
    setSelectedTenantId(tenant.id);
    setSelectedTenant(tenant);
    setDrawerOpen(true);
  }, []);

  const handleCreateSave = useCallback(
    (data: WizardState) => {
      setCreationResult(null);
      createTenantWizard.mutate(data, {
        onSuccess: (result) => {
          setCreationResult(result);
        },
      });
    },
    [createTenantWizard],
  );

  const handleDrawerSave = useCallback(
    (data: Partial<Tenant>) => {
      if (selectedTenantId) {
        updateTenant.mutate(
          { id: selectedTenantId, data },
          { onSuccess: () => setDrawerOpen(false) },
        );
      }
    },
    [selectedTenantId, updateTenant],
  );

  const selectedTenants = useMemo(
    () => tenants.filter((t) => selectedIds.includes(t.id)),
    [tenants, selectedIds],
  );

  const bulkTotals = useMemo(() => ({
    users: selectedTenants.reduce((s, t) => s + t.limits.usersUsed, 0),
    courses: selectedTenants.reduce((s, t) => s + t.limits.coursesUsed, 0),
    videos: selectedTenants.reduce((s, t) => s + t.limits.videosUsed, 0),
    storage: selectedTenants.reduce((s, t) => s + t.limits.storageUsed, 0),
  }), [selectedTenants]);

  const handleDelete = useCallback((tenant: Tenant) => {
    setDeleteTarget(tenant);
    setDeleteOpen(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    setBulkDeleteOpen(true);
  }, []);

  const confirmBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    bulkDeleteTenants.mutate(selectedIds, {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setSelectedIds([]);
      },
    });
  }, [selectedIds, bulkDeleteTenants]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteTenant.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteTenant]);

  const handleSuspend = useCallback(
    (tenant: Tenant) => suspendTenant.mutate(tenant.id),
    [suspendTenant],
  );

  const handleActivate = useCallback(
    (tenant: Tenant) => activateTenant.mutate(tenant.id),
    [activateTenant],
  );

  const handleArchive = useCallback(
    (tenant: Tenant) => archiveTenant.mutate(tenant.id),
    [archiveTenant],
  );

  const handleOpenDashboard = useCallback((tenant: Tenant) => {
    window.open(`https://${tenant.domain.platformSubdomain}.example.com`, "_blank");
  }, []);

  const handleTransferOwnership = useCallback((tenant: Tenant) => {
    const newName = prompt("أدخل اسم المالك الجديد:", tenant.owner.name);
    if (!newName) return;
    const newEmail = prompt("أدخل البريد الإلكتروني للمالك الجديد:", tenant.owner.email);
    if (!newEmail) return;
  }, []);

  const handleDuplicate = useCallback((tenant: Tenant) => {
    createTenant.mutate({
      ...tenant,
      name: `نسخة من ${tenant.name}`,
      slug: `${tenant.slug}-copy`,
    });
  }, [createTenant]);

  const handleResetUsage = useCallback((t: Tenant) => {
    updateTenant.mutate({
      id: t.id,
      data: {
        limits: {
          ...t.limits,
          storageUsed: 0, bandwidthUsed: 0, videosUsed: 0,
          coursesUsed: 0, usersUsed: 0, adminsUsed: 0,
          teachersUsed: 0, studentsUsed: 0, apiRequestsUsed: 0,
          liveClassesUsed: 0, certificatesUsed: 0, assignmentsUsed: 0,
          quizzesUsed: 0, communitiesUsed: 0,
        },
      },
    });
  }, [updateTenant]);

  return (
    <SuperAdminGuard>
      <AppPage maxWidth="xl">
        <AppPageHeader
          title="إدارة العملاء"
          description="إدارة جميع المؤسسات والعملاء داخل المنصة."
          actions={
            <>
              <AppDropdownMenu>
                <AppDropdownMenuTrigger asChild>
                  <AppButton variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                    إجراءات جماعية
                  </AppButton>
                </AppDropdownMenuTrigger>
                <AppDropdownMenuContent align="end" className="w-52">
                  <AppDropdownMenuItem onClick={() => exportTenantsToCSV(tenants)}>
                    <Download className="h-4 w-4" />
                    تصدير CSV
                  </AppDropdownMenuItem>
                  <AppDropdownMenuItem>
                    <Upload className="h-4 w-4" />
                    استيراد
                  </AppDropdownMenuItem>
                  <AppDropdownMenuSeparator />
                  <AppDropdownMenuItem onClick={() => {
                    if (window.confirm('هل أنت متأكد؟ سيتم إعادة تعيين جميع بيانات العملاء إلى الحالة الافتراضية.')) {
                      resetData.mutate();
                    }
                  }}>
                    <RotateCcw className="h-4 w-4" />
                    إعادة تعيين البيانات
                  </AppDropdownMenuItem>
                </AppDropdownMenuContent>
              </AppDropdownMenu>
              <AppButton variant="outline" size="sm" onClick={() => tenantsQuery.refetch()} loading={tenantsQuery.isRefetching}>
                <RefreshCw className="h-4 w-4" />
                تحديث
              </AppButton>
              <AppButton variant="outline" size="sm" onClick={() => exportTenantsToCSV(tenants)}>
                <Download className="h-4 w-4" />
                تصدير
              </AppButton>
              <AppButton size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                إنشاء Tenant
              </AppButton>
            </>
          }
        />

        <AppDivider className="mb-8" />

        <AppSection>
          <TenantMetricCards
            data={metricsQuery.data}
            loading={metricsQuery.isLoading}
          />
        </AppSection>

        <AppSection>
          {isError ? (
            <TenantErrorState onRetry={() => tenantsQuery.refetch()} />
          ) : isLoading ? (
            <TenantLoadingState />
          ) : tenants.length === 0 && !search && statusFilter === "all" ? (
            <TenantEmptyState onCreate={() => setCreateDialogOpen(true)} />
          ) : (
            <>
              {selectedIds.length > 0 && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
                  <span className="text-sm text-muted-foreground">
                    تم تحديد <span className="font-semibold text-foreground">{selectedIds.length}</span> مؤسسة
                  </span>
                  <div className="mr-auto flex items-center gap-2">
                    <AppButton variant="destructive" size="sm" onClick={handleBulkDelete} loading={bulkDeleteTenants.isPending}>
                      <Trash2 className="h-4 w-4" />
                      حذف المحددة
                    </AppButton>
                    <AppButton variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                      إلغاء التحديد
                    </AppButton>
                  </div>
                </div>
              )}
              <div className="mb-4">
                <TenantsToolbar
                  search={search}
                  onSearchChange={setSearch}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  sort={sort}
                  onSortChange={setSort}
                  onRefresh={() => tenantsQuery.refetch()}
                  refreshing={tenantsQuery.isRefetching}
                />
              </div>
              <TenantsTable
                tenants={tenants}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onView={openViewDrawer}
                onEdit={openEditDrawer}
                onOpenDashboard={handleOpenDashboard}
                onSuspend={handleSuspend}
                onActivate={handleActivate}
                onArchive={handleArchive}
                onTransferOwnership={handleTransferOwnership}
                onDuplicate={handleDuplicate}
                onResetUsage={handleResetUsage}
                onDelete={handleDelete}
              />
              {tenants.length > 0 && (
                <p className="mt-3 text-xs text-center text-muted-foreground/60">
                  إجمالي {tenants.length} مؤسسة
                </p>
              )}
            </>
          )}
        </AppSection>

        <TenantEditDialog
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          tenantId={selectedTenantId}
          tenant={selectedTenant}
          onSave={handleDrawerSave}
          saving={updateTenant.isPending}
        />

        <TenantCreateDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setCreationResult(null);
          }}
          onSave={handleCreateSave}
          saving={createTenantWizard.isPending}
          creationResult={creationResult}
        />

        <TenantDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          tenantName={deleteTarget?.name ?? ""}
          usersCount={deleteTarget?.limits.usersUsed ?? 0}
          coursesCount={deleteTarget?.limits.coursesUsed ?? 0}
          videosCount={deleteTarget?.limits.videosUsed ?? 0}
          storage={deleteTarget?.limits.storageUsed ?? 0}
          onConfirm={confirmDelete}
          loading={deleteTenant.isPending}
        />

        <TenantDeleteDialog
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          tenantName=""
          usersCount={bulkTotals.users}
          coursesCount={bulkTotals.courses}
          videosCount={bulkTotals.videos}
          storage={bulkTotals.storage}
          onConfirm={confirmBulkDelete}
          loading={bulkDeleteTenants.isPending}
          bulk
          bulkCount={selectedIds.length}
        />
      </AppPage>
    </SuperAdminGuard>
  );
}

export default TenantsPage;