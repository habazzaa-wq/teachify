export interface PlatformStatsCounts {
  tenants: number;
  tenants_active: number;
  tenant_domains: number;
  users: number;
  courses: number;
  exams: number;
  exam_attempts: number;
  exam_attempts_pending: number;
}

export interface PlatformStatsQueues {
  backlog: Record<string, number>;
  backlog_total: number;
  failed: number | null;
  known_queues: string[];
}

export interface PlatformStatsMemory {
  total: number;
  available: number;
  used_percent: number;
}

export interface PlatformStatsHost {
  load_average: number[] | null;
  cpu_count: number | null;
  memory: PlatformStatsMemory | null;
  disk_free_bytes: number | null;
  disk_total_bytes: number | null;
  uptime_seconds: number | null;
}

export interface PlatformStatsPhp {
  version: string;
  memory_limit: string;
  max_execution_time: string;
  opcache_enabled: string;
}

export interface PlatformStats {
  counts: PlatformStatsCounts;
  queues: PlatformStatsQueues;
  host: PlatformStatsHost;
  php: PlatformStatsPhp;
  generated_at: string;
}