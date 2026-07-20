import { platformApi } from "@/services/api/platform-axios";
import type { PremiumPlan, PlansFilterParams, PlansMetricData } from "../types";

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[key] = v;
  }
  return out;
}

function mapPlanFromApi(raw: Record<string, unknown>): PremiumPlan {
  return {
    id: String(raw.id),
    name: raw.name as string,
    slug: raw.slug as string,
    description: (raw.description as string) ?? "",
    badge: (raw.badge as PremiumPlan["badge"]) ?? null,
    monthlyPrice: Number(raw.monthly_price ?? 0),
    yearlyPrice: Number(raw.yearly_price ?? 0),
    currency: (raw.currency as string) ?? "SAR",
    displayOrder: Number(raw.display_order ?? 0),
    trialEnabled: Boolean(raw.trial_enabled),
    trialDays: Number(raw.trial_days ?? 0),
    recommended: Boolean(raw.recommended),
    visible: Boolean(raw.visible),
    status: raw.status as PremiumPlan["status"],
    limits: (raw.limits as PremiumPlan["limits"]) ?? {
      admins: null, instructors: null, students: null, courses: null,
      sections: null, lessons: null, videos: null, certificates: null,
      quizzes: null, assignments: null, discussionThreads: null,
      bookmarks: null, notes: null, notificationsPerMonth: null,
      apiRequests: null, storage: null, bandwidth: null,
      maximumUploadSize: null, maximumVideoDuration: null,
    },
    features: (raw.features as PremiumPlan["features"]) ?? {
      courses: false, certificates: false, assignments: false, quizzes: false,
      discussions: false, notes: false, bookmarks: false,
      basicAnalytics: false, advancedAnalytics: false,
      bunnyStream: false, videoStreaming: false, videoDownloadProtection: false, videoAnalytics: false,
      customBranding: false, whiteLabel: false, customDomain: false,
      auditLogs: false, activityLogs: false, apiAccess: false, webhooks: false,
      smtp: false, stripe: false, paypal: false, zoom: false, googleMeet: false, microsoftTeams: false,
      aiAssistant: false, aiGrading: false, aiAnalytics: false,
    },
    videoStorage: (raw.video_storage as PremiumPlan["videoStorage"]) ?? {
      storageLimit: 0, storageUsed: 0, bandwidthLimit: 0, bandwidthUsed: 0,
      videosLimit: 0, videosUsed: 0, maximumUploadSize: 0, maximumVideoDuration: 0,
      allowedFormats: ["mp4"], allowedQualities: ["720"],
    },
    branding: (raw.branding as PremiumPlan["branding"]) ?? {
      color: "#6366f1", gradient: "from-indigo-500 to-purple-600", icon: "rocket",
      recommendedRibbon: false, popularRibbon: false,
    },
    integrations: (raw.integrations as PremiumPlan["integrations"]) ?? {
      allowBunnyStorage: false, allowBunnyStream: false, allowSmtp: false,
      allowStripe: false, allowPaypal: false, allowZoom: false,
      allowMicrosoftTeams: false, allowGoogleMeet: false,
    },
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

function preparePayload(data: Partial<PremiumPlan>): Record<string, unknown> {
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
    if (params?.sort) {
      const sortMap: Record<string, string> = {
        name: "name",
        monthlyPrice: "monthly_price",
        yearlyPrice: "yearly_price",
        createdAt: "created_at",
        displayOrder: "display_order",
      };
      query.sort = sortMap[params.sort] ?? params.sort;
    }
    if (params?.sortDir) query.sort_dir = params.sortDir;

    const { data } = await platformApi.get("/plans", { params: query });

    return {
      data: (data.data as Record<string, unknown>[]).map(mapPlanFromApi),
      total: data.total as number,
    };
  },

  async getById(id: string): Promise<PremiumPlan | null> {
    try {
      const { data } = await platformApi.get(`/plans/${id}`);
      return mapPlanFromApi(data.data as Record<string, unknown>);
    } catch {
      return null;
    }
  },

  async getMetrics(): Promise<PlansMetricData> {
    const { data } = await platformApi.get("/plans/metrics");
    return {
      totalPlans: data.totalPlans ?? 0,
      activePlans: data.activePlans ?? 0,
      trialPlans: data.trialPlans ?? 0,
      featuredPlans: data.featuredPlans ?? 0,
      averageMonthlyPrice: data.averageMonthlyPrice ?? 0,
      unlimitedPlans: data.unlimitedPlans ?? 0,
    };
  },

  async create(data: Partial<PremiumPlan>): Promise<PremiumPlan> {
    const { data: res } = await platformApi.post("/plans", preparePayload(data));
    return mapPlanFromApi(res.data as Record<string, unknown>);
  },

  async update(id: string, data: Partial<PremiumPlan>): Promise<PremiumPlan | null> {
    const { data: res } = await platformApi.put(`/plans/${id}`, preparePayload(data));
    return mapPlanFromApi(res.data as Record<string, unknown>);
  },

  async duplicate(id: string): Promise<PremiumPlan | null> {
    const { data: res } = await platformApi.post(`/plans/${id}/duplicate`);
    return mapPlanFromApi(res.data as Record<string, unknown>);
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
    await platformApi.post("/plans/bulk/delete", { ids });
  },
};
