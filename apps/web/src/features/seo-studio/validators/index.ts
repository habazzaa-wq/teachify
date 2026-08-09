import { z } from "zod";

const SLUG_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

export const seoContentSchema = z.object({
  contentType: z.enum(["article", "guide", "faq_collection", "custom_page", "course", "stage", "subject", "category"]),
  title: z.string().min(1, "العنوان مطلوب").max(255, "العنوان طويل جداً"),
  slug: z
    .string()
    .regex(SLUG_REGEX, "الرابط يجب أن يحتوي أحرفًا وأرقامًا وشرطات فقط")
    .max(255, "الرابط طويل جداً")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "review", "published", "archived"]),
  excerpt: z.string().max(500, "الملخص طويل جداً").optional().or(z.literal("")),
  content: z.string().optional(),
  seoTitle: z.string().max(255, "العنوان طويل جداً").optional().or(z.literal("")),
  seoDescription: z.string().max(500, "الوصف طويل جداً").optional().or(z.literal("")),
  focusKeyword: z.string().max(255, "الكلمة المفتاحية طويلة جداً").optional().or(z.literal("")),
  canonicalUrl: z.string().max(2048, "الرابط طويل جداً").optional().or(z.literal("")),
  ogTitle: z.string().max(255).optional().or(z.literal("")),
  ogDescription: z.string().max(500).optional().or(z.literal("")),
  twitterTitle: z.string().max(255).optional().or(z.literal("")),
  twitterDescription: z.string().max(500).optional().or(z.literal("")),
  structuredDataType: z.enum(["article", "news_article", "faq_page", "course", "item_list", "breadcrumb", "none"]),
});

export const seoSettingSchema = z.object({
  defaultTitleTemplate: z.string().max(255).optional().or(z.literal("")),
  defaultDescription: z.string().max(500).optional().or(z.literal("")),
  defaultRobotsPolicy: z.enum(["index", "noindex", "index_follow", "noindex_nofollow"]),
  sitemapIncludeDefault: z.boolean(),
  organizationName: z.string().max(255).optional().or(z.literal("")),
  organizationDescription: z.string().max(1000).optional().or(z.literal("")),
  homepageTitle: z.string().max(255).optional().or(z.literal("")),
  homepageDescription: z.string().max(500).optional().or(z.literal("")),
  socialProfiles: z.array(z.string().url("رابط غير صالح").max(2048)).max(10).optional(),
});

export type SeoContentFormValues = z.infer<typeof seoContentSchema>;
export type SeoSettingFormValues = z.infer<typeof seoSettingSchema>;
