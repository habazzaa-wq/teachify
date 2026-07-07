export type TenantStatus = "active" | "trial" | "suspended" | "archived" | "pending" | "cancelled" | "expired";

export type BillingCycle = "monthly" | "yearly" | "quarterly" | "semi-annual";

export type TenantLanguage = "ar" | "en" | "fr" | "ur" | "es";

export type TenantCurrency = "SAR" | "AED" | "USD" | "EUR";

export type BillingStatus = "paid" | "pending" | "overdue" | "cancelled" | "free";

export interface TenantDomain {
  platformSubdomain: string;
  customDomain: string | null;
  wildcard: boolean;
  sslStatus: "active" | "pending" | "expired" | "error";
  dnsStatus: "verified" | "pending" | "error";
  verificationStatus: "verified" | "pending" | "unverified";
}

export interface TenantOwner {
  name: string;
  email: string;
  phone: string;
}

export interface TenantAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface TenantBranding {
  logo: string | null;
  darkLogo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fonts: string;
  loginBackground: string | null;
  emailBranding: boolean;
  whiteLabel: boolean;
}

export interface TenantLimits {
  storage: number;
  storageUsed: number;
  bandwidth: number;
  bandwidthUsed: number;
  videos: number;
  videosUsed: number;
  courses: number;
  coursesUsed: number;
  users: number;
  usersUsed: number;
  admins: number;
  adminsUsed: number;
  teachers: number;
  teachersUsed: number;
  students: number;
  studentsUsed: number;
  apiRequests: number;
  apiRequestsUsed: number;
  liveClasses: number;
  liveClassesUsed: number;
  certificates: number;
  certificatesUsed: number;
  assignments: number;
  assignmentsUsed: number;
  quizzes: number;
  quizzesUsed: number;
  communities: number;
  communitiesUsed: number;
}

export interface TenantSubscription {
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  renewal: string;
  startDate: string;
  trialEndDate: string | null;
  status: TenantStatus;
  price: number;
  currency: TenantCurrency;
  paymentMethod: string;
  autoRenew: boolean;
  invoices: Invoice[];
}

export interface Invoice {
  id: string;
  amount: number;
  currency: TenantCurrency;
  status: BillingStatus;
  date: string;
  dueDate: string;
  url: string;
}

export interface TenantIntegration {
  bunnyStorage: "configured" | "not_configured";
  bunnyStream: "configured" | "not_configured";
  smtp: "configured" | "not_configured";
  sso: "configured" | "not_configured";
  googleOAuth: "configured" | "not_configured";
  zoom: "configured" | "not_configured";
  webhook: "configured" | "not_configured";
  apiKeys: "configured" | "not_configured";
}

export interface DomainHistoryEntry {
  id: string;
  domain: string;
  type: "primary" | "custom";
  action: "added" | "removed" | "verified" | "expired";
  timestamp: string;
}

export interface TenantActivity {
  id: string;
  type: "created" | "subscription_changed" | "owner_changed" | "domain_changed" | "suspended" | "activated" | "storage_increased" | "plan_upgraded" | "login" | "api_activity" | "password_reset" | "user_added" | "impersonated";
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface TenantSecurity {
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
  failedLogins: number;
  activeSessions: number;
  trustedDevices: number;
  recoveryCodes: boolean;
}

export interface TenantStorageInfo {
  currentStorage: number;
  currentBandwidth: number;
  videosCount: number;
  remainingStorage: number;
  remainingBandwidth: number;
}

export interface TenantLogEntry {
  id: string;
  type: "info" | "warning" | "error" | "debug";
  action: string;
  description: string;
  ip: string;
  userAgent: string;
  user: string;
  timestamp: string;
}

export interface OwnerAccount {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordChanged: boolean;
  welcomeEmail: boolean;
  twoFactorEnabled: boolean;
  status: "active" | "inactive";
}

export interface Tenant {
  id: string;
  logo: string | null;
  name: string;
  slug: string;
  description: string;
  domain: TenantDomain;
  domainHistory: DomainHistoryEntry[];
  owner: TenantOwner;
  ownerAccount: OwnerAccount;
  address: TenantAddress;
  timezone: string;
  language: TenantLanguage;
  currency: TenantCurrency;
  phone: string;
  status: TenantStatus;
  subscription: TenantSubscription;
  limits: TenantLimits;
  branding: TenantBranding;
  integrations: TenantIntegration;
  notes: string;
  tags: string[];
  revenue: number;
  security: TenantSecurity;
  storage: TenantStorageInfo;
  activity: TenantActivity[];
  logs: TenantLogEntry[];
  recentLogins: number;
  recentApiCalls: number;
  companyName: string;
  supportEmail: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  lastLogin: string;
}

export interface TenantsFilterParams {
  search?: string;
  searchBy?: "name" | "owner" | "email" | "domain" | "plan";
  status?: TenantStatus | "all";
  subscriptionPlan?: string;
  country?: string;
  language?: TenantLanguage | "all";
  sort?: string;
  sortDir?: "asc" | "desc";
  storageMin?: number;
  storageMax?: number;
  bandwidthMin?: number;
  bandwidthMax?: number;
  videosMin?: number;
  videosMax?: number;
  createdAfter?: string;
  createdBefore?: string;
  trialOnly?: boolean;
  expired?: boolean;
  billingStatus?: BillingStatus | "all";
  activeArchived?: "active" | "archived" | "all";
  page?: number;
  perPage?: number;
}

export interface TenantsMetricData {
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  trialTenants: number;
  totalUsers: number;
  totalStorageUsed: number;
  totalVideos: number;
  monthlyRevenue: number;
}

export interface WizardSection1 {
  name: string;
  slug: string;
  description: string;
  status: TenantStatus;
  timezone: string;
  language: TenantLanguage;
  currency: TenantCurrency;
}

export interface WizardSection2 {
  subdomain: string;
}

export interface WizardSection3 {
  planId: string;
  trialDays: number;
  startsAt: string;
  endsAt: string;
  autoRenew: boolean;
  billingStatus: BillingStatus;
}

export interface WizardSection4 {
  ownerName: string;
  ownerEmail: string;
  phone: string;
  password: string;
  confirmPassword: string;
  requirePasswordChange: boolean;
  sendWelcomeEmail: boolean;
  enable2FA: boolean;
  ownerStatus: "active" | "inactive";
}

export interface WizardSection5 {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  favicon: string | null;
  companyName: string;
  supportEmail: string;
}

export interface WizardSection6 {
  notes: string;
  tags: string[];
}

export interface WizardState {
  section1: WizardSection1;
  section2: WizardSection2;
  section3: WizardSection3;
  section4: WizardSection4;
  section5: WizardSection5;
  section6: WizardSection6;
}

export interface TenantCreationResult {
  tenant: Tenant;
  generatedPassword: string;
  loginUrl: string;
}

export interface ImpersonationToken {
  token: string;
  expiresAt: string;
  tenantId: string;
  tenantSlug: string;
  tenantUrl: string;
}

export interface PasswordResetResult {
  newPassword: string;
}

export interface WelcomeEmailPayload {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  loginUrl: string;
  password: string;
}

export type OwnerStatusType = "active" | "suspended" | "pending" | "inactive";

export interface OwnerProfile {
  id: string;
  avatar: string | null;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: OwnerStatusType;
  createdAt: string;
  lastLogin: string;
  lastLoginIP: string;
  lastBrowser: string;
  passwordLastChanged: string;
  twoFactorEnabled: boolean;
  recoveryEmail: string;
  passwordStrength: "weak" | "medium" | "strong";
  trustedDevicesCount: number;
  failedLoginAttempts: number;
}

export interface LastLoginInfo {
  date: string;
  time: string;
  country: string;
  ip: string;
  browser: string;
  operatingSystem: string;
  device: string;
}

export interface OwnerSecurityInfo {
  failedLoginAttempts: number;
  passwordStrength: "weak" | "medium" | "strong";
  twoFactorEnabled: boolean;
  recoveryEmail: string;
  trustedDevicesCount: number;
}

export interface EditOwnerFormData {
  name: string;
  email: string;
  phone: string;
  status: OwnerStatusType;
  role: string;
  twoFactorEnabled: boolean;
  requirePasswordChange: boolean;
  notes?: string;
}
