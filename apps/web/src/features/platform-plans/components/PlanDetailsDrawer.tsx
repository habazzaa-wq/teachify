"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import {
  AppButton,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppDrawer,
  AppBadge,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { usePlan } from "../hooks/usePlans";
import type { PremiumPlan, PlanLimits, PlanFeatures, PlanVideoStorage, PlanBranding, PlanIntegrations } from "../types";
import { planFormSchema } from "../validators";
import { PlanGeneralTab } from "./PlanGeneralTab";
import { PlanLimitsTab } from "./PlanLimitsTab";
import { PlanFeaturesTab } from "./PlanFeaturesTab";
import { PlanVideoStorageTab } from "./PlanVideoStorageTab";
import { PlanBrandingTab } from "./PlanBrandingTab";
import { PlanIntegrationsTab } from "./PlanIntegrationsTab";
import { PlanPreviewTab } from "./PlanPreviewTab";

interface PlanDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string | null;
  isCreate?: boolean;
  isDuplicate?: boolean;
  initialData?: Partial<PremiumPlan>;
  onSave?: (data: Partial<PremiumPlan>) => void;
  saving?: boolean;
}

const TABS = [
  { value: "general", label: "عام" },
  { value: "limits", label: "الحدود" },
  { value: "features", label: "المميزات" },
  { value: "video-storage", label: "الفيديو والتخزين" },
  { value: "branding", label: "العلامة التجارية" },
  { value: "integrations", label: "التكاملات" },
  { value: "preview", label: "معاينة" },
];

const defaultLimits: PlanLimits = {
  admins: null, instructors: null, students: null, courses: null,
  sections: null, lessons: null, videos: null, certificates: null,
  quizzes: null, assignments: null, discussionThreads: null,
  bookmarks: null, notes: null, notificationsPerMonth: null,
  apiRequests: null, storage: null, bandwidth: null,
  maximumUploadSize: null, maximumVideoDuration: null,
};

const defaultFeatures: PlanFeatures = {
  courses: false, certificates: false, assignments: false, quizzes: false,
  discussions: false, notes: false, bookmarks: false,
  basicAnalytics: false, advancedAnalytics: false,
  bunnyStream: false, videoStreaming: false, videoDownloadProtection: false, videoAnalytics: false,
  customBranding: false, whiteLabel: false, customDomain: false,
  auditLogs: false, activityLogs: false, apiAccess: false, webhooks: false,
  smtp: false, stripe: false, paypal: false, zoom: false, googleMeet: false, microsoftTeams: false,
  aiAssistant: false, aiGrading: false, aiAnalytics: false,
};

const defaultVideoStorage: PlanVideoStorage = {
  storageLimit: 0, storageUsed: 0, bandwidthLimit: 0, bandwidthUsed: 0,
  videosLimit: 0, videosUsed: 0, maximumUploadSize: 0, maximumVideoDuration: 0,
  allowedFormats: ["mp4"], allowedQualities: ["720"],
};

const defaultIntegrations: PlanIntegrations = {
  allowBunnyStorage: false, allowBunnyStream: false, allowSmtp: false,
  allowStripe: false, allowPaypal: false, allowZoom: false,
  allowMicrosoftTeams: false, allowGoogleMeet: false,
};

function PlanDetailsDrawer({
  open,
  onOpenChange,
  planId,
  isCreate,
  isDuplicate,
  initialData,
  onSave,
  saving,
}: PlanDetailsDrawerProps) {
  const { data: fetchedPlan, isLoading } = usePlan(planId && !isCreate ? planId : null);

  const effectiveData = isCreate || isDuplicate
    ? (initialData ?? {})
    : (fetchedPlan ?? {});

  const [formData, setFormData] = useState<Partial<PremiumPlan>>(effectiveData);
  const [activeTab, setActiveTab] = useState("general");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isCreate && !isDuplicate && fetchedPlan) {
      setFormData(fetchedPlan);
    }
  }, [fetchedPlan, isCreate, isDuplicate]);

  const handleChange = useCallback((data: Partial<PremiumPlan>) => {
    setFormData(data);
  }, []);

  const handleLimitsChange = useCallback((limits: PlanLimits) => {
    setFormData((prev) => ({ ...prev, limits }));
  }, []);

  const handleFeaturesChange = useCallback((features: PlanFeatures) => {
    setFormData((prev) => ({ ...prev, features }));
  }, []);

  const handleVideoStorageChange = useCallback((videoStorage: PlanVideoStorage) => {
    setFormData((prev) => ({ ...prev, videoStorage }));
  }, []);

  const handleBrandingChange = useCallback((branding: Partial<PlanBranding>) => {
    setFormData((prev) => {
      const merged = { ...(prev.branding ?? {}), ...branding } as PlanBranding;
      return { ...prev, branding: merged };
    });
  }, []);

  const handleIntegrationsChange = useCallback((integrations: PlanIntegrations) => {
    setFormData((prev) => ({ ...prev, integrations }));
  }, []);

  const isLoadingData = !isCreate && isLoading;

  const drawerTitle = isCreate
    ? "إنشاء باقة جديدة"
    : isDuplicate
    ? "نسخ الباقة"
    : formData.name || "تفاصيل الباقة";

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    const result = planFormSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path && !errors[path]) {
          errors[path] = issue.message;
        }
      });
      setFieldErrors(errors);
      setActiveTab("general");
      toast.error("يرجى تصحيح الأخطاء التالية", {
        description: Object.values(errors).join(" • "),
      });
      return;
    }
    setFieldErrors({});
    onSave?.(formData);
  }, [onSave, formData]);

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[80vw] lg:max-w-[900px] xl:max-w-[960px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label={drawerTitle}>
        {/* Fixed Header */}
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-3 w-3 rounded-full shrink-0 ring-2 ring-background shadow-sm"
              style={{ backgroundColor: formData.branding?.color || "#6366f1" }}
            />
            <div className="min-w-0 flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight truncate">
                {drawerTitle}
              </h2>
              {formData.status && (
                <AppBadge
                  variant={
                    formData.status === "active" ? "success" :
                    formData.status === "draft" ? "secondary" :
                    formData.status === "hidden" ? "warning" : "outline"
                  }
                  className="text-[10px]"
                >
                  {formData.status === "active" ? "نشط" :
                   formData.status === "draft" ? "مسودة" :
                   formData.status === "hidden" ? "مخفي" : "مؤرشف"}
                </AppBadge>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Tab bar (uses Radix for keyboard nav + ARIA) */}
        <div className="shrink-0 border-b bg-background z-10">
          <div className="px-6 overflow-x-auto scrollbar-thin">
            <AppTabs value={activeTab} onValueChange={setActiveTab}>
              <AppTabsList className="flex h-auto gap-0 bg-transparent p-0 w-full border-0">
                {TABS.map((tab) => (
                  <AppTabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                      "bg-transparent shadow-none rounded-none",
                      "hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      "data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                      "data-[state=inactive]:text-muted-foreground",
                      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all after:duration-200",
                      "data-[state=active]:after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100",
                      "data-[state=inactive]:hover:after:bg-muted-foreground/20 data-[state=inactive]:hover:after:scale-x-100",
                    )}
                  >
                    {tab.label}
                  </AppTabsTrigger>
                ))}
              </AppTabsList>
            </AppTabs>
          </div>
        </div>

        {/* Scrollable Content (conditional rendering, no Radix wrapper) */}
        <div
          className="flex-1 overflow-y-auto min-h-0 bg-muted/10"
          style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin' }}
        >
          {isLoadingData ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === "general" && (
                <div className="p-6">
                  <PlanGeneralTab data={formData} onChange={handleChange} errors={fieldErrors} />
                </div>
              )}
              {activeTab === "limits" && (
                <div className="p-6">
                  <PlanLimitsTab limits={formData.limits ?? defaultLimits} onChange={handleLimitsChange} />
                </div>
              )}
              {activeTab === "features" && (
                <div className="p-6">
                  <PlanFeaturesTab features={formData.features ?? defaultFeatures} onChange={handleFeaturesChange} />
                </div>
              )}
              {activeTab === "video-storage" && (
                <div className="p-6">
                  <PlanVideoStorageTab videoStorage={formData.videoStorage ?? defaultVideoStorage} onChange={handleVideoStorageChange} />
                </div>
              )}
              {activeTab === "branding" && (
                <div className="p-6">
                  <PlanBrandingTab branding={formData.branding ?? {}} onChange={handleBrandingChange} />
                </div>
              )}
              {activeTab === "integrations" && (
                <div className="p-6">
                  <PlanIntegrationsTab integrations={formData.integrations ?? defaultIntegrations} onChange={handleIntegrationsChange} />
                </div>
              )}
              {activeTab === "preview" && (
                <div className="p-6">
                  <PlanPreviewTab data={formData} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky Footer */}
        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            {isCreate ? "الباقة الجديدة ستكون متاحة بعد الحفظ" : "تعديل الباقة"}
          </div>
          <div className="flex items-center gap-3">
            <AppButton
              variant="ghost"
              onClick={handleClose}
              className="text-sm"
            >
              إلغاء
            </AppButton>
            {onSave && (
              <AppButton
                size="default"
                onClick={handleSave}
                loading={saving}
                className="text-sm min-w-[100px]"
              >
                <Save className="h-4 w-4" />
                حفظ التغييرات
              </AppButton>
            )}
          </div>
        </footer>
      </div>
    </AppDrawer>
  );
}

export { PlanDetailsDrawer };
