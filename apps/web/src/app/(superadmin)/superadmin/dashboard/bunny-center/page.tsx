"use client";

import { useState, useCallback } from "react";
import { motion, MotionConfig } from "framer-motion";
import { RefreshCw, Download, FileDown, FileSpreadsheet, FileJson, FileText, ChevronDown } from "lucide-react";
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
import {
  AppPage,
  AppPageHeader,
  AppDivider,
  AppButton,
  AppDropdownMenu,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuTrigger,
} from "@/components/ui";
import { usePlatformMetrics, useServiceHealth, useUsageReport, useTopConsumers, useAlerts, useSyncJobs, useTenantUsageList, useExportData } from "@/features/bunny-center/hooks";
import { BunnyCenterHeader } from "@/features/bunny-center/components/BunnyCenterHeader";
import { PlatformHealthSection } from "@/features/bunny-center/components/PlatformHealthSection";
import { UsageVisualizationSection } from "@/features/bunny-center/components/UsageVisualizationSection";
import { AlertsCenter } from "@/features/bunny-center/components/AlertsCenter";
import { SyncJobsSection } from "@/features/bunny-center/components/SyncJobsSection";
import { SystemStatusSection } from "@/features/bunny-center/components/SystemStatusSection";
import { TenantExplorer } from "@/features/bunny-center/components/TenantExplorer";
import type { BunnyCenterFilters, BunnyTenantUsage, ExportPayload } from "@/features/bunny-center/types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

function BunnyCenterPage() {
  const [filters, setFilters] = useState<BunnyCenterFilters>({});
  const [exportOpen, setExportOpen] = useState(false);

  const metricsQuery = usePlatformMetrics();
  const healthQuery = useServiceHealth();
  const usageQuery = useUsageReport();
  const consumersQuery = useTopConsumers();
  const alertsQuery = useAlerts();
  const jobsQuery = useSyncJobs();
  const tenantListQuery = useTenantUsageList(filters);
  const exportMutation = useExportData();

  const handleFilterChange = useCallback((newFilters: BunnyCenterFilters) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    metricsQuery.refetch();
    healthQuery.refetch();
    usageQuery.refetch();
    consumersQuery.refetch();
    alertsQuery.refetch();
    jobsQuery.refetch();
    tenantListQuery.refetch();
  }, [metricsQuery, healthQuery, usageQuery, consumersQuery, alertsQuery, jobsQuery, tenantListQuery]);

  const handleExport = useCallback((format: ExportPayload["format"]) => {
    if (!tenantListQuery.data) return;
    const data: BunnyTenantUsage[] = tenantListQuery.data;
    const payload: ExportPayload = {
      format,
      data,
      fileName: `bunny-center-${new Date().toISOString().slice(0, 10)}`,
    };
    exportMutation.mutate(payload);
  }, [tenantListQuery.data, exportMutation]);

  return (
    <SuperAdminGuard>
      <MotionConfig reducedMotion="user">
        <AppPage maxWidth="full">
          <AppPageHeader
            title=""
            description=""
            actions={
              <>
                <AppButton variant="outline" size="sm" onClick={handleRefresh} loading={metricsQuery.isRefetching}>
                  <RefreshCw className="h-4 w-4" />
                  تحديث
                </AppButton>
                <AppDropdownMenu open={exportOpen} onOpenChange={setExportOpen}>
                  <AppDropdownMenuTrigger asChild>
                    <AppButton variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                      تصدير
                      <ChevronDown className="h-3 w-3 me-1" />
                    </AppButton>
                  </AppDropdownMenuTrigger>
                  <AppDropdownMenuContent align="end">
                    <AppDropdownMenuItem onClick={() => handleExport("csv")}>
                      <FileDown className="h-4 w-4" />
                      CSV
                    </AppDropdownMenuItem>
                    <AppDropdownMenuItem onClick={() => handleExport("excel")}>
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel
                    </AppDropdownMenuItem>
                    <AppDropdownMenuItem onClick={() => handleExport("json")}>
                      <FileJson className="h-4 w-4" />
                      JSON
                    </AppDropdownMenuItem>
                    <AppDropdownMenuItem onClick={() => handleExport("csv")}>
                      <FileText className="h-4 w-4" />
                      PDF
                    </AppDropdownMenuItem>
                  </AppDropdownMenuContent>
                </AppDropdownMenu>
              </>
            }
          />

          <AppDivider className="mb-6" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
          >
            {/* Header Metrics */}
            <BunnyCenterHeader
              metrics={metricsQuery.data}
              loading={metricsQuery.isLoading}
            />

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Platform Health */}
              <motion.div variants={sectionVariants} className="lg:col-span-1">
                <PlatformHealthSection
                  services={healthQuery.data}
                  loading={healthQuery.isLoading}
                />
              </motion.div>

              {/* Usage Visualization - takes 2 columns */}
              <motion.div variants={sectionVariants} className="lg:col-span-2">
                <UsageVisualizationSection
                  usageReport={usageQuery.data}
                  topConsumers={consumersQuery.data}
                  loading={usageQuery.isLoading}
                />
              </motion.div>
            </div>

            {/* Alerts + Sync Jobs + System Status */}
            <div className="grid gap-8 lg:grid-cols-3">
              <motion.div variants={sectionVariants}>
                <AlertsCenter
                  alerts={alertsQuery.data}
                  loading={alertsQuery.isLoading}
                />
              </motion.div>
              <motion.div variants={sectionVariants}>
                <SyncJobsSection
                  jobs={jobsQuery.data}
                  loading={jobsQuery.isLoading}
                />
              </motion.div>
              <motion.div variants={sectionVariants}>
                <SystemStatusSection
                  services={healthQuery.data}
                  loading={healthQuery.isLoading}
                />
              </motion.div>
            </div>

            {/* Tenant Explorer */}
            <motion.div variants={sectionVariants}>
              <TenantExplorer
                tenants={tenantListQuery.data}
                topConsumers={consumersQuery.data}
                loading={tenantListQuery.isLoading}
                filters={filters}
                onFilterChange={handleFilterChange}
                onRefresh={() => tenantListQuery.refetch()}
              />
            </motion.div>

            <AppDivider />
            <div className="text-center">
              <p className="text-xs text-muted-foreground/60">
                مركز Bunny التحليلي — إصدار 1.0.0
              </p>
            </div>
          </motion.div>
        </AppPage>
      </MotionConfig>
    </SuperAdminGuard>
  );
}

export default BunnyCenterPage;
