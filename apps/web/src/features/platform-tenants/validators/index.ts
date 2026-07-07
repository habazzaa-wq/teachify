import { z } from "zod";

const domainValidation = z.string().transform((val) => val.toLowerCase().trim())
  .pipe(z.string().min(1, "النطاق مطلوب").max(255, "النطاق طويل جداً"))
  .refine((val) => !/^https?:\/\//.test(val), { message: "يجب ألا يحتوي على بروتوكول" })
  .refine((val) => !/\/$/.test(val), { message: "يجب ألا ينتهي بشرطة مائلة" })
  .refine((val) => !/\s/.test(val), { message: "يجب ألا يحتوي على مسافات" });

export const tenantDomainSchema = z.object({
  platformSubdomain: z.string().min(1, "النطاق الفرعي مطلوب").max(255, "النطاق الفرعي طويل جداً"),
  customDomain: domainValidation.nullable(),
  wildcard: z.boolean(),
  sslStatus: z.enum(["active", "pending", "expired", "error"]),
  dnsStatus: z.enum(["verified", "pending", "error"]),
  verificationStatus: z.enum(["verified", "pending", "unverified"]),
});

export const tenantOwnerSchema = z.object({
  name: z.string().min(1, "اسم المالك مطلوب").max(255, "اسم المالك طويل جداً"),
  email: z.string().max(255, "البريد الإلكتروني طويل جداً").email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(1, "رقم الهاتف مطلوب").max(255, "رقم الهاتف طويل جداً"),
});

export const tenantAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(1, "الدولة مطلوبة").max(255, "الدولة طويلة جداً"),
  zip: z.string().optional(),
});

export const tenantLimitsSchema = z.object({
  storage: z.number().min(0),
  storageUsed: z.number().min(0),
  bandwidth: z.number().min(0),
  bandwidthUsed: z.number().min(0),
  videos: z.number().min(0),
  videosUsed: z.number().min(0),
  courses: z.number().min(0),
  coursesUsed: z.number().min(0),
  users: z.number().min(0),
  usersUsed: z.number().min(0),
  admins: z.number().min(0),
  adminsUsed: z.number().min(0),
  teachers: z.number().min(0),
  teachersUsed: z.number().min(0),
  students: z.number().min(0),
  studentsUsed: z.number().min(0),
  apiRequests: z.number().min(0),
  apiRequestsUsed: z.number().min(0),
  liveClasses: z.number().min(0),
  liveClassesUsed: z.number().min(0),
  certificates: z.number().min(0),
  certificatesUsed: z.number().min(0),
  assignments: z.number().min(0),
  assignmentsUsed: z.number().min(0),
  quizzes: z.number().min(0),
  quizzesUsed: z.number().min(0),
  communities: z.number().min(0),
  communitiesUsed: z.number().min(0),
});

export const tenantBrandingSchema = z.object({
  logo: z.string().nullable(),
  darkLogo: z.string().nullable(),
  favicon: z.string().nullable(),
  primaryColor: z.string().min(1, "اللون الأساسي مطلوب"),
  secondaryColor: z.string().min(1, "اللون الثانوي مطلوب"),
  accentColor: z.string().min(1, "لون التمييز مطلوب"),
  fonts: z.string().min(1, "الخط مطلوب"),
  loginBackground: z.string().nullable(),
  emailBranding: z.boolean(),
  whiteLabel: z.boolean(),
});

export const wizardSection1Schema = z.object({
  name: z.string().min(1, "اسم المؤسسة مطلوب").max(255, "اسم المؤسسة طويل جداً"),
  slug: z.string().min(1, "الرابط المختصر مطلوب").max(255, "الرابط المختصر طويل جداً")
    .regex(/^[a-z0-9-]+$/, "يجب أن يكون أحرف صغيرة وأرقام وشرطات فقط"),
  description: z.string().optional(),
  status: z.enum(["active", "trial", "suspended", "archived", "pending", "cancelled", "expired"]),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة").max(64, "المنطقة الزمنية طويلة جداً"),
  language: z.enum(["ar", "en", "fr", "ur", "es"]),
  currency: z.enum(["SAR", "AED", "USD", "EUR"]),
});

export const wizardSection2Schema = z.object({
  subdomain: z.string().min(1, "النطاق الفرعي مطلوب").max(255, "النطاق الفرعي طويل جداً")
    .regex(/^[a-z0-9-]+$/, "أحرف صغيرة وأرقام وشرطات فقط")
    .refine((val) => !/^https?:\/\//.test(val), { message: "يجب ألا يحتوي على بروتوكول" })
    .refine((val) => !/\//.test(val), { message: "يجب ألا يحتوي على شرطة مائلة" })
    .refine((val) => !/\s/.test(val), { message: "يجب ألا يحتوي على مسافات" }),
});

export const wizardSection3Schema = z.object({
  planId: z.string().min(1, "الباقة مطلوبة"),
  trialDays: z.number().min(0, "لا يمكن أن تكون أقل من 0").max(365, "لا يمكن أن تتجاوز 365 يوماً"),
  startsAt: z.string().min(1, "تاريخ البداية مطلوب"),
  endsAt: z.string().min(1, "تاريخ النهاية مطلوب"),
  autoRenew: z.boolean(),
  billingStatus: z.enum(["paid", "pending", "overdue", "cancelled", "free"]),
});

export const wizardSection4Schema = z.object({
  ownerName: z.string().min(1, "اسم المالك مطلوب").max(255, "اسم المالك طويل جداً"),
  ownerEmail: z.string().max(255, "البريد الإلكتروني طويل جداً").email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(1, "رقم الهاتف مطلوب").max(255, "رقم الهاتف طويل جداً"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  requirePasswordChange: z.boolean(),
  sendWelcomeEmail: z.boolean(),
  enable2FA: z.boolean(),
  ownerStatus: z.enum(["active", "inactive"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور غير متطابقة",
  path: ["confirmPassword"],
});

export const wizardSection5Schema = z.object({
  logo: z.string().nullable(),
  primaryColor: z.string().min(1, "اللون الأساسي مطلوب"),
  secondaryColor: z.string().min(1, "اللون الثانوي مطلوب"),
  favicon: z.string().nullable(),
  companyName: z.string().min(1, "اسم الشركة مطلوب").max(255, "اسم الشركة طويل جداً"),
  supportEmail: z.string().max(255, "البريد الإلكتروني طويل جداً").email("البريد الإلكتروني غير صالح"),
});

export const wizardSection6Schema = z.object({
  notes: z.string().optional(),
  tags: z.array(z.string()),
});

export const wizardSchema = z.object({
  section1: wizardSection1Schema,
  section2: wizardSection2Schema,
  section3: wizardSection3Schema,
  section4: wizardSection4Schema,
  section5: wizardSection5Schema,
  section6: wizardSection6Schema,
});

export const tenantSchema = z.object({
  name: z.string().min(1, "اسم المؤسسة مطلوب").max(255, "اسم المؤسسة طويل جداً"),
  slug: z.string().min(1, "الرابط المختصر مطلوب").max(255, "الرابط المختصر طويل جداً"),
  domain: tenantDomainSchema,
  owner: tenantOwnerSchema,
  address: tenantAddressSchema.optional(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة").max(64, "المنطقة الزمنية طويلة جداً"),
  language: z.enum(["ar", "en", "fr", "ur", "es"]),
  currency: z.enum(["SAR", "AED", "USD", "EUR"]),
  phone: z.string().min(1, "رقم الهاتف مطلوب").max(255, "رقم الهاتف طويل جداً"),
  status: z.enum(["active", "trial", "suspended", "archived", "pending", "cancelled", "expired"]),
  notes: z.string().optional(),
});

export const impersonationTokenSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string().min(1),
  tenantId: z.string().min(1),
  tenantSlug: z.string().min(1),
  tenantUrl: z.string().url(),
});

export const passwordResetSchema = z.object({
  newPassword: z.string().min(8, "يجب أن تكون 8 أحرف على الأقل"),
});

export const welcomeEmailSchema = z.object({
  tenantName: z.string().min(1).max(255),
  ownerName: z.string().min(1).max(255),
  ownerEmail: z.string().max(255).email(),
  loginUrl: z.string().url(),
  password: z.string().min(1),
});

export const editOwnerSchema = z.object({
  name: z.string().min(1, "اسم المالك مطلوب").max(255, "اسم المالك طويل جداً"),
  email: z.string().max(255, "البريد الإلكتروني طويل جداً").email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(1, "رقم الهاتف مطلوب").max(255, "رقم الهاتف طويل جداً"),
  status: z.enum(["active", "suspended", "pending", "inactive"]),
  role: z.string().min(1, "الدور مطلوب").max(255, "الدور طويل جداً"),
  twoFactorEnabled: z.boolean(),
  requirePasswordChange: z.boolean(),
  notes: z.string().optional(),
});

export type WizardSection1 = z.infer<typeof wizardSection1Schema>;
export type WizardSection2 = z.infer<typeof wizardSection2Schema>;
export type WizardSection3 = z.infer<typeof wizardSection3Schema>;
export type WizardSection4 = z.infer<typeof wizardSection4Schema>;
export type WizardSection5 = z.infer<typeof wizardSection5Schema>;
export type WizardSection6 = z.infer<typeof wizardSection6Schema>;
export type WizardForm = z.infer<typeof wizardSchema>;
