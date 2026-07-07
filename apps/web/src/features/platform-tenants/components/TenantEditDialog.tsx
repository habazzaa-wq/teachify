"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { z } from "zod";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppTabsContent,
  AppButton,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { Building2, Globe, CreditCard, UserCog, Palette, FileText, Save, Loader2 } from "lucide-react";
import {
  wizardSection1Schema,
  wizardSection2Schema,
  wizardSection3Schema,
  wizardSection4Schema,
  wizardSection5Schema,
} from "../validators";
import type { TenantStatus, TenantLanguage, TenantCurrency, BillingStatus, Tenant } from "../types";
import {
  CreateGeneralTab,
  CreateDomainTab,
  CreateSubscriptionTab,
  CreateOwnerAccountTab,
  CreateBrandingTab,
  CreateNotesTab,
} from "./create-wizard";
import { useTenant } from "../hooks/usePlatformTenants";

interface TenantEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
  tenant: Tenant | null;
  onSave: (data: Partial<Tenant>) => void;
  saving?: boolean;
}

type FormData = {
  name: string; slug: string; description: string;
  status: TenantStatus; language: TenantLanguage; timezone: string; currency: TenantCurrency;
  subdomain: string; customDomain: string; ssl: boolean;
  planId: string; trialDays: number; startDate: string; endDate: string;
  autoRenew: boolean; billingStatus: BillingStatus;
  ownerName: string; ownerEmail: string; phone: string;
  password: string; confirmPassword: string;
  requirePasswordChange: boolean; sendWelcomeEmail: boolean; enable2FA: boolean;
  companyName: string; logo: string | null; primaryColor: string; secondaryColor: string;
  supportEmail: string; favicon: string | null;
  notes: string; tags: string[];
};

const DEFAULT_FORM: FormData = {
  name: "", slug: "", description: "",
  status: "pending" as TenantStatus, language: "ar" as TenantLanguage,
  timezone: "Asia/Riyadh", currency: "SAR" as TenantCurrency,
  subdomain: "", customDomain: "", ssl: true,
  planId: "", trialDays: 14, startDate: "", endDate: "",
  autoRenew: true, billingStatus: "pending" as BillingStatus,
  ownerName: "", ownerEmail: "", phone: "",
  password: "", confirmPassword: "",
  requirePasswordChange: true, sendWelcomeEmail: true, enable2FA: false,
  companyName: "", logo: null, primaryColor: "#6366f1", secondaryColor: "#8b5cf6",
  supportEmail: "", favicon: null,
  notes: "", tags: [],
};

const TABS = [
  { value: "general", label: "عام", icon: Building2 },
  { value: "domain", label: "النطاق", icon: Globe },
  { value: "subscription", label: "الباقة", icon: CreditCard },
  { value: "owner", label: "حساب المالك", icon: UserCog },
  { value: "branding", label: "العلامة التجارية", icon: Palette },
  { value: "notes", label: "ملاحظات", icon: FileText },
];

function tenantToFormData(tenant: Tenant | null | undefined): FormData {
  if (!tenant) return DEFAULT_FORM;
  return {
    name: tenant.name ?? "",
    slug: tenant.slug ?? "",
    description: tenant.description ?? "",
    status: tenant.status ?? "pending",
    language: tenant.language ?? "ar",
    timezone: tenant.timezone ?? "Asia/Riyadh",
    currency: tenant.currency ?? "SAR",
    subdomain: tenant.domain?.platformSubdomain ?? tenant.slug ?? "",
    customDomain: tenant.domain?.customDomain ?? "",
    ssl: true,
    planId: tenant.subscription?.planId ?? "",
    trialDays: 14,
    startDate: tenant.subscription?.startDate ?? "",
    endDate: tenant.subscription?.trialEndDate ?? "",
    autoRenew: tenant.subscription?.autoRenew ?? true,
    billingStatus: "pending",
    ownerName: tenant.owner?.name ?? "",
    ownerEmail: tenant.owner?.email ?? "",
    phone: tenant.owner?.phone ?? tenant.phone ?? "",
    password: "",
    confirmPassword: "",
    requirePasswordChange: tenant.ownerAccount?.passwordChanged ?? false,
    sendWelcomeEmail: tenant.ownerAccount?.welcomeEmail ?? false,
    enable2FA: tenant.ownerAccount?.twoFactorEnabled ?? false,
    companyName: tenant.companyName ?? "",
    logo: tenant.branding?.logo ?? null,
    primaryColor: tenant.branding?.primaryColor ?? "#6366f1",
    secondaryColor: tenant.branding?.secondaryColor ?? "#8b5cf6",
    supportEmail: tenant.supportEmail ?? "",
    favicon: tenant.branding?.favicon ?? null,
    notes: tenant.notes ?? "",
    tags: tenant.tags ?? [],
  };
}

function TenantEditDialog({ open, onOpenChange, tenantId, tenant, onSave, saving }: TenantEditDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(["general"]));
  const [loaded, setLoaded] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const prevOpenRef = useRef(open);
  const prevTenantIdRef = useRef(tenantId);

  // Fetch full tenant data when dialog opens
  const { data: fetchedTenant, isLoading: isLoadingTenant } = useTenant(open ? tenantId : null);

  // Reset form when dialog opens or tenant changes
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setLoaded(false);
      setErrors({});
      setTriedSubmit(false);
      setActiveTab("general");
      setMountedTabs(new Set(["general"]));
    }
    if (!open) {
      setLoaded(false);
    }
    prevOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (tenantId !== prevTenantIdRef.current) {
      prevTenantIdRef.current = tenantId;
      setLoaded(false);
      setErrors({});
      setTriedSubmit(false);
      setActiveTab("general");
      setMountedTabs(new Set(["general"]));
    }
  }, [tenantId]);

  // Load tenant data into form from API response or tenant prop
  const dataSource = useMemo(() => fetchedTenant ?? tenant, [fetchedTenant, tenant]);

  useEffect(() => {
    if (!open || !dataSource) return;

    const formData = tenantToFormData(dataSource);
    setForm(formData);
    setLoaded(true);
  }, [open, dataSource]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setMountedTabs((prev) => new Set(prev).add(value));
  }, []);

  const handleChange = useCallback((key: string, value: string | boolean | number | string[]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !prev.slug) {
        next.slug = (value as string)
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .replace(/[\u0600-\u06FF]/g, "");
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handlePasswordGenerated = useCallback((password: string) => {
    setForm((prev) => ({ ...prev, password, confirmPassword: password }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.password;
      delete next.confirmPassword;
      return next;
    });
  }, []);

  const section1 = useMemo(() => ({
    name: form.name, slug: form.slug, description: form.description,
    status: form.status, timezone: form.timezone, language: form.language, currency: form.currency,
  }), [form.name, form.slug, form.description, form.status, form.timezone, form.language, form.currency]);

  const section2 = useMemo(() => ({ subdomain: form.subdomain }), [form.subdomain]);

  const section3 = useMemo(() => ({
    planId: form.planId, trialDays: form.trialDays,
    startsAt: form.startDate, endsAt: form.endDate,
    autoRenew: form.autoRenew, billingStatus: form.billingStatus,
  }), [form.planId, form.trialDays, form.startDate, form.endDate, form.autoRenew, form.billingStatus]);

  const section4 = useMemo(() => ({
    ownerName: form.ownerName, ownerEmail: form.ownerEmail, phone: form.phone,
    password: form.password, confirmPassword: form.confirmPassword,
    requirePasswordChange: form.requirePasswordChange, sendWelcomeEmail: form.sendWelcomeEmail,
    enable2FA: form.enable2FA, ownerStatus: "active" as const,
  }), [form.ownerName, form.ownerEmail, form.phone, form.password, form.confirmPassword,
      form.requirePasswordChange, form.sendWelcomeEmail, form.enable2FA]);

  const section5 = useMemo(() => ({
    companyName: form.companyName, logo: form.logo,
    primaryColor: form.primaryColor, secondaryColor: form.secondaryColor,
    supportEmail: form.supportEmail, favicon: form.favicon,
  }), [form.companyName, form.logo, form.primaryColor, form.secondaryColor, form.supportEmail, form.favicon]);

  const section6 = useMemo(() => ({
    notes: form.notes, tags: form.tags,
  }), [form.notes, form.tags]);

  const validateSection = useCallback((section: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    try {
      switch (section) {
        case 1: wizardSection1Schema.parse(section1); break;
        case 2: wizardSection2Schema.parse(section2); break;
        case 3: {
          // Edit mode: subscription fields are optional (may not have been set during creation)
          if (section3.planId || section3.startsAt || section3.endsAt) {
            wizardSection3Schema.parse(section3);
          }
          break;
        }
        case 4: {
          // Edit mode: password is optional (only required if user wants to change it)
          if (form.password || form.confirmPassword) {
            wizardSection4Schema.parse(section4);
          } else {
            // Validate only owner fields without password; phone is optional (may be empty in DB)
            if (!form.ownerName) errs.ownerName = "اسم المالك مطلوب";
            if (!form.ownerEmail) errs.ownerEmail = "البريد الإلكتروني مطلوب";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) errs.ownerEmail = "البريد الإلكتروني غير صالح";
          }
          break;
        }
        case 5: {
          // Edit mode: branding fields are optional (may not have been set during creation)
          if (form.companyName || form.supportEmail) {
            wizardSection5Schema.parse(section5);
          }
          break;
        }
      }
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        for (const issue of e.issues) {
          const key = issue.path.join(".");
          if (!errs[key]) errs[key] = issue.message;
        }
      }
    }
    return errs;
  }, [section1, section2, section3, section4, section5, form.password, form.confirmPassword, form.ownerName, form.ownerEmail, form.companyName, form.supportEmail]);

  const allErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (let i = 1; i <= 5; i++) {
      Object.assign(errs, validateSection(i));
    }
    return errs;
  }, [validateSection]);

  const tabHasErrors = useMemo(() => {
    const map: Record<string, boolean> = {};
    const checkMap: Record<string, (e: Record<string, string>) => boolean> = {
      general: (e) => !!(e.name || e.slug || e.description || e.status || e.language || e.timezone || e.currency),
      domain: (e) => !!(e.subdomain || e.customDomain),
      subscription: (e) => !!(e.planId || e.trialDays || e.startDate || e.endDate || e.autoRenew || e.billingStatus),
      owner: (e) => !!(e.ownerName || e.ownerEmail || e.phone || e.password || e.confirmPassword),
      branding: (e) => !!(e.companyName || e.logo || e.primaryColor || e.secondaryColor || e.supportEmail || e.favicon),
      notes: (e) => !!(e.notes || e.tags),
    };
    for (const [tab, checkFn] of Object.entries(checkMap)) {
      map[tab] = checkFn(allErrors);
    }
    return map;
  }, [allErrors]);

  const handleSubmit = useCallback(() => {
    setTriedSubmit(true);
    const errs = allErrors;
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      for (const tab of TABS.map((t) => t.value)) {
        if (tabHasErrors[tab]) {
          setActiveTab(tab);
          setMountedTabs((prev) => new Set(prev).add(tab));
          break;
        }
      }
      return;
    }
    setErrors({});

    // Map form data to Tenant structure for update
    const updateData: Partial<Tenant> = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      status: form.status,
      timezone: form.timezone,
      language: form.language,
      currency: form.currency,
      phone: form.phone,
      companyName: form.companyName,
      supportEmail: form.supportEmail,
      notes: form.notes,
      tags: form.tags,
      domain: {
        platformSubdomain: form.subdomain,
        customDomain: form.customDomain || null,
        wildcard: false,
        sslStatus: "active",
        dnsStatus: "verified",
        verificationStatus: "verified",
      },
      owner: {
        name: form.ownerName,
        email: form.ownerEmail,
        phone: form.phone,
      },
      ownerAccount: {
        name: form.ownerName,
        email: form.ownerEmail,
        phone: form.phone,
        password: form.password,
        passwordChanged: form.requirePasswordChange,
        welcomeEmail: form.sendWelcomeEmail,
        twoFactorEnabled: form.enable2FA,
        status: "active",
      },
      branding: {
        logo: form.logo,
        darkLogo: null,
        favicon: form.favicon,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accentColor: "#f59e0b",
        fonts: "Cairo",
        loginBackground: null,
        emailBranding: false,
        whiteLabel: false,
      },
      subscription: {
        planId: form.planId,
        planName: "",
        billingCycle: "monthly",
        renewal: "",
        startDate: form.startDate,
        trialEndDate: form.endDate,
        status: form.status,
        price: 0,
        currency: form.currency,
        paymentMethod: "—",
        autoRenew: form.autoRenew,
        invoices: [],
      },
    };

    onSave(updateData);
  }, [allErrors, tabHasErrors, form, onSave]);

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className={cn(
        "flex flex-col p-0 gap-0 max-h-[90vh] overflow-hidden",
        "w-[95vw] sm:w-[90vw]",
        "lg:max-w-[1000px] xl:max-w-[1100px] 2xl:max-w-[1200px]",
        "!inset-0 !m-auto !translate-x-0 !translate-y-0",
        "max-sm:!h-dvh max-sm:!max-h-dvh max-sm:!w-full max-sm:!max-w-full max-sm:!rounded-none",
      )}>
        <AppDialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <AppDialogTitle>تعديل المؤسسة</AppDialogTitle>
          <AppDialogDescription>
            قم بتعديل المعلومات التالية للمؤسسة
          </AppDialogDescription>
        </AppDialogHeader>

        {!dataSource ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">جاري تحميل بيانات المؤسسة...</span>
            </div>
          </div>
        ) : (
        <AppTabs
          value={activeTab}
          onValueChange={handleTabChange}
          dir="rtl"
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="shrink-0 px-6 pt-4 pb-0 overflow-x-auto">
            <AppTabsList className="w-full sm:w-auto h-auto p-1 gap-1 flex-nowrap">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const showErr = triedSubmit && tabHasErrors[tab.value];
                return (
                  <AppTabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 text-xs sm:text-sm whitespace-nowrap",
                      showErr && "data-[state=active]:border-destructive",
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0",
                      showErr && "text-destructive",
                    )} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {showErr && (
                      <span className="absolute -top-1 -end-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                      </span>
                    )}
                  </AppTabsTrigger>
                );
              })}
            </AppTabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            <AppTabsContent value="general" className="mt-0">
              {mountedTabs.has("general") && (
                <CreateGeneralTab
                  data={section1}
                  errors={errors}
                  onChange={handleChange}
                />
              )}
            </AppTabsContent>

            <AppTabsContent value="domain" className="mt-0">
              {mountedTabs.has("domain") && (
                <CreateDomainTab
                  data={{ slug: form.slug, subdomain: form.subdomain, customDomain: form.customDomain, ssl: form.ssl }}
                  errors={errors}
                  onChange={handleChange}
                />
              )}
            </AppTabsContent>

            <AppTabsContent value="subscription" className="mt-0">
              {mountedTabs.has("subscription") && (
                <CreateSubscriptionTab
                  data={{
                    planId: form.planId, trialDays: form.trialDays,
                    startDate: form.startDate, endDate: form.endDate,
                    autoRenew: form.autoRenew, billingStatus: form.billingStatus,
                  }}
                  errors={errors}
                  onChange={handleChange}
                />
              )}
            </AppTabsContent>

            <AppTabsContent value="owner" className="mt-0">
              {mountedTabs.has("owner") && (
                <CreateOwnerAccountTab
                  data={{
                    ownerName: form.ownerName, ownerEmail: form.ownerEmail,
                    phone: form.phone, password: form.password,
                    confirmPassword: form.confirmPassword,
                    requirePasswordChange: form.requirePasswordChange,
                    sendWelcomeEmail: form.sendWelcomeEmail,
                    enable2FA: form.enable2FA,
                  }}
                  errors={errors}
                  onChange={handleChange}
                  onPasswordGenerated={handlePasswordGenerated}
                  isEdit
                />
              )}
            </AppTabsContent>

            <AppTabsContent value="branding" className="mt-0">
              {mountedTabs.has("branding") && (
                <CreateBrandingTab
                  data={{
                    companyName: form.companyName, logo: form.logo,
                    primaryColor: form.primaryColor, secondaryColor: form.secondaryColor,
                    supportEmail: form.supportEmail, favicon: form.favicon,
                  }}
                  errors={errors}
                  onChange={handleChange}
                />
              )}
            </AppTabsContent>

            <AppTabsContent value="notes" className="mt-0">
              {mountedTabs.has("notes") && (
                <CreateNotesTab
                  data={{ notes: form.notes, tags: form.tags }}
                  errors={errors}
                  onChange={handleChange}
                />
              )}
            </AppTabsContent>
          </div>
        </AppTabs>
        )}

        <div className="shrink-0 flex items-center justify-between border-t px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0">
          <div className="text-xs text-muted-foreground">
            {triedSubmit && Object.keys(allErrors).length > 0 && (
              <span className="text-destructive animate-in fade-in">
                {Object.keys(allErrors).length} حقل بحاجة للمراجعة
              </span>
            )}
            {triedSubmit && Object.keys(allErrors).length === 0 && !saving && (
              <span>جميع الحقول صالحة</span>
            )}
            {saving && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                جاري الحفظ...
              </span>
            )}
          </div>

          <AppButton
            onClick={handleSubmit}
            loading={saving}
            disabled={saving}
            size="lg"
            className="gap-2 min-w-[140px]"
          >
            {saving ? null : <Save className="h-4 w-4" />}
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </AppButton>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}

export { TenantEditDialog };