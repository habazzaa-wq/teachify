export type DomainType = "platform" | "custom" | "wildcard" | "temporary";

export type DomainStatus = "pending" | "active" | "failed" | "removed";

export type SslStatus = "active" | "pending" | "expired" | "error" | "none";

export type DnsStatus = "verified" | "pending" | "failed" | "unconfigured";

export type VerificationStatus = "pending" | "dns_found" | "ssl_requested" | "ssl_issued" | "active";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface DnsRecord {
  id: string;
  type: "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS";
  host: string;
  value: string;
  ttl: number;
  status: DnsStatus;
}

export interface SslInfo {
  provider: string;
  status: SslStatus;
  issuedAt: string | null;
  expiresAt: string | null;
  autoRenewal: boolean;
  issuer: string | null;
  fingerprint: string | null;
  remainingDays: number;
}

export interface RedirectRule {
  id: string;
  source: string;
  destination: string;
  type: "permanent" | "temporary";
  status: "active" | "inactive";
}

export interface DomainHealth {
  latency: number;
  availability: number;
  ssl: number;
  dns: number;
  http: number;
  overall: number;
  status: HealthStatus;
  lastChecked: string | null;
}

export interface DomainHeaders {
  hsts: boolean;
  csp: boolean;
  xFrame: boolean;
  xssProtection: boolean;
}

export interface DomainAdvanced {
  headers: DomainHeaders;
  cache: boolean;
  compression: boolean;
  security: boolean;
}

export interface PlatformDomain {
  id: string;
  tenantId: string;
  tenantName: string;
  domain: string;
  subdomain: string;
  type: DomainType;
  isPrimary: boolean;
  status: DomainStatus;
  active: boolean;
  ssl: SslInfo;
  dnsRecords: DnsRecord[];
  dnsStatus: DnsStatus;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verificationToken: string | null;
  health: DomainHealth;
  redirect: {
    enabled: boolean;
    httpToHttps: boolean;
    wwwToNonWww: boolean;
    rules: RedirectRule[];
  };
  advanced: DomainAdvanced;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDomainPayload {
  tenantId: string;
  domain: string;
  subdomain: string;
  type: DomainType;
  isPrimary: boolean;
  active: boolean;
  notes: string;
}

export interface DomainsFilterParams {
  search?: string;
  tenantId?: string;
  status?: DomainStatus | "all";
  type?: DomainType | "all";
  sslStatus?: SslStatus | "all";
  verificationStatus?: VerificationStatus | "all";
  health?: HealthStatus | "all";
  sort?: "domain" | "createdAt" | "tenantName" | "type";
  sortDir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface DomainsMetricData {
  totalDomains: number;
  primaryDomains: number;
  pendingVerification: number;
  sslExpiringSoon: number;
  healthyDomains: number;
  failedDomains: number;
  averageResponseTime: number;
}
