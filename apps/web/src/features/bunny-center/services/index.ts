import platformApi from "@/services/api/platform-axios";
import type {
  PlatformMetrics,
  ServiceHealth,
  UsageReport,
  TopConsumer,
  AlertItem,
  SyncJob,
  BunnyTenantUsage,
  BunnyCenterFilters,
} from "../types";

interface RawPlatformMetrics {
  total_storage: number;
  total_bandwidth: number;
  total_views: number;
  total_requests: number;
  total_videos: number;
  total_files: number;
  total_collections: number;
  total_tenants: number;
}

interface RawServiceHealth {
  service: string;
  status: string;
  latency: number;
  availability: number;
  last_checked: string;
  retry_queue?: number;
}

interface RawUsageReport {
  period: string;
  storage: { label: string; value: number }[];
  bandwidth: { label: string; value: number }[];
  views: { label: string; value: number }[];
  requests: { label: string; value: number }[];
}

interface RawTopConsumer {
  tenant_id: number;
  tenant_name: string;
  storage: number;
  bandwidth: number;
  views: number;
  storage_limit: number;
  bandwidth_limit: number;
  views_limit: number;
  storage_percentage: number;
  bandwidth_percentage: number;
  views_percentage: number;
}

interface RawAlertItem {
  id: string;
  type: string;
  severity: string;
  tenant_id?: number;
  tenant_name?: string;
  message: string;
  value?: number;
  threshold?: number;
  timestamp: string;
  acknowledged: boolean;
}

interface RawSyncJob {
  id: string;
  tenant_id?: number;
  tenant_name?: string;
  type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration: number;
  retries: number;
  error?: string;
}

interface RawBunnyTenantUsage {
  tenant_id: number;
  tenant_name: string;
  tenant_logo: string | null;
  plan: string;
  storage_used: number;
  storage_limit: number;
  bandwidth_used: number;
  bandwidth_limit: number;
  views_used: number;
  views_limit: number;
  remaining_storage: number;
  remaining_bandwidth: number;
  remaining_views: number;
  usage_percentage: number;
  storage_percentage: number;
  bandwidth_percentage: number;
  views_percentage: number;
  health: string;
  last_sync: string | null;
  last_upload: string | null;
  last_activity: string;
  status: string;
  pinned: boolean;
  favorited: boolean;
  sparkline: number[];
}

function mapMetrics(raw: RawPlatformMetrics): PlatformMetrics {
  return {
    totalStorage: raw.total_storage,
    totalBandwidth: raw.total_bandwidth,
    totalViews: raw.total_views,
    totalRequests: raw.total_requests,
    totalVideos: raw.total_videos,
    totalFiles: raw.total_files,
    totalCollections: raw.total_collections,
    totalTenants: raw.total_tenants,
  };
}

function mapServiceHealth(raw: RawServiceHealth): ServiceHealth {
  return {
    service: raw.service,
    status: raw.status as ServiceHealth["status"],
    latency: raw.latency,
    availability: raw.availability,
    lastChecked: raw.last_checked,
    retryQueue: raw.retry_queue,
  };
}

function mapUsageReport(raw: RawUsageReport): UsageReport {
  return {
    period: raw.period,
    storage: raw.storage,
    bandwidth: raw.bandwidth,
    views: raw.views,
    requests: raw.requests,
  };
}

function mapTopConsumer(raw: RawTopConsumer): TopConsumer {
  return {
    tenantId: String(raw.tenant_id),
    tenantName: raw.tenant_name,
    storage: raw.storage,
    bandwidth: raw.bandwidth,
    views: raw.views,
    growth: raw.storage_percentage,
  };
}

function mapAlertItem(raw: RawAlertItem): AlertItem {
  return {
    id: raw.id,
    type: raw.type as AlertItem["type"],
    severity: raw.severity as AlertItem["severity"],
    tenantId: raw.tenant_id != null ? String(raw.tenant_id) : undefined,
    tenantName: raw.tenant_name,
    message: raw.message,
    value: raw.value,
    threshold: raw.threshold,
    timestamp: raw.timestamp,
    acknowledged: raw.acknowledged,
  };
}

function mapSyncJob(raw: RawSyncJob): SyncJob {
  return {
    id: raw.id,
    tenantId: raw.tenant_id != null ? String(raw.tenant_id) : undefined,
    tenantName: raw.tenant_name,
    type: raw.type as SyncJob["type"],
    status: raw.status as SyncJob["status"],
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    duration: raw.duration,
    retries: raw.retries,
    error: raw.error,
  };
}

function mapBunnyTenantUsage(raw: RawBunnyTenantUsage): BunnyTenantUsage {
  return {
    tenantId: String(raw.tenant_id),
    tenantName: raw.tenant_name,
    tenantLogo: raw.tenant_logo,
    plan: raw.plan,
    storageUsed: raw.storage_used,
    storageLimit: raw.storage_limit,
    bandwidthUsed: raw.bandwidth_used,
    bandwidthLimit: raw.bandwidth_limit,
    viewsUsed: raw.views_used,
    viewsLimit: raw.views_limit,
    remainingStorage: raw.remaining_storage,
    remainingBandwidth: raw.remaining_bandwidth,
    remainingViews: raw.remaining_views,
    usagePercentage: raw.usage_percentage,
    storagePercentage: raw.storage_percentage,
    bandwidthPercentage: raw.bandwidth_percentage,
    viewsPercentage: raw.views_percentage,
    health: raw.health as BunnyTenantUsage["health"],
    lastSync: raw.last_sync ?? new Date().toISOString(),
    lastUpload: raw.last_upload ?? new Date().toISOString(),
    lastActivity: raw.last_activity,
    status: raw.status,
    pinned: raw.pinned,
    favorited: raw.favorited,
    sparkline: raw.sparkline,
  };
}

function buildSearchParams(filters?: BunnyCenterFilters): Record<string, string> {
  if (!filters) return {};
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.searchBy) params.search_by = filters.searchBy;
  if (filters.plan && filters.plan !== "all") params.plan = filters.plan;
  if (filters.health && filters.health !== "all") params.health = filters.health;
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.sort) params.sort = filters.sort;
  if (filters.sortDir) params.sort_dir = filters.sortDir;
  return params;
}

export const bunnyCenterService = {
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    const { data } = await platformApi.get<RawPlatformMetrics>(
      "/bunny-center/metrics",
    );
    return mapMetrics(data);
  },

  async getServiceHealth(): Promise<ServiceHealth[]> {
    const { data } = await platformApi.get<RawServiceHealth[]>(
      "/bunny-center/health",
    );
    return data.map(mapServiceHealth);
  },

  async getUsageReport(period: string = "yearly"): Promise<UsageReport> {
    const { data } = await platformApi.get<RawUsageReport>(
      "/bunny-center/usage-report",
      { params: { period } },
    );
    return mapUsageReport(data);
  },

  async getTopConsumers(): Promise<TopConsumer[]> {
    const { data } = await platformApi.get<RawTopConsumer[]>(
      "/bunny-center/top-consumers",
    );
    return data.map(mapTopConsumer);
  },

  async getAlerts(): Promise<AlertItem[]> {
    const { data } = await platformApi.get<RawAlertItem[]>(
      "/bunny-center/alerts",
    );
    return data.map(mapAlertItem);
  },

  async getSyncJobs(): Promise<SyncJob[]> {
    const { data } = await platformApi.get<RawSyncJob[]>(
      "/bunny-center/sync-jobs",
    );
    return data.map(mapSyncJob);
  },

  async getTenantUsageList(
    filters?: BunnyCenterFilters,
  ): Promise<BunnyTenantUsage[]> {
    const params = buildSearchParams(filters);
    const { data } = await platformApi.get<RawBunnyTenantUsage[]>(
      "/bunny-center/tenants",
      { params },
    );
    return data.map(mapBunnyTenantUsage);
  },

  async exportData(payload: {
    format: "csv" | "excel" | "json" | "pdf";
    data: BunnyTenantUsage[];
    fileName: string;
  }): Promise<void> {
    const { format, data, fileName } = payload;
    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const headers = [
      "المؤسسة",
      "الباقة",
      "التخزين (GB)",
      "النطاق (GB)",
      "المشاهدات",
      "المتبقي تخزين",
      "المتبقي نطاق",
      "المتبقي مشاهدات",
      "نسبة الاستخدام %",
      "الحالة",
      "آخر مزامنة",
    ];
    const rows = data.map((t) => [
      t.tenantName,
      t.plan,
      `${t.storageUsed}/${t.storageLimit}`,
      `${t.bandwidthUsed}/${t.bandwidthLimit}`,
      `${t.viewsUsed}/${t.viewsLimit}`,
      t.remainingStorage,
      t.remainingBandwidth,
      t.remainingViews,
      `${t.usagePercentage}%`,
      t.health === "healthy"
        ? "سليم"
        : t.health === "warning"
          ? "تحذير"
          : "حرج",
      new Date(t.lastSync).toLocaleDateString("ar"),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.${format === "excel" ? "csv" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
