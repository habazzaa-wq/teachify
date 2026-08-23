import { platformApi } from "@/services/api/platform-axios";

export interface QuestionImportHealth {
  enabled: boolean;
  configured: boolean;
  available: boolean;
  model: string;
  endpointHost: string | null;
  reason: string | null;
}

export const platformQuestionImportService = {
  async listTenants(): Promise<{ id: string; name: string }[]> {
    const { data } = await platformApi.get("/tenants");
    const items: unknown[] = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];
    return items.map((item) => {
      const t = item as { id: string | number; name: string };
      return { id: String(t.id), name: t.name };
    });
  },

  async getSettings(tenantId: string): Promise<Record<string, unknown>> {
    const { data } = await platformApi.get(
      `/tenants/${tenantId}/question-import/settings`,
    );
    return (data.values ?? {}) as Record<string, unknown>;
  },

  async updateSettings(
    tenantId: string,
    values: Record<string, unknown>,
  ): Promise<void> {
    await platformApi.put(
      `/tenants/${tenantId}/question-import/settings`,
      { values },
    );
  },

  async health(tenantId: string): Promise<QuestionImportHealth> {
    const { data } = await platformApi.get(
      `/tenants/${tenantId}/question-import/health`,
    );
    return (data.data ?? {}) as QuestionImportHealth;
  },
};
