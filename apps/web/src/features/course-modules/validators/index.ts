import { z } from "zod";

export const createCourseModuleSchema = z.object({
  title: z.string().min(1, "عنوان الوحدة مطلوب").max(255, "العنوان طويل جداً"),
  slug: z.string().max(255, "الرابط طويل جداً").optional(),
  description: z.string().optional().or(z.literal("")),
  order: z.number().min(0, "الترتيب يجب أن يكون 0 أو أكثر").optional(),
  estimated_duration: z.number().min(0, "المدة يجب أن تكون 0 أو أكثر").nullable().optional(),
  featured: z.boolean().optional(),
  color: z.string().max(20).nullable().optional().or(z.literal("")),
  icon: z.string().max(100).nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional().or(z.literal("")),
});

export const updateCourseModuleSchema = z.object({
  title: z.string().min(1, "عنوان الوحدة مطلوب").max(255, "العنوان طويل جداً").optional(),
  slug: z.string().max(255).optional(),
  description: z.string().optional().or(z.literal("")),
  order: z.number().min(0).optional(),
  estimated_duration: z.number().min(0).nullable().optional(),
  featured: z.boolean().optional(),
  color: z.string().max(20).nullable().optional().or(z.literal("")),
  icon: z.string().max(100).nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional().or(z.literal("")),
});

export type CreateModuleFormValues = z.infer<typeof createCourseModuleSchema>;
export type UpdateModuleFormValues = z.infer<typeof updateCourseModuleSchema>;
