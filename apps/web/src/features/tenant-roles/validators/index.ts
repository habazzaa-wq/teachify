import { z } from "zod";

export const createTenantRoleSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(100, "الاسم طويل جداً"),
  nameAr: z.string().min(1, "الاسم بالعربية مطلوب").max(100, "الاسم بالعربية طويل جداً"),
  description: z.string().min(1, "الوصف مطلوب").max(500, "الوصف طويل جداً"),
  icon: z.string().min(1, "الأيقونة مطلوبة"),
  color: z.string().min(1, "اللون مطلوب"),
  status: z.enum(["active", "inactive", "archived"], {
    required_error: "الحالة مطلوبة",
  }),
  isSystem: z.boolean(),
  isDefault: z.boolean(),
  priority: z.number().min(0).max(9999),
  notes: z.string().optional(),
});

export const updateTenantRoleSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(100, "الاسم طويل جداً").optional(),
  nameAr: z.string().min(1, "الاسم بالعربية مطلوب").max(100, "الاسم بالعربية طويل جداً").optional(),
  description: z.string().min(1, "الوصف مطلوب").max(500, "الوصف طويل جداً").optional(),
  icon: z.string().min(1, "الأيقونة مطلوبة").optional(),
  color: z.string().min(1, "اللون مطلوب").optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  isSystem: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  priority: z.number().min(0).max(9999).optional(),
  notes: z.string().optional(),
});

export type CreateTenantRoleFormValues = z.infer<typeof createTenantRoleSchema>;
export type UpdateTenantRoleFormValues = z.infer<typeof updateTenantRoleSchema>;
