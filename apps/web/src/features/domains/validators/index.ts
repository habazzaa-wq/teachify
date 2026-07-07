import { z } from "zod";

const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

export const domainFormSchema = z.object({
  tenantId: z.string().min(1, "العميل مطلوب"),
  domain: z
    .string()
    .min(1, "النطاق مطلوب")
    .max(255, "النطاق طويل جداً")
    .refine((val) => !val.includes("://"), { message: "لا يسمح بالبروتوكول" })
    .refine((val) => !val.includes(" "), { message: "لا يسمح بمسافات" })
    .refine((val) => val === val.toLowerCase(), { message: "يجب أن يكون النطاق بأحرف صغيرة" })
    .refine((val) => !val.endsWith("/"), { message: "لا يسمح بشرطة مائلة في النهاية" })
    .refine((val) => domainRegex.test(val), { message: "صيغة النطاق غير صحيحة" }),
  subdomain: z.string().optional(),
  type: z.enum(["platform_subdomain", "custom_domain", "wildcard"], {
    required_error: "نوع النطاق مطلوب",
  }),
  isPrimary: z.boolean().default(false),
  active: z.boolean().default(true),
  notes: z.string().optional(),
});

export type DomainFormValues = z.infer<typeof domainFormSchema>;
