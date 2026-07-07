"use client";

import { useState, useCallback } from "react";
import { Plus, RefreshCw, Download, Trash2 } from "lucide-react";
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
import {
  AppPage,
  AppPageHeader,
  AppSection,
  AppDivider,
  AppButton,
} from "@/components/ui";
import {
  usePlans,
  usePlansMetrics,
  useCreatePlan,
  useUpdatePlan,
  useArchivePlan,
  useActivatePlan,
  useDeactivatePlan,
  useDeletePlan,
  useBulkDeletePlans,
} from "@/features/platform-plans/hooks/usePlans";
import { PlanMetricCards } from "@/features/platform-plans/components/PlanMetricCards";
import { PlansToolbar } from "@/features/platform-plans/components/PlansToolbar";
import { PlansTable } from "@/features/platform-plans/components/PlansTable";
import { PlanDetailsDrawer } from "@/features/platform-plans/components/PlanDetailsDrawer";
import { PlanDeleteDialog } from "@/features/platform-plans/components/PlanDeleteDialog";
import { PlanEmptyState } from "@/features/platform-plans/components/PlanEmptyState";
import { PlanLoadingState } from "@/features/platform-plans/components/PlanLoadingState";
import { PlanErrorState } from "@/features/platform-plans/components/PlanErrorState";
import type { PremiumPlan, PlanStatus } from "@/features/platform-plans/types";

function exportPlansToCSV(plans: PremiumPlan[]) {
  const headers = ["الاسم", "الحالة", "السعر الشهري", "السعر السنوي", "العملة", "الترتيب"];
  const rows = plans.map((p) => [
    p.name,
    p.status === "active" ? "نشط" : p.status === "draft" ? "مسودة" : p.status === "hidden" ? "مخفي" : "مؤرشف",
    p.monthlyPrice,
    p.yearlyPrice,
    p.currency,
    p.displayOrder,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `plans_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function PlansPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlanStatus | "all">("all");
  const [sort, setSort] = useState("displayOrder");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | "duplicate">("create");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<PremiumPlan> | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PremiumPlan | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const plansQuery = usePlans({ search, status: statusFilter, sort: sort as never });
  const metricsQuery = usePlansMetrics();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const archivePlan = useArchivePlan();
  const activatePlan = useActivatePlan();
  const deactivatePlan = useDeactivatePlan();
  const deletePlan = useDeletePlan();
  const bulkDeletePlans = useBulkDeletePlans();

  const plans = plansQuery.data?.data ?? [];
  const isLoading = plansQuery.isLoading || metricsQuery.isLoading;
  const isError = plansQuery.isError;

  const openCreateDrawer = useCallback(() => {
    setSelectedPlanId(null);
    setInitialData(undefined);
    setDrawerMode("create");
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((plan: PremiumPlan) => {
    setSelectedPlanId(plan.id);
    setInitialData(undefined);
    setDrawerMode("edit");
    setDrawerOpen(true);
  }, []);

  const openViewDrawer = useCallback((plan: PremiumPlan) => {
    setSelectedPlanId(plan.id);
    setInitialData(undefined);
    setDrawerMode("edit");
    setDrawerOpen(true);
  }, []);

  const openDuplicateDrawer = useCallback((plan: PremiumPlan) => {
    setSelectedPlanId(null);
    setInitialData({
      ...plan,
      name: `نسخة من ${plan.name}`,
      slug: `${plan.slug}-copy`,
      status: "draft",
      recommended: false,
    });
    setDrawerMode("duplicate");
    setDrawerOpen(true);
  }, []);

  const handleSave = useCallback(
    (data: Partial<PremiumPlan>) => {
      if (drawerMode === "create" || drawerMode === "duplicate") {
        createPlan.mutate(data, {
          onSuccess: () => {
            setDrawerOpen(false);
          },
        });
      } else if (selectedPlanId) {
        updatePlan.mutate(
          { id: selectedPlanId, data },
          {
            onSuccess: () => {
              setDrawerOpen(false);
            },
          },
        );
      }
    },
    [drawerMode, selectedPlanId, createPlan, updatePlan],
  );

  const handleDelete = useCallback((plan: PremiumPlan) => {
    setDeleteTarget(plan);
    setDeleteOpen(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    setBulkDeleteOpen(true);
  }, []);

  const confirmBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    bulkDeletePlans.mutate(selectedIds, {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setSelectedIds([]);
      },
    });
  }, [selectedIds, bulkDeletePlans]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deletePlan.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deletePlan]);

  const handleArchive = useCallback(
    (plan: PremiumPlan) => archivePlan.mutate(plan.id),
    [archivePlan],
  );

  const handleActivate = useCallback(
    (plan: PremiumPlan) => activatePlan.mutate(plan.id),
    [activatePlan],
  );

  const handleDeactivate = useCallback(
    (plan: PremiumPlan) => deactivatePlan.mutate(plan.id),
    [deactivatePlan],
  );

  return (
    <SuperAdminGuard>
      <AppPage maxWidth="xl">
        <AppPageHeader
          title="الباقات"
          description="إدارة جميع باقات المنصة وحدودها والمميزات الخاصة بها"
          actions={
            <>
              <AppButton variant="outline" size="sm" onClick={() => plansQuery.refetch()} loading={plansQuery.isRefetching}>
                <RefreshCw className="h-4 w-4" />
                تحديث
              </AppButton>
              <AppButton variant="outline" size="sm" onClick={() => exportPlansToCSV(plans)}>
                <Download className="h-4 w-4" />
                تصدير
              </AppButton>
              <AppButton size="sm" onClick={openCreateDrawer}>
                <Plus className="h-4 w-4" />
                إنشاء باقة
              </AppButton>
            </>
          }
        />

        <AppDivider className="mb-8" />

        <AppSection>
          <PlanMetricCards
            data={metricsQuery.data}
            loading={metricsQuery.isLoading}
          />
        </AppSection>

        <AppSection>
          {isError ? (
            <PlanErrorState onRetry={() => plansQuery.refetch()} />
          ) : isLoading ? (
            <PlanLoadingState />
          ) : plans.length === 0 && !search && statusFilter === "all" ? (
            <PlanEmptyState onCreate={openCreateDrawer} />
          ) : (
            <>
              <div className="mb-4">
                  <PlansToolbar
                    search={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    sort={sort}
                    onSortChange={setSort}
                    onRefresh={() => plansQuery.refetch()}
                    refreshing={plansQuery.isRefetching}
                  />
              </div>
              {selectedIds.length > 0 && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
                  <span className="text-sm text-muted-foreground">
                    تم تحديد <span className="font-semibold text-foreground">{selectedIds.length}</span> باقة
                  </span>
                  <div className="mr-auto flex items-center gap-2">
                    <AppButton variant="destructive" size="sm" onClick={handleBulkDelete} loading={bulkDeletePlans.isPending}>
                      <Trash2 className="h-4 w-4" />
                      حذف المحددة
                    </AppButton>
                    <AppButton variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                      إلغاء التحديد
                    </AppButton>
                  </div>
                </div>
              )}
              <PlansTable
                plans={plans}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onView={openViewDrawer}
                onEdit={openEditDrawer}
                onDuplicate={openDuplicateDrawer}
                onArchive={handleArchive}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
              />
              {plans.length > 0 && (
                <p className="mt-3 text-xs text-center text-muted-foreground/60">
                  إجمالي {plans.length} باقة
                </p>
              )}
            </>
          )}
        </AppSection>

        <PlanDetailsDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          planId={selectedPlanId}
          isCreate={drawerMode === "create"}
          isDuplicate={drawerMode === "duplicate"}
          initialData={initialData}
          onSave={handleSave}
          saving={createPlan.isPending || updatePlan.isPending}
        />

        <PlanDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          planName={deleteTarget?.name ?? ""}
          onConfirm={confirmDelete}
          loading={deletePlan.isPending}
        />

        <PlanDeleteDialog
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          planName=""
          onConfirm={confirmBulkDelete}
          loading={bulkDeletePlans.isPending}
          bulk
          bulkCount={selectedIds.length}
        />
      </AppPage>
    </SuperAdminGuard>
  );
}

export default PlansPage;
