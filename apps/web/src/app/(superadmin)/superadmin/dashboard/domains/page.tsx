"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Download, Trash2 } from "lucide-react";
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
  useDomains,
  useDomainsMetrics,
  useCreateDomain,
  useVerifyDomain,
  useRenewSsl,
  useRefreshStatus,
  useMakePrimary,
  useDeleteDomain,
  useBulkDeleteDomains,
  useBulkVerifyDomains,
  useBulkEnableHttps,
  useBulkDisableDomains,
  useBulkMakePrimary,
} from "@/features/domains/hooks";
import { DomainMetricCards } from "@/features/domains/components/DomainMetricCards";
import { DomainsToolbar } from "@/features/domains/components/DomainsToolbar";
import { DomainsTable } from "@/features/domains/components/DomainsTable";
import { DomainCreateDrawer } from "@/features/domains/components/DomainCreateDrawer";
import { DomainDetailsDrawer } from "@/features/domains/components/DomainDetailsDrawer";
import { DomainDeleteDialog } from "@/features/domains/components/DomainDeleteDialog";
import { DomainEmptyState } from "@/features/domains/components/DomainEmptyState";
import { DomainLoadingState } from "@/features/domains/components/DomainLoadingState";
import { DomainErrorState } from "@/features/domains/components/DomainErrorState";
import type { PlatformDomain, DomainStatus, DomainType, SslStatus, VerificationStatus, CreateDomainPayload } from "@/features/domains/types";

function exportDomainsToCSV(domains: PlatformDomain[]) {
  const headers = ["النطاق", "العميل", "النوع", "أساسي", "الحالة", "SSL", "DNS", "التحقق", "الصحة", "تاريخ الإنشاء"];
  const rows = domains.map((d) => [
    d.domain, d.tenantName, d.type, d.isPrimary ? "نعم" : "لا",
    d.status, d.ssl.status, d.dnsStatus, d.verificationStatus,
    `${d.health.overall}%`, new Date(d.createdAt).toLocaleDateString("ar"),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `domains_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DomainsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DomainStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DomainType | "all">("all");
  const [sslFilter, setSslFilter] = useState<SslStatus | "all">("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | "all">("all");
  const [sort, setSort] = useState("createdAt");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformDomain | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const params = useMemo(() => ({
    search,
    status: statusFilter,
    type: typeFilter,
    sslStatus: sslFilter,
    verificationStatus: verificationFilter,
    sort: sort as "domain" | "createdAt" | "tenantName" | "type",
  }), [search, statusFilter, typeFilter, sslFilter, verificationFilter, sort]);

  const domainsQuery = useDomains(params);
  const metricsQuery = useDomainsMetrics();
  const createDomain = useCreateDomain();
  const verifyDomain = useVerifyDomain();
  const renewSsl = useRenewSsl();
  const refreshStatus = useRefreshStatus();
  const makePrimary = useMakePrimary();
  const deleteDomain = useDeleteDomain();
  const bulkDelete = useBulkDeleteDomains();
  const bulkVerify = useBulkVerifyDomains();
  const bulkEnableHttps = useBulkEnableHttps();
  const bulkDisable = useBulkDisableDomains();
  const bulkMakePrimary = useBulkMakePrimary();

  const domains = domainsQuery.data?.data ?? [];
  const isLoading = domainsQuery.isLoading || metricsQuery.isLoading;
  const isError = domainsQuery.isError;

  const openCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(true);
  }, []);

  const openViewDrawer = useCallback((domain: PlatformDomain) => {
    setSelectedDomainId(domain.id);
    setDetailsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((domain: PlatformDomain) => {
    setSelectedDomainId(domain.id);
    setDetailsDrawerOpen(true);
  }, []);

  const handleCreateSave = useCallback(
    (data: CreateDomainPayload) => {
      createDomain.mutate(data, {
        onSuccess: () => {
          setCreateDrawerOpen(false);
        },
      });
    },
    [createDomain],
  );

  const handleVerify = useCallback(
    (domain: PlatformDomain) => verifyDomain.mutate(domain.id),
    [verifyDomain],
  );

  const handleRefreshStatus = useCallback(
    (domain: PlatformDomain) => refreshStatus.mutate(domain.id),
    [refreshStatus],
  );

  const handleRenewSsl = useCallback(
    (domain: PlatformDomain) => renewSsl.mutate(domain.id),
    [renewSsl],
  );

  const handleCopy = useCallback((domain: PlatformDomain) => {
    navigator.clipboard.writeText(domain.domain);
  }, []);

  const handleOpen = useCallback((domain: PlatformDomain) => {
    window.open(`https://${domain.domain}`, "_blank", "noopener,noreferrer");
  }, []);

  const handleMakePrimary = useCallback(
    (domain: PlatformDomain) => makePrimary.mutate(domain.id),
    [makePrimary],
  );

  const handleDelete = useCallback((domain: PlatformDomain) => {
    setDeleteTarget(domain);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteDomain.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteDomain]);

  const handleBulkAction = useCallback(
    (action: string) => {
      if (selectedDomains.length === 0) return;
      switch (action) {
        case "delete":
          setBulkDeleteOpen(true);
          return;
        case "verify":
          bulkVerify.mutate(selectedDomains);
          break;
        case "https":
          bulkEnableHttps.mutate(selectedDomains);
          break;
        case "disable":
          bulkDisable.mutate(selectedDomains);
          break;
        case "primary":
          bulkMakePrimary.mutate(selectedDomains);
          break;
      }
      setSelectedDomains([]);
    },
    [selectedDomains, bulkDelete, bulkVerify, bulkEnableHttps, bulkDisable, bulkMakePrimary],
  );

  const confirmBulkDelete = useCallback(() => {
    if (selectedDomains.length === 0) return;
    bulkDelete.mutate(selectedDomains, {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setSelectedDomains([]);
      },
    });
  }, [selectedDomains, bulkDelete]);

  return (
    <SuperAdminGuard>
      <AppPage maxWidth="xl">
        <AppPageHeader
          title="إدارة النطاقات"
          description="إدارة جميع نطاقات المنصة والنطاقات المخصصة وشهادات SSL"
          actions={
            <>
              <AppDropdownMenu>
                <AppDropdownMenuTrigger asChild>
                  <AppButton variant="outline" size="sm" disabled={selectedDomains.length === 0}>
                    إجراءات جماعية ({selectedDomains.length})
                  </AppButton>
                </AppDropdownMenuTrigger>
                <AppDropdownMenuContent align="end" className="w-48">
                  <AppDropdownMenuItem onClick={() => handleBulkAction("verify")}>
                    تحقق
                  </AppDropdownMenuItem>
                  <AppDropdownMenuItem onClick={() => handleBulkAction("https")}>
                    تفعيل HTTPS
                  </AppDropdownMenuItem>
                  <AppDropdownMenuItem onClick={() => handleBulkAction("primary")}>
                    تعيين كأساسي
                  </AppDropdownMenuItem>
                  <AppDropdownMenuSeparator />
                  <AppDropdownMenuItem onClick={() => handleBulkAction("disable")}>
                    تعطيل
                  </AppDropdownMenuItem>
                  <AppDropdownMenuItem
                    onClick={() => handleBulkAction("delete")}
                    className="text-destructive focus:text-destructive"
                  >
                    حذف
                  </AppDropdownMenuItem>
                </AppDropdownMenuContent>
              </AppDropdownMenu>
              <AppButton variant="outline" size="sm" onClick={() => exportDomainsToCSV(domains)}>
                <Download className="h-4 w-4" />
                تصدير
              </AppButton>
              <AppButton size="sm" onClick={openCreateDrawer}>
                <Plus className="h-4 w-4" />
                إضافة نطاق
              </AppButton>
            </>
          }
        />

        <AppDivider className="mb-8" />

        <AppSection>
          <DomainMetricCards
            data={metricsQuery.data}
            loading={metricsQuery.isLoading}
          />
        </AppSection>

        <AppSection>
          {isError ? (
            <DomainErrorState onRetry={() => domainsQuery.refetch()} />
          ) : isLoading ? (
            <DomainLoadingState />
          ) : domains.length === 0 && !search && statusFilter === "all" && typeFilter === "all" ? (
            <DomainEmptyState onCreate={openCreateDrawer} />
          ) : (
            <>
              <div className="mb-4">
                <DomainsToolbar
                  search={search}
                  onSearchChange={setSearch}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  typeFilter={typeFilter}
                  onTypeChange={setTypeFilter}
                  sslFilter={sslFilter}
                  onSslChange={setSslFilter}
                  verificationFilter={verificationFilter}
                  onVerificationChange={setVerificationFilter}
                  sort={sort}
                  onSortChange={setSort}
                  onRefresh={() => domainsQuery.refetch()}
                  refreshing={domainsQuery.isRefetching}
                />
              </div>
              {selectedDomains.length > 0 && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
                  <span className="text-sm text-muted-foreground">
                    تم تحديد <span className="font-semibold text-foreground">{selectedDomains.length}</span> نطاق
                  </span>
                  <div className="mr-auto flex items-center gap-2">
                    <AppButton variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} loading={bulkDelete.isPending}>
                      <Trash2 className="h-4 w-4" />
                      حذف المحددة
                    </AppButton>
                    <AppButton variant="ghost" size="sm" onClick={() => setSelectedDomains([])}>
                      إلغاء التحديد
                    </AppButton>
                  </div>
                </div>
              )}
              <DomainsTable
                domains={domains}
                selectedIds={selectedDomains}
                onSelectionChange={setSelectedDomains}
                onView={openViewDrawer}
                onEdit={openEditDrawer}
                onVerify={handleVerify}
                onRefreshStatus={handleRefreshStatus}
                onRenewSsl={handleRenewSsl}
                onCopy={handleCopy}
                onOpen={handleOpen}
                onMakePrimary={handleMakePrimary}
                onDelete={handleDelete}
              />
              {domains.length > 0 && (
                <p className="mt-3 text-xs text-center text-muted-foreground/60">
                  إجمالي {domains.length} نطاق
                </p>
              )}
            </>
          )}
        </AppSection>

        <DomainCreateDrawer
          open={createDrawerOpen}
          onOpenChange={setCreateDrawerOpen}
          onSave={handleCreateSave}
          saving={createDomain.isPending}
        />

        <DomainDetailsDrawer
          open={detailsDrawerOpen}
          onOpenChange={setDetailsDrawerOpen}
          domainId={selectedDomainId}
        />

        <DomainDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          domainName={deleteTarget?.domain ?? ""}
          onConfirm={confirmDelete}
          loading={deleteDomain.isPending}
        />

        <DomainDeleteDialog
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          domainName=""
          onConfirm={confirmBulkDelete}
          loading={bulkDelete.isPending}
          bulk
          bulkCount={selectedDomains.length}
        />
      </AppPage>
    </SuperAdminGuard>
  );
}

export default DomainsPage;
