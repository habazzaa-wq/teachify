import { z } from "zod";

export const createLessonSchema = z.object({
  title: z.string().min(1, "عنوان الدرس مطلوب").max(255, "العنوان طويل جداً"),
  slug: z.string().max(255, "الرابط طويل جداً").optional().or(z.literal("")),
  short_description: z.string().max(500, "الوصف القصير طويل جداً").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  lesson_type: z.enum(["video", "text", "pdf", "external", "live"], {
    errorMap: () => ({ message: "نوع الدرس غير صالح" }),
  }),
  status: z.enum(["draft", "review", "published", "scheduled", "archived"]).optional(),
  visibility: z.enum(["private", "preview", "public"]).optional(),
  sort_order: z.number().min(0, "الترتيب يجب أن يكون 0 أو أكثر").optional(),
  duration_seconds: z.number().min(0, "المدة يجب أن تكون 0 أو أكثر").nullable().optional(),
  estimated_duration: z.number().min(0, "المدة التقديرية يجب أن تكون 0 أو أكثر").nullable().optional(),
  free_preview: z.boolean().optional(),
  downloadable: z.boolean().optional(),
  featured: z.boolean().optional(),
  comments_enabled: z.boolean().optional(),
  notes: z.string().nullable().optional().or(z.literal("")),
  color: z.string().max(20).nullable().optional().or(z.literal("")),
  icon: z.string().max(100).nullable().optional().or(z.literal("")),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1, "عنوان الدرس مطلوب").max(255).optional(),
  slug: z.string().max(255).optional().or(z.literal("")),
  short_description: z.string().max(500).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  lesson_type: z.enum(["video", "text", "pdf", "external", "live"]).optional(),
  status: z.enum(["draft", "review", "published", "scheduled", "archived"]).optional(),
  visibility: z.enum(["private", "preview", "public"]).optional(),
  sort_order: z.number().min(0).optional(),
  duration_seconds: z.number().min(0).nullable().optional(),
  estimated_duration: z.number().min(0).nullable().optional(),
  free_preview: z.boolean().optional(),
  downloadable: z.boolean().optional(),
  featured: z.boolean().optional(),
  comments_enabled: z.boolean().optional(),
  notes: z.string().nullable().optional().or(z.literal("")),
  color: z.string().max(20).nullable().optional().or(z.literal("")),
  icon: z.string().max(100).nullable().optional().or(z.literal("")),
});

export type CreateLessonFormValues = z.infer<typeof createLessonSchema>;
export type UpdateLessonFormValues = z.infer<typeof updateLessonSchema>;
