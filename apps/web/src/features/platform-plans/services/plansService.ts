import type { PremiumPlan, PlansFilterParams, PlansMetricData } from "../types";
import { mockPlans, getPlansMetrics } from "../mock";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const plansService = {
  async list(params?: PlansFilterParams): Promise<{ data: PremiumPlan[]; total: number }> {
    await delay(400);
    let filtered = [...mockPlans];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    if (params?.status && params.status !== "all") {
      filtered = filtered.filter((p) => p.status === params.status);
    }

    if (params?.sort) {
      const dir = params.sortDir === "desc" ? -1 : 1;
      filtered.sort((a, b) => {
        const aVal = a[params.sort!];
        const bVal = b[params.sort!];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal) * dir;
        }
        return ((aVal as number) - (bVal as number)) * dir;
      });
    }

    return { data: filtered, total: filtered.length };
  },

  async getById(id: string): Promise<PremiumPlan | null> {
    await delay(200);
    return mockPlans.find((p) => p.id === id) ?? null;
  },

  async getMetrics(): Promise<PlansMetricData> {
    await delay(300);
    return getPlansMetrics();
  },

  async create(data: Partial<PremiumPlan>): Promise<PremiumPlan> {
    await delay(500);
    const plan: PremiumPlan = {
      id: `plan_${Date.now()}`,
      name: data.name ?? "باقة جديدة",
      slug: data.slug ?? "new-plan",
      description: data.description ?? "",
      badge: data.badge ?? null,
      monthlyPrice: data.monthlyPrice ?? 0,
      yearlyPrice: data.yearlyPrice ?? 0,
      currency: data.currency ?? "SAR",
      displayOrder: data.displayOrder ?? mockPlans.length + 1,
      trialEnabled: data.trialEnabled ?? false,
      trialDays: data.trialDays ?? 0,
      recommended: data.recommended ?? false,
      visible: data.visible ?? true,
      status: data.status ?? "draft",
      limits: data.limits ?? {
        admins: null, instructors: null, students: null, courses: null,
        sections: null, lessons: null, videos: null, certificates: null,
        quizzes: null, assignments: null, discussionThreads: null,
        bookmarks: null, notes: null, notificationsPerMonth: null,
        apiRequests: null, storage: null, bandwidth: null,
        maximumUploadSize: null, maximumVideoDuration: null,
      },
      features: data.features ?? {
        courses: false, certificates: false, assignments: false, quizzes: false,
        discussions: false, notes: false, bookmarks: false,
        basicAnalytics: false, advancedAnalytics: false,
        bunnyStream: false, videoStreaming: false, videoDownloadProtection: false, videoAnalytics: false,
        customBranding: false, whiteLabel: false, customDomain: false,
        auditLogs: false, activityLogs: false, apiAccess: false, webhooks: false,
        smtp: false, stripe: false, paypal: false, zoom: false, googleMeet: false, microsoftTeams: false,
        aiAssistant: false, aiGrading: false, aiAnalytics: false,
      },
      videoStorage: data.videoStorage ?? {
        storageLimit: 0, storageUsed: 0, bandwidthLimit: 0, bandwidthUsed: 0,
        videosLimit: 0, videosUsed: 0, maximumUploadSize: 0, maximumVideoDuration: 0,
        allowedFormats: ["mp4"], allowedQualities: ["720"],
      },
      branding: data.branding ?? {
        color: "#6366f1", gradient: "from-indigo-500 to-purple-600", icon: "rocket",
        recommendedRibbon: false, popularRibbon: false,
      },
      integrations: data.integrations ?? {
        allowBunnyStorage: false, allowBunnyStream: false, allowSmtp: false,
        allowStripe: false, allowPaypal: false, allowZoom: false,
        allowMicrosoftTeams: false, allowGoogleMeet: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPlans.push(plan);
    return plan;
  },

  async update(id: string, data: Partial<PremiumPlan>): Promise<PremiumPlan | null> {
    await delay(500);
    const index = mockPlans.findIndex((p) => p.id === id);
    if (index === -1) return null;
    mockPlans[index] = { ...mockPlans[index], ...data, updatedAt: new Date().toISOString() } as PremiumPlan;
    return mockPlans[index];
  },

  async duplicate(id: string): Promise<PremiumPlan | null> {
    await delay(400);
    const original = mockPlans.find((p) => p.id === id);
    if (!original) return null;
    const duplicate: PremiumPlan = {
      ...original,
      id: `plan_${Date.now()}`,
      name: `نسخة من ${original.name}`,
      slug: `${original.slug}-copy-${Date.now()}`,
      status: "draft",
      visible: false,
      recommended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPlans.push(duplicate);
    return duplicate;
  },

  async archive(id: string): Promise<void> {
    await delay(300);
    const plan = mockPlans.find((p) => p.id === id);
    if (plan) {
      plan.status = "archived";
      plan.updatedAt = new Date().toISOString();
    }
  },

  async activate(id: string): Promise<void> {
    await delay(300);
    const plan = mockPlans.find((p) => p.id === id);
    if (plan) {
      plan.status = "active";
      plan.updatedAt = new Date().toISOString();
    }
  },

  async deactivate(id: string): Promise<void> {
    await delay(300);
    const plan = mockPlans.find((p) => p.id === id);
    if (plan) {
      plan.status = "hidden";
      plan.updatedAt = new Date().toISOString();
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const index = mockPlans.findIndex((p) => p.id === id);
    if (index !== -1) mockPlans.splice(index, 1);
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await delay(600);
    ids.forEach((id) => {
      const index = mockPlans.findIndex((p) => p.id === id);
      if (index !== -1) mockPlans.splice(index, 1);
    });
  },
};
