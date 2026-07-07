export type PlanStatus = "draft" | "active" | "hidden" | "archived";

export type PlanBadge = "most_popular" | "best_value" | "enterprise" | "custom" | "new" | "limited";

export type BillingType = "monthly" | "yearly" | "both";

export type VideoQuality = "720" | "1080" | "2k" | "4k";

export type VideoFormat = "mp4" | "mov" | "avi" | "mkv" | "webm";

export interface PlanLimits {
  admins: number | null;
  instructors: number | null;
  students: number | null;
  courses: number | null;
  sections: number | null;
  lessons: number | null;
  videos: number | null;
  certificates: number | null;
  quizzes: number | null;
  assignments: number | null;
  discussionThreads: number | null;
  bookmarks: number | null;
  notes: number | null;
  notificationsPerMonth: number | null;
  apiRequests: number | null;
  storage: number | null;
  bandwidth: number | null;
  maximumUploadSize: number | null;
  maximumVideoDuration: number | null;
}

export interface PlanFeatures {
  // Education
  courses: boolean;
  certificates: boolean;
  assignments: boolean;
  quizzes: boolean;
  discussions: boolean;
  notes: boolean;
  bookmarks: boolean;
  // Analytics
  basicAnalytics: boolean;
  advancedAnalytics: boolean;
  // Video
  bunnyStream: boolean;
  videoStreaming: boolean;
  videoDownloadProtection: boolean;
  videoAnalytics: boolean;
  // Branding
  customBranding: boolean;
  whiteLabel: boolean;
  customDomain: boolean;
  // Security
  auditLogs: boolean;
  activityLogs: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  // Integrations
  smtp: boolean;
  stripe: boolean;
  paypal: boolean;
  zoom: boolean;
  googleMeet: boolean;
  microsoftTeams: boolean;
  // AI
  aiAssistant: boolean;
  aiGrading: boolean;
  aiAnalytics: boolean;
}

export interface PlanVideoStorage {
  storageLimit: number;
  storageUsed: number;
  bandwidthLimit: number;
  bandwidthUsed: number;
  videosLimit: number;
  videosUsed: number;
  maximumUploadSize: number;
  maximumVideoDuration: number;
  allowedFormats: VideoFormat[];
  allowedQualities: VideoQuality[];
}

export interface PlanBranding {
  color: string;
  gradient: string;
  icon: string;
  recommendedRibbon: boolean;
  popularRibbon: boolean;
}

export interface PlanIntegrations {
  allowBunnyStorage: boolean;
  allowBunnyStream: boolean;
  allowSmtp: boolean;
  allowStripe: boolean;
  allowPaypal: boolean;
  allowZoom: boolean;
  allowMicrosoftTeams: boolean;
  allowGoogleMeet: boolean;
}

export interface PremiumPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  badge: PlanBadge | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  displayOrder: number;
  trialEnabled: boolean;
  trialDays: number;
  recommended: boolean;
  visible: boolean;
  status: PlanStatus;
  limits: PlanLimits;
  features: PlanFeatures;
  videoStorage: PlanVideoStorage;
  branding: PlanBranding;
  integrations: PlanIntegrations;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanPayload {
  name: string;
  slug: string;
  description: string;
  badge: PlanBadge | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  displayOrder: number;
  trialEnabled: boolean;
  trialDays: number;
  recommended: boolean;
  visible: boolean;
  active: boolean;
  color: string;
  gradient: string;
  icon: string;
  limits: PlanLimits;
  features: PlanFeatures;
  videoStorage: Partial<PlanVideoStorage>;
  branding: Partial<PlanBranding>;
  integrations: PlanIntegrations;
  status: PlanStatus;
}

export interface PlansFilterParams {
  search?: string;
  status?: PlanStatus | "all";
  billingType?: BillingType | "all";
  sort?: "name" | "monthlyPrice" | "yearlyPrice" | "createdAt" | "displayOrder";
  sortDir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface PlansMetricData {
  totalPlans: number;
  activePlans: number;
  trialPlans: number;
  featuredPlans: number;
  averageMonthlyPrice: number;
  unlimitedPlans: number;
}
