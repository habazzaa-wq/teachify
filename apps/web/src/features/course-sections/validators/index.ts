import { z } from "zod";

export const createCourseSectionSchema = z.object({
  title: z.string().min(1, "عنوان القسم مطلوب").max(255, "العنوان طويل جداً"),
  slug: z.string().max(255, "الرابط طويل جداً").optional(),
  description: z.string().optional().or(z.literal("")),
  sort_order: z.number().min(0, "الترتيب يجب أن يكون 0 أو أكثر").optional(),
  duration_minutes: z.number().min(0, "المدة يجب أن تكون 0 أو أكثر").nullable().optional(),
  free_preview: z.boolean().optional(),
  locked: z.boolean().optional(),
  featured: z.boolean().optional(),
  color: z.string().max(20).nullable().optional().or(z.literal("")),
  icon: z.string().max(100).nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional().or(z.literal("")),
});

export const updateCourseSectionSchema = z.object({
  title: z.string().min(1, "عنوان القسم مطلوب").max(255, "العنوان طويل جداً").optional(),
  slug: z.string().max(255).optional(),
  description: z.string().optional().or(z.literal("")),
  sort_order: z.number().min(0).optional(),
  duration_minutes: z.number().min(0).nullable().optional(),
  free_preview: z.boolean().optional(),
  locked: z.boolean().optional(),
  featured: z.boolean().optional(),
  color: z.string().max(20).nullable().optional().or(z.literal("")),
  icon: z.string().max(100).nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional().or(z.literal("")),
});

export type CreateSectionFormValues = z.infer<typeof createCourseSectionSchema>;
export type UpdateSectionFormValues = z.infer<typeof updateCourseSectionSchema>;
