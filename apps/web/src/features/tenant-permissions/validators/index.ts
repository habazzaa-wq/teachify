import { z } from "zod";

const permissionKeyRegex = /^[a-z]+\.[a-z]+$/;

export const createTenantPermissionSchema = z.object({
  key: z
    .string()
    .min(1, "مفتاح الصلاحية مطلوب")
    .regex(permissionKeyRegex, "يجب أن يكون المفتاح بالتنسيق: وحدة.إجراء (مثال: users.view)"),
  nameAr: z.string().min(1, "الاسم بالعربية مطلوب").max(200, "الاسم بالعربية طويل جداً"),
  nameEn: z.string().min(1, "الاسم بالإنجليزية مطلوب").max(200, "الاسم بالإنجليزية طويل جداً"),
  module: z.enum(
    ["dashboard", "users", "roles", "permissions", "courses", "lessons", "students", "teachers", "certificates", "orders", "payments", "analytics", "settings", "media", "notifications", "reports", "api", "integrations"],
    { required_error: "الوحدة مطلوبة" },
  ),
  action: z.enum(
    ["view", "create", "update", "delete", "export", "import", "manage", "approve", "publish", "archive", "restore"],
    { required_error: "الإجراء مطلوب" },
  ),
  description: z.string().min(1, "الوصف مطلوب").max(500, "الوصف طويل جداً"),
  riskLevel: z.enum(["low", "medium", "high", "critical"], {
    required_error: "مستوى المخاطرة مطلوب",
  }),
  isSystem: z.boolean(),
  isHidden: z.boolean(),
  notes: z.string().optional(),
});

export const updateTenantPermissionSchema = z.object({
  nameAr: z.string().min(1, "الاسم بالعربية مطلوب").max(200, "الاسم بالعربية طويل جداً").optional(),
  nameEn: z.string().min(1, "الاسم بالإنجليزية مطلوب").max(200, "الاسم بالإنجليزية طويل جداً").optional(),
  description: z.string().min(1, "الوصف مطلوب").max(500, "الوصف طويل جداً").optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  isHidden: z.boolean().optional(),
  notes: z.string().optional(),
});

export type CreateTenantPermissionFormValues = z.infer<typeof createTenantPermissionSchema>;
export type UpdateTenantPermissionFormValues = z.infer<typeof updateTenantPermissionSchema>;
