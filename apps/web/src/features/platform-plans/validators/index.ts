import { z } from "zod";

const unlimitedValue = z.union([z.number().min(0), z.null()]);

export const planLimitsSchema = z.object({
  admins: unlimitedValue,
  instructors: unlimitedValue,
  students: unlimitedValue,
  courses: unlimitedValue,
  sections: unlimitedValue,
  lessons: unlimitedValue,
  videos: unlimitedValue,
  certificates: unlimitedValue,
  quizzes: unlimitedValue,
  assignments: unlimitedValue,
  discussionThreads: unlimitedValue,
  bookmarks: unlimitedValue,
  notes: unlimitedValue,
  notificationsPerMonth: unlimitedValue,
  apiRequests: unlimitedValue,
  storage: unlimitedValue,
  bandwidth: unlimitedValue,
  maximumUploadSize: unlimitedValue,
  maximumVideoDuration: unlimitedValue,
});

export const planFeaturesSchema = z.object({
  courses: z.boolean(),
  certificates: z.boolean(),
  assignments: z.boolean(),
  quizzes: z.boolean(),
  discussions: z.boolean(),
  notes: z.boolean(),
  bookmarks: z.boolean(),
  basicAnalytics: z.boolean(),
  advancedAnalytics: z.boolean(),
  bunnyStream: z.boolean(),
  videoStreaming: z.boolean(),
  videoDownloadProtection: z.boolean(),
  videoAnalytics: z.boolean(),
  customBranding: z.boolean(),
  whiteLabel: z.boolean(),
  customDomain: z.boolean(),
  auditLogs: z.boolean(),
  activityLogs: z.boolean(),
  apiAccess: z.boolean(),
  webhooks: z.boolean(),
  smtp: z.boolean(),
  stripe: z.boolean(),
  paypal: z.boolean(),
  zoom: z.boolean(),
  googleMeet: z.boolean(),
  microsoftTeams: z.boolean(),
  aiAssistant: z.boolean(),
  aiGrading: z.boolean(),
  aiAnalytics: z.boolean(),
});

export const planVideoStorageSchema = z.object({
  storageLimit: z.number().min(0),
  storageUsed: z.number().min(0),
  bandwidthLimit: z.number().min(0),
  bandwidthUsed: z.number().min(0),
  videosLimit: z.number().min(0),
  videosUsed: z.number().min(0),
  maximumUploadSize: z.number().min(0),
  maximumVideoDuration: z.number().min(0),
  allowedFormats: z.array(z.enum(["mp4", "mov", "avi", "mkv", "webm"])),
  allowedQualities: z.array(z.enum(["720", "1080", "2k", "4k"])),
});

export const planBrandingSchema = z.object({
  color: z.string().min(1, "الرجاء اختيار لون"),
  gradient: z.string().min(1, "الرجاء اختيار تدرج"),
  icon: z.string().min(1, "الرجاء اختيار أيقونة"),
  recommendedRibbon: z.boolean(),
  popularRibbon: z.boolean(),
});

export const planIntegrationsSchema = z.object({
  allowBunnyStorage: z.boolean(),
  allowBunnyStream: z.boolean(),
  allowSmtp: z.boolean(),
  allowStripe: z.boolean(),
  allowPaypal: z.boolean(),
  allowZoom: z.boolean(),
  allowMicrosoftTeams: z.boolean(),
  allowGoogleMeet: z.boolean(),
});

export const planFormSchema = z.object({
  name: z.string().min(1, "اسم الباقة مطلوب"),
  slug: z.string().min(1, "الرابط المختصر مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  badge: z.enum(["most_popular", "best_value", "enterprise", "custom", "new", "limited"]).nullable(),
  monthlyPrice: z.coerce.number().min(0, "السعر الشهري يجب أن يكون 0 أو أكثر"),
  yearlyPrice: z.coerce.number().min(0, "السعر السنوي يجب أن يكون 0 أو أكثر"),
  currency: z.string().min(1, "العملة مطلوبة"),
  displayOrder: z.coerce.number().min(0, "ترتيب العرض يجب أن يكون 0 أو أكثر"),
  trialEnabled: z.boolean(),
  trialDays: z.coerce.number().min(0),
  recommended: z.boolean(),
  visible: z.boolean(),
  active: z.boolean(),
  status: z.enum(["draft", "active", "hidden", "archived"]),
  color: z.string().min(1),
  gradient: z.string().min(1),
  icon: z.string().min(1),
  limits: planLimitsSchema,
  features: planFeaturesSchema,
  videoStorage: planVideoStorageSchema.partial(),
  branding: planBrandingSchema.partial(),
  integrations: planIntegrationsSchema,
});

export type PlanFormValues = z.infer<typeof planFormSchema>;
