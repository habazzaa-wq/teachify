import { platformApi } from "@/services/api/platform-axios";
import type { Tenant, TenantsFilterParams, TenantsMetricData, WizardState, TenantCreationResult } from "../types";

const FIELD_MAP: Record<string, string> = {
  companyName: "company_name",
  supportEmail: "support_email",
  ownerAccount: "owner_account",
  integrations: "integrations_json",
  storage: "storage_json",
  domainHistory: "domain_history",
  recentLogins: "recent_logins",
  recentApiCalls: "recent_api_calls",
  lastActivity: "last_activity",
  lastLogin: "last_login",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

function toSnakeKey(key: string): string {
  if (FIELD_MAP[key]) return FIELD_MAP[key];
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function mapToSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeKey(key)] = value;
  }
  return result;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export const platformTenantsApiService = {
  async list(params?: TenantsFilterParams): Promise<{ data: Tenant[]; total: number }> {
    const query: Record<string, string> = {};
    if (params?.search) query.search = params.search;
    if (params?.status && params.status !== "all") query.status = params.status;
    if (params?.sort) query.sort = params.sort;
    if (params?.page) query.page = String(params.page);
    if (params?.perPage) query.per_page = String(params.perPage);

    const { data } = await platformApi.get<PaginatedResponse<Tenant>>("/tenants", {
      params: query,
    });

    return { data: data.data, total: data.meta.total };
  },

  async getById(id: string): Promise<Tenant | null> {
    try {
      const { data } = await platformApi.get<{ tenant: Tenant }>(`/tenants/${id}`);
      return data.tenant;
    } catch {
      return null;
    }
  },

  async getMetrics(): Promise<TenantsMetricData> {
    const { data } = await platformApi.get<PaginatedResponse<Tenant>>("/tenants", {
      params: { per_page: 1 },
    });

    return {
      totalTenants: data.meta.total,
      activeTenants: 0,
      pendingTenants: 0,
      trialTenants: 0,
      totalUsers: 0,
      totalStorageUsed: 0,
      totalVideos: 0,
      monthlyRevenue: 0,
    };
  },

  async create(data: Partial<Tenant>): Promise<Tenant> {
    const payload = {
      academy_name: data.name,
      academy_slug: data.slug,
      owner_name: data.owner?.name,
      owner_email: data.owner?.email,
      owner_password: data.ownerAccount?.password ?? "ChangeMe123!",
    };
    const response = await platformApi.post<{ tenant: Tenant }>("/tenants", payload);
    return response.data.tenant;
  },

  async createWizard(wizard: WizardState): Promise<TenantCreationResult> {
    const payload = {
      academy_name: wizard.section1.name,
      academy_slug: wizard.section1.slug,
      owner_name: wizard.section4.ownerName,
      owner_email: wizard.section4.ownerEmail,
      owner_password: wizard.section4.password,
    };
    const response = await platformApi.post<{ tenant: Tenant }>("/tenants", payload);
    const tenant = response.data.tenant;
    const baseDomain = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? "academy.test";

    return {
      tenant,
      generatedPassword: wizard.section4.password,
      loginUrl: `${window.location.protocol}//${wizard.section2.subdomain}.${baseDomain}${window.location.port ? `:${window.location.port}` : ""}`,
    };
  },

  async update(id: string, data: Partial<Tenant>): Promise<Tenant | null> {
    const EDITABLE_FIELDS = new Set([
      "name", "slug", "status", "description", "phone", "timezone", "language",
      "currency", "companyName", "supportEmail", "notes", "tags", "address",
      "owner", "ownerAccount", "branding", "limits", "integrations",
      "storage", "security", "domain", "subscription",
    ]);
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (EDITABLE_FIELDS.has(key)) {
        filtered[key] = value;
      }
    }
    const payload = mapToSnakeCase(filtered);
    const response = await platformApi.put<{ tenant: Tenant }>(`/tenants/${id}`, payload);
    return response.data.tenant;
  },

  async delete(id: string): Promise<void> {
    await platformApi.delete(`/tenants/${id}`);
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await platformApi.post("/tenants/bulk/delete", { ids });
  },
};
