import { api } from "@/services/api";
import type { PlatformDomain, DomainsFilterParams, DomainsMetricData, CreateDomainPayload } from "../types";

function mapDomain(raw: any): PlatformDomain {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenant_id),
    tenantName: raw.tenant?.name ?? "",
    domain: raw.domain,
    subdomain: raw.subdomain ?? "",
    type: raw.type === "platform_subdomain" ? "platform" : raw.type === "custom_domain" ? "custom" : raw.type === "wildcard" ? "wildcard" : "temporary",
    isPrimary: raw.is_primary,
    status: raw.status,
    active: raw.status === "active",
    ssl: {
      provider: raw.ssl_provider ?? "unknown",
      status: raw.ssl_status ?? "none",
      issuedAt: raw.ssl_issued_at,
      expiresAt: raw.ssl_expires_at,
      autoRenewal: true,
      issuer: raw.ssl_provider ?? null,
      fingerprint: null,
      remainingDays: raw.ssl_expires_at
        ? Math.max(0, Math.floor((new Date(raw.ssl_expires_at).getTime() - Date.now()) / 86400000))
        : 0,
    },
    dnsRecords: [],
    dnsStatus: raw.status === "active" ? "verified" : raw.status === "dns_verified" ? "verified" : raw.last_dns_check ? "pending" : "unconfigured",
    verificationStatus: raw.status === "active" ? "active" : raw.status === "dns_verified" ? "ssl_requested" : "pending",
    verifiedAt: raw.verified_at,
    verificationToken: raw.verification_token,
    health: {
      latency: 0,
      availability: 100,
      ssl: raw.ssl_status === "active" ? 100 : 0,
      dns: raw.status !== "pending" ? 100 : 0,
      http: raw.status === "active" ? 100 : 0,
      overall: raw.health_score ?? 0,
      status: (raw.health_score ?? 0) >= 90 ? "healthy" : (raw.health_score ?? 0) >= 50 ? "degraded" : "unknown",
      lastChecked: raw.last_health_check_at,
    },
    redirect: {
      enabled: true,
      httpToHttps: true,
      wwwToNonWww: false,
      rules: [],
    },
    advanced: {
      headers: { hsts: true, csp: false, xFrame: true, xssProtection: true },
      cache: true,
      compression: true,
      security: true,
    },
    notes: "",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export const domainsService = {
  async list(params?: DomainsFilterParams): Promise<{ data: PlatformDomain[]; total: number }> {
    const { data } = await api.get("/domains", { params });
    const domains = (data.domains ?? []).map(mapDomain);
    return { data: domains, total: domains.length };
  },

  async getById(id: string): Promise<PlatformDomain | null> {
    try {
      const { data } = await api.get(`/domains/${id}`);
      return data.domain ? mapDomain(data.domain) : null;
    } catch {
      return null;
    }
  },

  async getMetrics(): Promise<DomainsMetricData> {
    try {
      const { data } = await api.get("/domains");
      const domains: PlatformDomain[] = (data.domains ?? []).map(mapDomain);
      return {
        totalDomains: domains.length,
        primaryDomains: domains.filter((d) => d.isPrimary).length,
        pendingVerification: domains.filter((d) => d.verificationStatus !== "active").length,
        sslExpiringSoon: domains.filter((d) => d.ssl.remainingDays > 0 && d.ssl.remainingDays <= 30).length,
        healthyDomains: domains.filter((d) => d.health.status === "healthy").length,
        failedDomains: domains.filter((d) => d.status === "failed").length,
        averageResponseTime: Math.round(
          domains.filter((d) => d.health.latency > 0).reduce((s, d) => s + d.health.latency, 0) /
          Math.max(1, domains.filter((d) => d.health.latency > 0).length)
        ),
      };
    } catch {
      return {
        totalDomains: 0,
        primaryDomains: 0,
        pendingVerification: 0,
        sslExpiringSoon: 0,
        healthyDomains: 0,
        failedDomains: 0,
        averageResponseTime: 0,
      };
    }
  },

  async create(data: CreateDomainPayload): Promise<PlatformDomain> {
    const { data: result } = await api.post("/domains", {
      domain: data.domain,
      type: data.type === "custom" ? "custom_domain" : data.type === "platform" ? "platform_subdomain" : data.type,
      is_primary: data.isPrimary,
    });
    return mapDomain(result.domain);
  },

  async update(id: string, data: Partial<PlatformDomain>): Promise<PlatformDomain | null> {
    try {
      const payload: Record<string, any> = {};
      if (data.isPrimary !== undefined) payload.is_primary = data.isPrimary;
      const { data: result } = await api.put(`/domains/${id}`, payload);
      return result.domain ? mapDomain(result.domain) : null;
    } catch {
      return null;
    }
  },

  async getStatus(id: string): Promise<{ domain: PlatformDomain; verification: { dns_ready: boolean; ssl_ready: boolean; active: boolean } } | null> {
    try {
      const { data } = await api.get(`/domains/${id}/status`);
      return {
        domain: mapDomain(data.domain),
        verification: data.verification,
      };
    } catch {
      return null;
    }
  },

  async renewSsl(id: string): Promise<PlatformDomain | null> {
    const { data: result } = await api.get(`/domains/${id}`);
    return result.domain ? mapDomain(result.domain) : null;
  },

  async refreshStatus(id: string): Promise<PlatformDomain | null> {
    const { data: result } = await api.get(`/domains/${id}`);
    return result.domain ? mapDomain(result.domain) : null;
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => api.delete(`/domains/${id}`)));
  },

  async bulkVerify(): Promise<void> {
    // Auto-verification is handled by the backend scheduler.
    // No manual action needed.
  },

  async bulkEnableHttps(ids: string[]): Promise<void> {
    // HTTPS is handled automatically by Caddy on-demand TLS.
  },

  async bulkDisable(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => api.delete(`/domains/${id}`)));
  },

  async bulkMakePrimary(ids: string[]): Promise<void> {
    if (ids.length > 0) {
      await api.put(`/domains/${ids[0]}`, { is_primary: true });
    }
  },

  async makePrimary(id: string): Promise<PlatformDomain | null> {
    const { data: result } = await api.put(`/domains/${id}`, { is_primary: true });
    return result.domain ? mapDomain(result.domain) : null;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/domains/${id}`);
  },
};
