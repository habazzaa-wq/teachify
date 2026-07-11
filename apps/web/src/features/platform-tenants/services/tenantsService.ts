import type { Tenant, TenantsFilterParams, TenantsMetricData, WizardState, TenantCreationResult, ImpersonationToken, PasswordResetResult } from "../types";
import { tenantStorage } from "./tenant-storage";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let _tenants: Tenant[] | null = null;
function getTenants(): Tenant[] {
  if (!_tenants) _tenants = tenantStorage.load();
  return _tenants;
}
function persist(): void {
  if (_tenants) tenantStorage.save(_tenants);
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export const tenantsService = {
  async list(params?: TenantsFilterParams): Promise<{ data: Tenant[]; total: number }> {
    await delay(400);
    let filtered = [...getTenants()];

    if (params?.search) {
      const q = params.search.toLowerCase();
      const searchBy = params.searchBy ?? "name";
      filtered = filtered.filter((t) => {
        switch (searchBy) {
          case "owner": return t.owner.name.toLowerCase().includes(q) || t.owner.email.toLowerCase().includes(q);
          case "email": return t.owner.email.toLowerCase().includes(q);
          case "domain": return t.domain.platformSubdomain.toLowerCase().includes(q) || (t.domain.customDomain && t.domain.customDomain.toLowerCase().includes(q));
          case "plan": return t.subscription.planName.toLowerCase().includes(q);
          default: return t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
        }
      });
    }

    if (params?.status && params.status !== "all") {
      filtered = filtered.filter((t) => t.status === params.status);
    }

    if (params?.subscriptionPlan && params.subscriptionPlan !== "all") {
      filtered = filtered.filter((t) => t.subscription.planName === params.subscriptionPlan);
    }

    if (params?.billingStatus && params.billingStatus !== "all") {
      filtered = filtered.filter((t) => t.subscription.status === params.billingStatus);
    }

    if (params?.country && params.country !== "all") {
      filtered = filtered.filter((t) => t.address.country === params.country);
    }

    if (params?.language && params.language !== "all") {
      filtered = filtered.filter((t) => t.language === params.language);
    }

    if (params?.trialOnly) {
      filtered = filtered.filter((t) => t.status === "trial");
    }

    if (params?.expired) {
      filtered = filtered.filter((t) => t.status === "expired");
    }

    if (params?.activeArchived === "active") {
      filtered = filtered.filter((t) => t.status === "active");
    } else if (params?.activeArchived === "archived") {
      filtered = filtered.filter((t) => t.status === "archived");
    }

    if (params?.sort) {
      const dir = params.sortDir === "desc" ? -1 : 1;
      filtered.sort((a, b) => {
        switch (params.sort) {
          case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "name": return a.name.localeCompare(b.name) * dir;
          case "revenue": return (b.revenue - a.revenue) * dir;
          case "storage": return (b.limits.storageUsed - a.limits.storageUsed) * dir;
          case "users": return (b.limits.usersUsed - a.limits.usersUsed) * dir;
          case "videos": return (b.limits.videosUsed - a.limits.videosUsed) * dir;
          default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
    }

    return { data: filtered, total: filtered.length };
  },

  async getById(id: string): Promise<Tenant | null> {
    await delay(200);
    return getTenants().find((t) => t.id === id) ?? null;
  },

  async getMetrics(): Promise<TenantsMetricData> {
    await delay(300);
    const tenants = getTenants();
    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter((t) => t.status === "active").length,
      pendingTenants: tenants.filter((t) => t.status === "pending").length,
      trialTenants: tenants.filter((t) => t.status === "trial").length,
      totalUsers: tenants.reduce((sum, t) => sum + t.limits.usersUsed, 0),
      totalStorageUsed: tenants.reduce((sum, t) => sum + t.limits.storageUsed, 0),
      totalVideos: tenants.reduce((sum, t) => sum + t.limits.videosUsed, 0),
      monthlyRevenue: tenants.reduce((sum, t) => sum + t.revenue, 0),
    };
  },

  async createWizard(wizard: WizardState): Promise<TenantCreationResult> {
    await delay(800);
    const now = new Date().toISOString();
    const plan = wizard.section3;
    const selectedPlan = [
      { id: "plan_01", name: "ستارتر", price: 99, storage: 10, bandwidth: 50, videos: 50, courses: 5, users: 50 },
      { id: "plan_02", name: "أساسي", price: 199, storage: 50, bandwidth: 200, videos: 200, courses: 20, users: 200 },
      { id: "plan_03", name: "احترافية", price: 399, storage: 200, bandwidth: 500, videos: 500, courses: 50, users: 500 },
      { id: "plan_04", name: "أعمال", price: 799, storage: 500, bandwidth: 1000, videos: 2000, courses: 150, users: 2000 },
      { id: "plan_05", name: "مؤسسات", price: 1999, storage: 1000, bandwidth: 2000, videos: 10000, courses: 500, users: 10000 },
    ].find((p) => p.id === plan.planId);
    const s1 = wizard.section1;
    const s4 = wizard.section4;
    const s5 = wizard.section5;
    const password = s4.password;

    const tenant: Tenant = {
      id: `tenant_${Date.now()}`,
      logo: s5.logo,
      name: s1.name,
      slug: s1.slug,
      description: wizard.section1.description ?? "",
      domain: {
        platformSubdomain: wizard.section2.subdomain,
        customDomain: null,
        wildcard: false,
        sslStatus: "pending",
        dnsStatus: "pending",
        verificationStatus: "unverified",
      },
      domainHistory: [{
        id: `dh_${Date.now()}`,
        domain: `${wizard.section2.subdomain}.${window.location.hostname}`,
        type: "primary",
        action: "added",
        timestamp: now,
      }],
      owner: { name: s4.ownerName, email: s4.ownerEmail, phone: s4.phone },
      ownerAccount: {
        name: s4.ownerName,
        email: s4.ownerEmail,
        phone: s4.phone,
        password,
        passwordChanged: !s4.requirePasswordChange,
        welcomeEmail: s4.sendWelcomeEmail,
        twoFactorEnabled: s4.enable2FA,
        status: s4.ownerStatus,
      },
      address: { street: "", city: "", state: "", country: "SA", zip: "" },
      timezone: s1.timezone,
      language: s1.language,
      currency: s1.currency,
      phone: s4.phone,
      status: s1.status,
      subscription: {
        planId: plan.planId,
        planName: selectedPlan?.name ?? "",
        billingCycle: "monthly",
        renewal: plan.endsAt,
        startDate: plan.startsAt,
        trialEndDate: plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 86400000).toISOString() : null,
        status: plan.billingStatus === "free" ? "trial" : "pending",
        price: selectedPlan?.price ?? 0,
        currency: s1.currency,
        paymentMethod: "—",
        autoRenew: plan.autoRenew,
        invoices: [],
      },
      limits: selectedPlan ? {
        storage: selectedPlan.storage, storageUsed: 0,
        bandwidth: selectedPlan.bandwidth, bandwidthUsed: 0,
        videos: selectedPlan.videos, videosUsed: 0,
        courses: selectedPlan.courses, coursesUsed: 0,
        users: selectedPlan.users, usersUsed: 0,
        admins: 5, adminsUsed: 0, teachers: 10, teachersUsed: 0,
        students: selectedPlan.users, studentsUsed: 0,
        apiRequests: 10000, apiRequestsUsed: 0,
        liveClasses: 20, liveClassesUsed: 0,
        certificates: 50, certificatesUsed: 0,
        assignments: 50, assignmentsUsed: 0,
        quizzes: 100, quizzesUsed: 0,
        communities: 10, communitiesUsed: 0,
      } : {
        storage: 0, storageUsed: 0, bandwidth: 0, bandwidthUsed: 0,
        videos: 0, videosUsed: 0, courses: 0, coursesUsed: 0,
        users: 0, usersUsed: 0, admins: 0, adminsUsed: 0,
        teachers: 0, teachersUsed: 0, students: 0, studentsUsed: 0,
        apiRequests: 0, apiRequestsUsed: 0, liveClasses: 0, liveClassesUsed: 0,
        certificates: 0, certificatesUsed: 0, assignments: 0, assignmentsUsed: 0,
        quizzes: 0, quizzesUsed: 0, communities: 0, communitiesUsed: 0,
      },
      branding: {
        logo: s5.logo, darkLogo: null, favicon: s5.favicon,
        primaryColor: s5.primaryColor, secondaryColor: s5.secondaryColor, accentColor: "#f59e0b",
        fonts: "Cairo", loginBackground: null, emailBranding: false, whiteLabel: false,
      },
      integrations: {
        bunnyStorage: "not_configured", bunnyStream: "not_configured",
        smtp: "not_configured", sso: "not_configured",
        googleOAuth: "not_configured", zoom: "not_configured",
        webhook: "not_configured", apiKeys: "not_configured",
      },
      notes: wizard.section6.notes ?? "",
      tags: wizard.section6.tags,
      revenue: 0,
      security: {
        twoFactorEnabled: s4.enable2FA,
        passwordLastChanged: now,
        failedLogins: 0,
        activeSessions: 0,
        trustedDevices: 0,
        recoveryCodes: false,
      },
      storage: {
        currentStorage: 0,
        currentBandwidth: 0,
        videosCount: 0,
        remainingStorage: selectedPlan?.storage ?? 0,
        remainingBandwidth: selectedPlan?.bandwidth ?? 0,
      },
      activity: [
        { id: `act_${Date.now()}`, type: "created", description: "تم إنشاء المؤسسة", timestamp: now },
        { id: `act_${Date.now() + 1}`, type: "user_added", description: `تم إنشاء حساب المالك: ${s4.ownerName}`, timestamp: now },
      ],
      logs: [],
      recentLogins: 0,
      recentApiCalls: 0,
      companyName: s5.companyName,
      supportEmail: s5.supportEmail,
      createdAt: now,
      updatedAt: now,
      lastActivity: now,
      lastLogin: now,
    };

    getTenants().unshift(tenant);
    persist();

    return {
      tenant,
      generatedPassword: password,
      loginUrl: `${window.location.protocol}//${wizard.section2.subdomain}.${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}`,
    };
  },

  async create(data: Partial<Tenant>): Promise<Tenant> {
    await delay(500);
    const now = new Date().toISOString();
    const tenant: Tenant = {
      id: `tenant_${Date.now()}`,
      name: data.name ?? "مؤسسة جديدة",
      slug: data.slug ?? "new-tenant",
      description: data.description ?? "",
      logo: null,
      domain: data.domain ?? {
        platformSubdomain: data.slug ?? "new-tenant",
        customDomain: null,
        wildcard: false,
        sslStatus: "pending",
        dnsStatus: "pending",
        verificationStatus: "unverified",
      },
      domainHistory: [],
      owner: data.owner ?? { name: "", email: "", phone: "" },
      ownerAccount: data.ownerAccount ?? { name: "", email: "", phone: "", password: "", passwordChanged: false, welcomeEmail: false, twoFactorEnabled: false, status: "active" },
      address: data.address ?? { street: "", city: "", state: "", country: "SA", zip: "" },
      timezone: data.timezone ?? "Asia/Riyadh",
      language: data.language ?? "ar",
      currency: data.currency ?? "SAR",
      phone: data.phone ?? "",
      status: data.status ?? "pending",
      subscription: data.subscription ?? {
        planId: "", planName: "", billingCycle: "monthly",
        renewal: "", startDate: "", trialEndDate: null,
        status: "pending", price: 0, currency: "SAR",
        paymentMethod: "", autoRenew: true, invoices: [],
      },
      limits: data.limits ?? {
        storage: 0, storageUsed: 0, bandwidth: 0, bandwidthUsed: 0,
        videos: 0, videosUsed: 0, courses: 0, coursesUsed: 0,
        users: 0, usersUsed: 0, admins: 0, adminsUsed: 0,
        teachers: 0, teachersUsed: 0, students: 0, studentsUsed: 0,
        apiRequests: 0, apiRequestsUsed: 0, liveClasses: 0, liveClassesUsed: 0,
        certificates: 0, certificatesUsed: 0, assignments: 0, assignmentsUsed: 0,
        quizzes: 0, quizzesUsed: 0, communities: 0, communitiesUsed: 0,
      },
      branding: data.branding ?? {
        logo: null, darkLogo: null, favicon: null,
        primaryColor: "#6366f1", secondaryColor: "#8b5cf6", accentColor: "#f59e0b",
        fonts: "Cairo", loginBackground: null, emailBranding: false, whiteLabel: false,
      },
      integrations: data.integrations ?? {
        bunnyStorage: "not_configured", bunnyStream: "not_configured",
        smtp: "not_configured", sso: "not_configured",
        googleOAuth: "not_configured", zoom: "not_configured",
        webhook: "not_configured", apiKeys: "not_configured",
      },
      notes: data.notes ?? "",
      tags: data.tags ?? [],
      revenue: data.revenue ?? 0,
      security: data.security ?? {
        twoFactorEnabled: false, passwordLastChanged: now,
        failedLogins: 0, activeSessions: 0, trustedDevices: 0, recoveryCodes: false,
      },
      storage: data.storage ?? {
        currentStorage: 0, currentBandwidth: 0, videosCount: 0,
        remainingStorage: 0, remainingBandwidth: 0,
      },
      activity: data.activity ?? [
        { id: `act_${Date.now()}`, type: "created", description: "تم إنشاء المؤسسة", timestamp: now },
      ],
      logs: data.logs ?? [],
      recentLogins: 0,
      recentApiCalls: 0,
      companyName: data.companyName ?? "",
      supportEmail: data.supportEmail ?? "",
      createdAt: now,
      updatedAt: now,
      lastActivity: now,
      lastLogin: now,
    };
    getTenants().unshift(tenant);
    persist();
    return tenant;
  },

  async update(id: string, data: Partial<Tenant>): Promise<Tenant | null> {
    await delay(500);
    const index = getTenants().findIndex((t) => t.id === id);
    if (index === -1) return null;
    getTenants()[index] = { ...getTenants()[index], ...data, updatedAt: new Date().toISOString() } as Tenant;
    persist();
    return getTenants()[index] ?? null;
  },

  async suspend(id: string): Promise<void> {
    await delay(300);
    const tenant = getTenants().find((t) => t.id === id);
    if (tenant) {
      tenant.status = "suspended";
      tenant.updatedAt = new Date().toISOString();
      tenant.activity.unshift({
        id: `act_${Date.now()}`,
        type: "suspended",
        description: "تم إيقاف المؤسسة",
        timestamp: new Date().toISOString(),
      });
      persist();
    }
  },

  async activate(id: string): Promise<void> {
    await delay(300);
    const tenant = getTenants().find((t) => t.id === id);
    if (tenant) {
      tenant.status = "active";
      tenant.updatedAt = new Date().toISOString();
      tenant.activity.unshift({
        id: `act_${Date.now()}`,
        type: "activated",
        description: "تم تنشيط المؤسسة",
        timestamp: new Date().toISOString(),
      });
      persist();
    }
  },

  async archive(id: string): Promise<void> {
    await delay(300);
    const tenant = getTenants().find((t) => t.id === id);
    if (tenant) {
      tenant.status = "archived";
      tenant.updatedAt = new Date().toISOString();
      persist();
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const index = getTenants().findIndex((t) => t.id === id);
    if (index !== -1) getTenants().splice(index, 1);
    persist();
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await delay(600);
    ids.forEach((id) => {
      const index = getTenants().findIndex((t) => t.id === id);
      if (index !== -1) getTenants().splice(index, 1);
    });
    persist();
  },

  async duplicate(id: string): Promise<Tenant | null> {
    await delay(500);
    const source = getTenants().find((t) => t.id === id);
    if (!source) return null;
    const now = new Date().toISOString();
    const clone: Tenant = {
      ...source,
      id: `tenant_${Date.now()}`,
      name: `نسخة من ${source.name}`,
      slug: `${source.slug}-copy`,
      createdAt: now,
      updatedAt: now,
      lastActivity: now,
      lastLogin: now,
      activity: [{ id: `act_${Date.now()}`, type: "created", description: "تم إنشاء نسخة من المؤسسة", timestamp: now }],
      logs: [],
      limits: { ...source.limits, storageUsed: 0, bandwidthUsed: 0, videosUsed: 0, coursesUsed: 0, usersUsed: 0, adminsUsed: 0, teachersUsed: 0, studentsUsed: 0, apiRequestsUsed: 0, liveClassesUsed: 0, certificatesUsed: 0, assignmentsUsed: 0, quizzesUsed: 0, communitiesUsed: 0 },
      storage: { currentStorage: 0, currentBandwidth: 0, videosCount: 0, remainingStorage: source.limits.storage, remainingBandwidth: source.limits.bandwidth },
    };
    getTenants().unshift(clone);
    persist();
    return clone;
  },

  async generateImpersonationToken(tenantId: string): Promise<ImpersonationToken> {
    await delay(200);
    const tenant = getTenants().find((t) => t.id === tenantId);
    if (!tenant) throw new Error("Tenant not found");
    return {
      token: `imp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      expiresAt: new Date(Date.now() + 30000).toISOString(),
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantUrl: `https://${tenant.domain.platformSubdomain}.${window.location.hostname}`,
    };
  },

  async resetPassword(tenantId: string): Promise<PasswordResetResult> {
    await delay(300);
    const newPassword = generatePassword();
    const tenant = getTenants().find((t) => t.id === tenantId);
    if (tenant) {
      tenant.ownerAccount.password = newPassword;
      tenant.ownerAccount.passwordChanged = false;
      tenant.updatedAt = new Date().toISOString();
      tenant.activity.unshift({
        id: `act_${Date.now()}`,
        type: "password_reset",
        description: "تم إعادة تعيين كلمة مرور المالك",
        timestamp: new Date().toISOString(),
      });
      persist();
    }
    return { newPassword };
  },

  async sendWelcomeEmail(tenantId: string): Promise<void> {
    await delay(400);
    const tenant = getTenants().find((t) => t.id === tenantId);
    if (tenant) {
      tenant.ownerAccount.welcomeEmail = true;
      persist();
    }
  },

  async resetData(): Promise<void> {
    tenantStorage.clear();
    _tenants = null;
    getTenants(); // re-initialize from mock
    persist();
  },
};
