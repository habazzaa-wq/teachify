import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "اسم التصنيف مطلوب").max(255, "الاسم طويل جداً"),
  slug: z.string().max(255, "المعرّف طويل جداً").optional().or(z.literal("")),
  parentId: z.number().nullable().optional(),
  description: z.string().optional().or(z.literal("")),
  thumbnailPath: z.string().url("رابط الصورة غير صحيح").max(2048).optional().or(z.literal("")),
  icon: z.string().max(100, "اسم الأيقونة طويل جداً").optional().or(z.literal("")),
  color: z.string().max(20, "كود اللون طويل جداً").optional().or(z.literal("")),
  sortOrder: z.number().min(0, "الترتيب يجب أن يكون 0 أو أكثر").optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  seoTitle: z.string().max(255, "عنوان SEO طويل جداً").optional().or(z.literal("")),
  seoDescription: z.string().max(500, "وصف SEO طويل جداً").optional().or(z.literal("")),
  seoKeywords: z.string().max(500, "الكلمات المفتاحية طويلة جداً").optional().or(z.literal("")),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "اسم التصنيف مطلوب").max(255).optional(),
  slug: z.string().max(255).optional().or(z.literal("")),
  parentId: z.number().nullable().optional(),
  description: z.string().optional().or(z.literal("")),
  thumbnailPath: z.string().url().max(2048).optional().or(z.literal("")),
  icon: z.string().max(100).optional().or(z.literal("")),
  color: z.string().max(20).optional().or(z.literal("")),
  sortOrder: z.number().min(0).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  seoTitle: z.string().max(255).optional().or(z.literal("")),
  seoDescription: z.string().max(500).optional().or(z.literal("")),
  seoKeywords: z.string().max(500).optional().or(z.literal("")),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>;