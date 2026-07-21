export interface DomainTimelineEvent {
  id: string;
  type: "created" | "dns_verified" | "ssl_requested" | "ssl_issued" | "activated" | "renewed" | "suspended" | "failed" | "updated";
  title: string;
  description?: string;
  timestamp: string;
  actor: "system" | "admin";
  actorName?: string;
}

export interface DomainHealthCheck {
  id: string;
  name: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  message: string;
  lastChecked: string | null;
  value?: string;
}

export interface DomainLogEntry {
  id: string;
  time: string;
  source: string;
  level: "info" | "warning" | "error" | "debug";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface DomainLogsResponse {
  data: DomainLogEntry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DomainDetailAlert {
  id: string;
  variant: "warning" | "destructive" | "info";
  title: string;
  description: string;
}
