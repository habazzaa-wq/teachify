import { platformApi } from "@/services/api/platform-axios";
import type { PremiumPlan, PlansFilterParams, PlansMetricData } from "../types";

/**
 * Wire representation of a `platform_plans` row.
 *
 * The API returns raw model attributes (snake_case); the plan UI works in
 * camelCase, so every read is normalised here. `storage`, `bandwidth` and
 * `maximumUploadSize` are byte counts, matching `tenant_usage` and the limit
 * service, so the UI must not treat them as GB.
 */
interface PlatformPlanRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  badge: PremiumPlan["badge"];
  monthly_price: string | number;
  yearly_price: string | number;
  currency: string;
  display_order: number;
  trial_enabled: number;
  trial_days: number;
  recommended: number;
  visible: number;
  status: PremiumPlan["status"];
  limits: PremiumPlan["limits"] | null;
  features: PremiumPlan["features"] | null;
  video_storage: PremiumPlan["videoStorage"] | null;
  branding: PremiumPlan["branding"] | null;
  integrations: PremiumPlan["integrations"] | null;
  created_at: string;
  updated_at: string;
}

interface ApiEnvelope<T> {
  data: T;
}

function toPremiumPlan(row: PlatformPlanRow): PremiumPlan {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    badge: row.badge ?? null,
    monthlyPrice: Number(row.monthly_price ?? 0),
    yearlyPrice: Number(row.yearly_price ?? 0),
    currency: row.currency,
    displayOrder: row.display_order,
    trialEnabled: Boolean(row.trial_enabled),
    trialDays: row.trial_days,
    recommended: Boolean(row.recommended),
    visible: Boolean(row.visible),
    status: row.status,
    limits: (row.limits ?? null) as PremiumPlan["limits"],
    features: (row.features ?? null) as PremiumPlan["features"],
    videoStorage: (row.video_storage ?? null) as PremiumPlan["videoStorage"],
    branding: (row.branding ?? null) as PremiumPlan["branding"],
    integrations: (row.integrations ?? null) as PremiumPlan["integrations"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Sort keys are whitelisted server-side by column name, not camelCase. */
const SORT_COLUMNS: Record<string, string> = {
  name: "name",
  monthlyPrice: "monthly_price",
  yearlyPrice: "yearly_price",
  displayOrder: "display_order",
  createdAt: "created_at",
};

/** The controller accepts these keys in camelCase; everything else is dropped. */
function toWritePayload(data: Partial<PremiumPlan>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.slug !== undefined) payload.slug = data.slug;
  if (data.description !== undefined) payload.description = data.description;
  if (data.badge !== undefined) payload.badge = data.badge;
  if (data.monthlyPrice !== undefined) payload.monthlyPrice = data.monthlyPrice;
  if (data.yearlyPrice !== undefined) payload.yearlyPrice = data.yearlyPrice;
  if (data.currency !== undefined) payload.currency = data.currency;
  if (data.displayOrder !== undefined) payload.displayOrder = data.displayOrder;
  if (data.trialEnabled !== undefined) payload.trialEnabled = data.trialEnabled;
  if (data.trialDays !== undefined) payload.trialDays = data.trialDays;
  if (data.recommended !== undefined) payload.recommended = data.recommended;
  if (data.visible !== undefined) payload.visible = data.visible;
  if (data.status !== undefined) payload.status = data.status;
  if (data.limits !== undefined) payload.limits = data.limits;
  if (data.features !== undefined) payload.features = data.features;
  if (data.videoStorage !== undefined) payload.videoStorage = data.videoStorage;
  if (data.branding !== undefined) payload.branding = data.branding;
  if (data.integrations !== undefined) payload.integrations = data.integrations;

  return payload;
}

export const plansService = {
  async list(params?: PlansFilterParams): Promise<{ data: PremiumPlan[]; total: number }> {
    const query: Record<string, string> = {};
    if (params?.search) query.search = params.search;
    if (params?.status && params.status !== "all") query.status = params.status;
    if (params?.sort) query.sort = SORT_COLUMNS[params.sort] ?? "display_order";
    if (params?.sortDir) query.sort_dir = params.sortDir;

    const { data } = await platformApi.get<ApiEnvelope<PlatformPlanRow[]> & { total: number }>(
      "/plans",
      { params: query },
    );

    return { data: (data.data ?? []).map(toPremiumPlan), total: data.total ?? 0 };
  },

  async getById(id: string): Promise<PremiumPlan | null> {
    const { data } = await platformApi.get<ApiEnvelope<PlatformPlanRow>>(`/plans/${id}`);
    return toPremiumPlan(data.data);
  },

  async getMetrics(): Promise<PlansMetricData> {
    const { data } = await platformApi.get<PlansMetricData>("/plans/metrics");
    return data;
  },

  async create(data: Partial<PremiumPlan>): Promise<PremiumPlan> {
    const { data: response } = await platformApi.post<ApiEnvelope<PlatformPlanRow>>("/plans", toWritePayload(data));
    return toPremiumPlan(response.data);
  },

  async update(id: string, data: Partial<PremiumPlan>): Promise<PremiumPlan> {
    const { data: response } = await platformApi.put<ApiEnvelope<PlatformPlanRow>>(
      `/plans/${id}`,
      toWritePayload(data),
    );
    return toPremiumPlan(response.data);
  },

  async duplicate(id: string): Promise<PremiumPlan> {
    const { data } = await platformApi.post<ApiEnvelope<PlatformPlanRow>>(`/plans/${id}/duplicate`);
    return toPremiumPlan(data.data);
  },

  async archive(id: string): Promise<void> {
    await platformApi.post(`/plans/${id}/archive`);
  },

  async activate(id: string): Promise<void> {
    await platformApi.post(`/plans/${id}/activate`);
  },

  async deactivate(id: string): Promise<void> {
    await platformApi.post(`/plans/${id}/deactivate`);
  },

  async delete(id: string): Promise<void> {
    await platformApi.delete(`/plans/${id}`);
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await platformApi.post("/plans/bulk/delete", { ids: ids.map(String) });
  },
};
