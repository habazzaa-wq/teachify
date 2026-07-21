"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  AppTooltip,
  AppTooltipTrigger,
  AppTooltipContent,
  AppTooltipProvider,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  useDomains,
  useDomainMetrics,
  useCreateDomain,
  useRenewSsl,
  useRefreshStatus,
  useDeleteDomain,
  useBulkDeleteDomains,
  useBulkEnableHttps,
  useBulkDisableDomains,
  useBulkMakePrimary,
} from "@/features/domains/hooks";
import { STATUS_OPTIONS, SSL_OPTIONS, DNS_OPTIONS, SORT_OPTIONS } from "@/features/domains/constants";
import { DomainMetricCards } from "@/features/domains/components/DomainMetricCards";
import { DomainStatusBadge } from "@/features/domains/components/DomainStatusBadge";
import { DomainRowActions } from "@/features/domains/components/DomainRowActions";
import { DomainCreateDrawer } from "@/features/domains/components/DomainCreateDrawer";
import { DomainDeleteDialog } from "@/features/domains/components/DomainDeleteDialog";
import { DomainEmptyState } from "@/features/domains/components/DomainEmptyState";
import { DomainLoadingState } from "@/features/domains/components/DomainLoadingState";
import { DomainErrorState } from "@/features/domains/components/DomainErrorState";
import { AppDataTable } from "@/components/ui/AppDataTable";
import type { PlatformDomain, DomainStatus, SslStatus, DnsStatus, CreateDomainPayload } from "@/features/domains/types";

function exportDomainsToCSV(domains: PlatformDomain[]) {
  const headers = ["النطاق", "العميل", "الحالة", "DNS", "SSL", "الصحة", "آخر فحص"];
  const rows = domains.map((d) => [
    d.domain, d.tenantName, d.status, d.dnsStatus, d.ssl.status,
    d.health.status, d.health.lastChecked ?? "",
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

function RelativeTime({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-muted-foreground">—</span>;

  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  let relative = "";
  if (diffMin < 1) relative = "الآن";
  else if (diffMin < 60) relative = `منذ ${diffMin} د`;
  else if (diffHr < 24) relative = `منذ ${diffHr} س`;
  else if (diffDay < 30) relative = `منذ ${diffDay} ي`;
  else relative = formatDate(date);

  return (
    <AppTooltipProvider delayDuration={200}>
      <AppTooltip>
        <AppTooltipTrigger asChild>
          <span className="cursor-help text-xs text-muted-foreground tabular-nums">
            {relative}
          </span>
        </AppTooltipTrigger>
        <AppTooltipContent side="top">
          <p className="text-xs">{formatDateTime(date)}</p>
        </AppTooltipContent>
      </AppTooltip>
    </AppTooltipProvider>
  );
}

function DomainsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DomainStatus | "all">("all");
  const [sslFilter, setSslFilter] = useState<SslStatus | "all">("all");
  const [dnsFilter, setDnsFilter] = useState<DnsStatus | "all">("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [sort, setSort] = useState("domain");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformDomain | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const params = useMemo(() => ({
    search,
    status: statusFilter,
    sslStatus: sslFilter,
  }), [search, statusFilter, sslFilter]);

  const domainsQuery = useDomains(params);
  const { metrics: dashboardMetrics, isLoading: metricsLoading } = useDomainMetrics();
  const createDomain = useCreateDomain();
  const renewSsl = useRenewSsl();
  const refreshStatus = useRefreshStatus();
  const deleteDomain = useDeleteDomain();
  const bulkDelete = useBulkDeleteDomains();
  const bulkEnableHttps = useBulkEnableHttps();
  const bulkDisable = useBulkDisableDomains();
  const bulkMakePrimary = useBulkMakePrimary();

  const allDomains = domainsQuery.data?.data ?? [];
  const isLoading = domainsQuery.isLoading;
  const isError = domainsQuery.isError;

  const tenants = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    allDomains.forEach((d) => {
      if (!map.has(d.tenantId)) map.set(d.tenantId, { id: d.tenantId, name: d.tenantName });
    });
    return Array.from(map.values());
  }, [allDomains]);

  const domains = useMemo(() => {
    let result = allDomains;
    if (tenantFilter !== "all") {
      result = result.filter((d) => d.tenantId === tenantFilter);
    }
    return result;
  }, [allDomains, tenantFilter]);

  const openCreateDrawer = useCallback(() => setCreateDrawerOpen(true), []);

  const handleViewDetails = useCallback((domain: PlatformDomain) => {
    router.push(`/superadmin/dashboard/domains/${domain.id}`);
  }, [router]);

  const handleRefreshStatus = useCallback(
    (domain: PlatformDomain) => refreshStatus.mutate(domain.id),
    [refreshStatus],
  );

  const handleRenewSsl = useCallback(
    (domain: PlatformDomain) => renewSsl.mutate(domain.id),
    [renewSsl],
  );

  const handleEdit = useCallback((domain: PlatformDomain) => {
    router.push(`/superadmin/dashboard/domains/${domain.id}/edit`);
  }, [router]);

  const handleCopy = useCallback((domain: PlatformDomain) => {
    navigator.clipboard.writeText(domain.domain);
  }, []);

  const handleOpen = useCallback((domain: PlatformDomain) => {
    window.open(`https://${domain.domain}`, "_blank", "noopener,noreferrer");
  }, []);

  const handleMakePrimary = useCallback((domain: PlatformDomain) => {
    console.log("make primary", domain.id);
  }, []);

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

  const handleCreateSave = useCallback(
    (data: CreateDomainPayload) => {
      createDomain.mutate(data, { onSuccess: () => setCreateDrawerOpen(false) });
    },
    [createDomain],
  );

  const columns = useMemo<DataTableColumn<PlatformDomain>[]>(
    () => [
      {
        id: "domain",
        label: "النطاق",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-sm font-medium truncate">{row.domain}</span>
            {row.isPrimary && (
              <span className="shrink-0 rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                أساسي
              </span>
            )}
          </div>
        ),
        mobileRender: (row) => (
          <div>
            <p className="font-mono text-sm font-medium">{row.domain}</p>
            <p className="text-xs text-muted-foreground">{row.tenantName}</p>
          </div>
        ),
      },
      {
        id: "tenantName",
        label: "العميل",
        sortable: true,
        hidden: "md",
        render: (row) => (
          <span className="text-sm text-muted-foreground">{row.tenantName}</span>
        ),
      },
      {
        id: "status",
        label: "الحالة",
        sortable: true,
        render: (row) => <DomainStatusBadge type="status" value={row.status} />,
      },
      {
        id: "dnsStatus",
        label: "DNS",
        sortable: false,
        render: (row) => <DomainStatusBadge type="dns" value={row.dnsStatus} />,
        hidden: "lg",
      },
      {
        id: "ssl",
        label: "SSL",
        sortable: false,
        render: (row) => <DomainStatusBadge type="ssl" value={row.ssl.status} />,
      },
      {
        id: "health",
        label: "الصحة",
        sortable: false,
        render: (row) => <DomainStatusBadge type="health" value={row.health.status} />,
        hidden: "lg",
      },
      {
        id: "lastCheck",
        label: "آخر فحص",
        sortable: false,
        render: (row) => <RelativeTime date={row.health.lastChecked} />,
        hidden: "md",
      },
      {
        id: "actions",
        label: "",
        className: "w-10",
        render: (row) => (
          <DomainRowActions
            domain={row}
            onView={() => handleViewDetails(row)}
            onEdit={() => handleEdit(row)}
            onRefreshStatus={() => handleRefreshStatus(row)}
            onRenewSsl={() => handleRenewSsl(row)}
            onCopy={() => handleCopy(row)}
            onOpen={() => handleOpen(row)}
            onMakePrimary={() => handleMakePrimary(row)}
            onDelete={() => handleDelete(row)}
          />
        ),
      },
    ],
    [handleViewDetails, handleEdit, handleRefreshStatus, handleRenewSsl, handleCopy, handleOpen, handleMakePrimary, handleDelete],
  );

  const filters = useMemo<DataTableFilter[]>(
    () => [
      { id: "status", label: "الحالة", options: STATUS_OPTIONS },
      {
        id: "ssl.status",
        label: "SSL",
        options: SSL_OPTIONS,
        accessor: (row) => (row as PlatformDomain).ssl.status,
      },
      { id: "dnsStatus", label: "DNS", options: DNS_OPTIONS },
      {
        id: "tenantId",
        label: "العميل",
        options: [
          { value: "all", label: "جميع العملاء" },
          ...tenants.map((t) => ({ value: t.id, label: t.name })),
        ],
      },
    ],
    [tenants],
  );

  const sortOptions = useMemo(
    () => SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );

  const handleSortChange = useCallback((value: string) => {
    if (sort === value) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(value);
      setSortDir("asc");
    }
  }, [sort]);

  const handleFilterChange = useCallback((filterId: string, value: string) => {
    switch (filterId) {
      case "status": setStatusFilter(value as DomainStatus | "all"); break;
      case "ssl.status": setSslFilter(value as SslStatus | "all"); break;
      case "dnsStatus": setDnsFilter(value as DnsStatus | "all"); break;
      case "tenantId": setTenantFilter(value); break;
    }
  }, []);

  const activeFilters = useMemo(() => ({
    status: statusFilter,
    "ssl.status": sslFilter,
    dnsStatus: dnsFilter,
    tenantId: tenantFilter,
  }), [statusFilter, sslFilter, dnsFilter, tenantFilter]);

  const handleBulkDelete = useCallback(() => {
    if (selectedDomains.length === 0) return;
    setBulkDeleteOpen(true);
  }, [selectedDomains]);

  const confirmBulkDelete = useCallback(() => {
    if (selectedDomains.length === 0) return;
    bulkDelete.mutate(selectedDomains, {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setSelectedDomains([]);
      },
    });
  }, [selectedDomains, bulkDelete]);

  const renderMobileCard = useCallback((row: PlatformDomain) => (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium truncate">{row.domain}</p>
          <p className="text-xs text-muted-foreground">{row.tenantName}</p>
        </div>
        <DomainRowActions
          domain={row}
          onView={() => handleViewDetails(row)}
          onEdit={() => handleEdit(row)}
          onRefreshStatus={() => handleRefreshStatus(row)}
          onRenewSsl={() => handleRenewSsl(row)}
          onCopy={() => handleCopy(row)}
          onOpen={() => handleOpen(row)}
          onMakePrimary={() => handleMakePrimary(row)}
          onDelete={() => handleDelete(row)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <DomainStatusBadge type="status" value={row.status} />
        <DomainStatusBadge type="dns" value={row.dnsStatus} />
        <DomainStatusBadge type="ssl" value={row.ssl.status} />
        <DomainStatusBadge type="health" value={row.health.status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>آخر فحص: <RelativeTime date={row.health.lastChecked} /></span>
        {row.isPrimary && (
          <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            أساسي
          </span>
        )}
      </div>
    </div>
  ), [handleViewDetails, handleEdit, handleRefreshStatus, handleRenewSsl, handleCopy, handleOpen, handleMakePrimary, handleDelete]);

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
                  <AppDropdownMenuItem onClick={() => bulkEnableHttps.mutate(selectedDomains)}>
                    تفعيل HTTPS
                  </AppDropdownMenuItem>
                  <AppDropdownMenuItem onClick={() => bulkMakePrimary.mutate(selectedDomains)}>
                    تعيين كأساسي
                  </AppDropdownMenuItem>
                  <AppDropdownMenuSeparator />
                  <AppDropdownMenuItem onClick={() => bulkDisable.mutate(selectedDomains)}>
                    تعطيل
                  </AppDropdownMenuItem>
                  <AppDropdownMenuItem
                    onClick={handleBulkDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    حذف
                  </AppDropdownMenuItem>
                </AppDropdownMenuContent>
              </AppDropdownMenu>
              <AppButton variant="outline" size="sm" onClick={() => exportDomainsToCSV(allDomains)}>
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
            metrics={dashboardMetrics}
            loading={metricsLoading}
          />
        </AppSection>

        <AppSection>
          {isError ? (
            <DomainErrorState onRetry={() => domainsQuery.refetch()} />
          ) : isLoading ? (
            <DomainLoadingState />
          ) : allDomains.length === 0 && !search ? (
            <DomainEmptyState onCreate={openCreateDrawer} />
          ) : (
            <>
              {selectedDomains.length > 0 && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
                  <span className="text-sm text-muted-foreground">
                    تم تحديد <span className="font-semibold text-foreground">{selectedDomains.length}</span> نطاق
                  </span>
                  <div className="mr-auto flex items-center gap-2">
                    <AppButton variant="destructive" size="sm" onClick={handleBulkDelete} loading={bulkDelete.isPending}>
                      <Trash2 className="h-4 w-4" />
                      حذف المحددة
                    </AppButton>
                    <AppButton variant="ghost" size="sm" onClick={() => setSelectedDomains([])}>
                      إلغاء التحديد
                    </AppButton>
                  </div>
                </div>
              )}
              <AppDataTable
                columns={columns}
                data={domains}
                rowKey={(row) => row.id}
                searchPlaceholder="بحث عن نطاق أو عميل..."
                searchValue={search}
                onSearchChange={setSearch}
                searchKeys={["domain", "tenantName"]}
                filters={filters}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                sortOptions={sortOptions}
                sortValue={sort}
                sortDirection={sortDir}
                onSortChange={handleSortChange}
                onSortDirectionChange={setSortDir}
                onRowClick={handleViewDetails}
                renderMobileCard={renderMobileCard}
                refreshButton
                onRefresh={() => domainsQuery.refetch()}
                refreshing={domainsQuery.isRefetching}
                emptyTitle="لا توجد نتائج مطابقة"
                emptyDescription="جرّب تغيير معايير البحث أو الفلترة."
                totalLabel={`إجمالي ${domains.length} نطاق`}
              />
            </>
          )}
        </AppSection>

        <DomainCreateDrawer
          open={createDrawerOpen}
          onOpenChange={setCreateDrawerOpen}
          onSave={handleCreateSave}
          saving={createDomain.isPending}
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
