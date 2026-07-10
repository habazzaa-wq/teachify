export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

export interface ServiceHealth {
  service: string;
  status: HealthStatus;
  latency: number;
  availability: number;
  lastChecked: string;
  retryQueue?: number;
}

export interface PlatformMetrics {
  totalStorage: number;
  totalBandwidth: number;
  totalViews: number;
  totalRequests: number;
  totalVideos: number;
  totalFiles: number;
  totalCollections: number;
  totalTenants: number;
}

export interface UsageDataPoint {
  label: string;
  value: number;
}

export interface UsageReport {
  period: string;
  storage: UsageDataPoint[];
  bandwidth: UsageDataPoint[];
  views: UsageDataPoint[];
  requests: UsageDataPoint[];
}

export interface TopConsumer {
  tenantId: string;
  tenantName: string;
  storage: number;
  bandwidth: number;
  views: number;
  growth: number;
}

export interface AlertItem {
  id: string;
  type: "storage" | "bandwidth" | "views" | "subscription" | "sync" | "webhook" | "retry";
  severity: "critical" | "warning" | "info";
  tenantId?: string;
  tenantName?: string;
  message: string;
  value?: number;
  threshold?: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface SyncJob {
  id: string;
  tenantId?: string;
  tenantName?: string;
  type: "sync" | "retry" | "upload" | "webhook";
  status: "running" | "completed" | "failed" | "pending";
  startedAt: string;
  completedAt?: string;
  duration: number;
  retries: number;
  error?: string;
}

export interface BunnyTenantUsage {
  tenantId: string;
  tenantName: string;
  tenantLogo: string | null;
  plan: string;
  storageUsed: number;
  storageLimit: number;
  bandwidthUsed: number;
  bandwidthLimit: number;
  viewsUsed: number;
  viewsLimit: number;
  remainingStorage: number;
  remainingBandwidth: number;
  remainingViews: number;
  usagePercentage: number;
  storagePercentage: number;
  bandwidthPercentage: number;
  viewsPercentage: number;
  health: "healthy" | "warning" | "critical";
  lastSync: string;
  lastUpload: string;
  lastActivity: string;
  status: string;
  pinned: boolean;
  favorited: boolean;
  sparkline?: number[];
}

export interface BunnyCenterFilters {
  search?: string;
  searchBy?: "tenant" | "email" | "subdomain" | "plan" | "storage" | "bandwidth" | "views";
  plan?: string;
  usagePercentage?: string;
  storagePercentage?: string;
  bandwidthPercentage?: string;
  viewsPercentage?: string;
  health?: HealthStatus | "all";
  status?: string;
  sort?: string;
  sortDir?: "asc" | "desc";
}

export interface ExportPayload {
  format: "csv" | "excel" | "json" | "pdf";
  data: BunnyTenantUsage[];
  fileName: string;
}
