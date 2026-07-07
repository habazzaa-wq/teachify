import type { PlatformDomain, DomainsFilterParams, DomainsMetricData, CreateDomainPayload, VerificationStatus } from "../types";
import { mockDomains, getDomainsMetrics } from "../mock";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const domainsService = {
  async list(params?: DomainsFilterParams): Promise<{ data: PlatformDomain[]; total: number }> {
    await delay(400);
    let filtered = [...mockDomains];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.domain.toLowerCase().includes(q) ||
          d.tenantName.toLowerCase().includes(q) ||
          d.subdomain.toLowerCase().includes(q),
      );
    }

    if (params?.status && params.status !== "all") {
      filtered = filtered.filter((d) => d.status === params.status);
    }

    if (params?.type && params.type !== "all") {
      filtered = filtered.filter((d) => d.type === params.type);
    }

    if (params?.sslStatus && params.sslStatus !== "all") {
      filtered = filtered.filter((d) => d.ssl.status === params.sslStatus);
    }

    if (params?.verificationStatus && params.verificationStatus !== "all") {
      filtered = filtered.filter((d) => d.verificationStatus === params.verificationStatus);
    }

    if (params?.sort) {
      const dir = params.sortDir === "desc" ? -1 : 1;
      filtered.sort((a, b) => {
        const aVal = a[params.sort! as keyof PlatformDomain];
        const bVal = b[params.sort! as keyof PlatformDomain];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal) * dir;
        }
        if (aVal != null && bVal != null) {
          return (Number(aVal) - Number(bVal)) * dir;
        }
        return 0;
      });
    }

    return { data: filtered, total: filtered.length };
  },

  async getById(id: string): Promise<PlatformDomain | null> {
    await delay(200);
    return mockDomains.find((d) => d.id === id) ?? null;
  },

  async getMetrics(): Promise<DomainsMetricData> {
    await delay(300);
    return getDomainsMetrics();
  },

  async create(data: CreateDomainPayload): Promise<PlatformDomain> {
    await delay(500);
    const domain: PlatformDomain = {
      id: `dom_${Date.now()}`,
      tenantId: data.tenantId,
      tenantName: "",
      domain: data.domain,
      subdomain: data.subdomain,
      type: data.type,
      isPrimary: data.isPrimary,
      status: "pending",
      active: data.active,
      ssl: {
        provider: "Let's Encrypt",
        status: "none",
        issuedAt: null,
        expiresAt: null,
        autoRenewal: true,
        issuer: null,
        fingerprint: null,
        remainingDays: 0,
      },
      dnsRecords: [],
      dnsStatus: "unconfigured",
      verificationStatus: "pending",
      verifiedAt: null,
      verificationToken: `${data.subdomain || data.domain}-vrf-${Date.now()}`,
      health: {
        latency: 0,
        availability: 0,
        ssl: 0,
        dns: 0,
        http: 0,
        overall: 0,
        status: "unknown",
        lastChecked: null,
      },
      redirect: {
        enabled: false,
        httpToHttps: false,
        wwwToNonWww: false,
        rules: [],
      },
      advanced: {
        headers: { hsts: false, csp: false, xFrame: false, xssProtection: false },
        cache: false,
        compression: false,
        security: false,
      },
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDomains.push(domain);
    return domain;
  },

  async update(id: string, data: Partial<PlatformDomain>): Promise<PlatformDomain | null> {
    await delay(500);
    const index = mockDomains.findIndex((d) => d.id === id);
    if (index === -1) return null;
    mockDomains[index] = { ...mockDomains[index], ...data, updatedAt: new Date().toISOString() } as PlatformDomain;
    return mockDomains[index];
  },

  async verify(id: string): Promise<PlatformDomain | null> {
    await delay(800);
    const domain = mockDomains.find((d) => d.id === id);
    if (!domain) return null;
    const stages: VerificationStatus[] = ["pending", "dns_found", "ssl_requested", "ssl_issued", "active"];
    const currentIdx = stages.indexOf(domain.verificationStatus);
    if (currentIdx >= 0 && currentIdx < stages.length - 1) {
      domain.verificationStatus = stages[currentIdx + 1]!;
    }
    if (domain.verificationStatus === "active") {
      domain.status = "active";
      domain.dnsStatus = "verified";
      domain.ssl.status = "active";
    }
    return domain;
  },

  async renewSsl(id: string): Promise<PlatformDomain | null> {
    await delay(600);
    const domain = mockDomains.find((d) => d.id === id);
    if (!domain) return null;
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + 1);
    domain.ssl.status = "active";
    domain.ssl.issuedAt = now.toISOString();
    domain.ssl.expiresAt = expires.toISOString();
    domain.ssl.remainingDays = 365;
    domain.updatedAt = now.toISOString();
    return domain;
  },

  async refreshStatus(id: string): Promise<PlatformDomain | null> {
    await delay(500);
    const domain = mockDomains.find((d) => d.id === id);
    if (!domain) return null;
    const latency = Math.floor(Math.random() * 80) + 20;
    const availability = 99 + Math.random() * 0.99;
    domain.health = {
      ...domain.health,
      latency,
      availability: Math.round(availability * 100) / 100,
      overall: Math.round((availability / 100) * 100),
      lastChecked: new Date().toISOString(),
    };
    domain.updatedAt = new Date().toISOString();
    return domain;
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await delay(600);
    ids.forEach((id) => {
      const index = mockDomains.findIndex((d) => d.id === id);
      if (index !== -1) mockDomains.splice(index, 1);
    });
  },

  async bulkVerify(ids: string[]): Promise<void> {
    await delay(800);
    ids.forEach((id) => {
      const domain = mockDomains.find((d) => d.id === id);
      if (domain) {
        domain.verificationStatus = "active";
        domain.status = "active";
      }
    });
  },

  async bulkEnableHttps(ids: string[]): Promise<void> {
    await delay(500);
    ids.forEach((id) => {
      const domain = mockDomains.find((d) => d.id === id);
      if (domain) {
        domain.redirect.httpToHttps = true;
      }
    });
  },

  async bulkDisable(ids: string[]): Promise<void> {
    await delay(500);
    ids.forEach((id) => {
      const domain = mockDomains.find((d) => d.id === id);
      if (domain) {
        domain.active = false;
        domain.status = "removed";
      }
    });
  },

  async bulkMakePrimary(ids: string[]): Promise<void> {
    await delay(400);
    mockDomains.forEach((d) => { d.isPrimary = false; });
    ids.forEach((id) => {
      const domain = mockDomains.find((d) => d.id === id);
      if (domain) domain.isPrimary = true;
    });
  },

  async makePrimary(id: string): Promise<PlatformDomain | null> {
    await delay(300);
    mockDomains.forEach((d) => { d.isPrimary = false; });
    const domain = mockDomains.find((d) => d.id === id);
    if (domain) {
      domain.isPrimary = true;
      domain.updatedAt = new Date().toISOString();
    }
    return domain ?? null;
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const index = mockDomains.findIndex((d) => d.id === id);
    if (index !== -1) mockDomains.splice(index, 1);
  },
};
