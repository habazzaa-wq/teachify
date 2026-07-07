import { z } from "zod";

const phoneRegex = /^\+?[0-9]{7,15}$/;

export const createTenantUserSchema = z.object({
  fullName: z.string().min(1, "الاسم مطلوب").max(100, "الاسم طويل جداً"),
  email: z.string().min(1, "البريد الإلكتروني مطلوب").max(255, "البريد الإلكتروني طويل جداً").email("صيغة البريد الإلكتروني غير صحيحة"),
  phone: z.string().regex(phoneRegex, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  department: z.enum(["management", "academic", "support", "marketing", "sales", "finance", "hr", "it", "operations"], {
    required_error: "القسم مطلوب",
  }),
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب").max(255, "المسمى الوظيفي طويل جداً"),
  roleSlug: z.enum(["owner", "admin", "manager", "instructor", "support", "reviewer", "marketing", "sales", "custom"], {
    required_error: "الدور مطلوب",
  }),
  status: z.enum(["active", "inactive", "suspended", "pending"], {
    required_error: "الحالة مطلوبة",
  }),
  language: z.string().min(1, "اللغة مطلوبة").max(10, "اللغة طويلة جداً"),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة").max(64, "المنطقة الزمنية طويلة جداً"),
  avatar: z.string().max(255, "الصورة الرمزية طويلة جداً").nullable().optional(),
  notes: z.string().max(5000, "الملاحظات طويلة جداً").optional(),
});

export const updateTenantUserSchema = z.object({
  fullName: z.string().min(1, "الاسم مطلوب").max(100, "الاسم طويل جداً").optional(),
  email: z.string().max(255, "البريد الإلكتروني طويل جداً").email("صيغة البريد الإلكتروني غير صحيحة").optional(),
  phone: z.string().regex(phoneRegex, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  department: z.enum(["management", "academic", "support", "marketing", "sales", "finance", "hr", "it", "operations"]).optional(),
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب").max(255, "المسمى الوظيفي طويل جداً").optional(),
  roleSlug: z.enum(["owner", "admin", "manager", "instructor", "support", "reviewer", "marketing", "sales", "custom"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  language: z.string().max(10, "اللغة طويلة جداً").optional(),
  timezone: z.string().max(64, "المنطقة الزمنية طويلة جداً").optional(),
  avatar: z.string().max(255, "الصورة الرمزية طويلة جداً").nullable().optional(),
  notes: z.string().max(5000, "الملاحظات طويلة جداً").optional(),
});

export type CreateTenantUserFormValues = z.infer<typeof createTenantUserSchema>;
export type UpdateTenantUserFormValues = z.infer<typeof updateTenantUserSchema>;
