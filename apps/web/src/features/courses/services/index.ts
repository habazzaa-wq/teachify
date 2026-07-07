import { api } from "@/services/api";
import type { Course, CourseFilterParams, CourseMetricData, CreateCoursePayload, UpdateCoursePayload, CourseActivity } from "../types";

function formatCourse(raw: any): Course {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId),
    title: raw.title,
    slug: raw.slug,
    subtitle: raw.subtitle ?? null,
    shortDescription: raw.shortDescription ?? null,
    description: raw.description ?? null,
    fullDescription: raw.fullDescription ?? null,
    thumbnail: raw.thumbnail ?? null,
    coverImage: raw.coverImage ?? null,
    status: raw.status ?? "draft",
    visibility: raw.visibility ?? "private",
    difficulty: raw.difficulty ?? "beginner",
    language: raw.language ?? "ar",
    duration: raw.duration ?? null,
    pricingType: raw.pricingType ?? "free",
    price: raw.price ?? null,
    currency: raw.currency ?? null,
    discountPrice: raw.discountPrice ?? null,
    enrollmentLimit: raw.enrollmentLimit ?? null,
    startDate: raw.startDate ?? null,
    endDate: raw.endDate ?? null,
    certificateEnabled: raw.certificateEnabled ?? false,
    featured: raw.featured ?? false,
    seo: {
      title: raw.seo?.title ?? null,
      description: raw.seo?.description ?? null,
      keywords: raw.seo?.keywords ?? null,
    },
    tags: (raw.tags ?? []).map((t: any) => ({ id: String(t.id), name: t.name, slug: t.slug })),
    requirements: raw.requirements ?? [],
    learningOutcomes: raw.learningOutcomes ?? [],
    targetAudience: raw.targetAudience ?? [],
    instructor: raw.instructor ? { id: String(raw.instructor.id), name: raw.instructor.name, avatar: raw.instructor.avatar ?? null } : null,
    category: raw.category ? { id: String(raw.category.id), name: raw.category.name, slug: raw.category.slug } : null,
    studentsCount: raw.studentsCount ?? 0,
    sectionsCount: raw.sectionsCount ?? 0,
    lessonsCount: raw.lessonsCount ?? 0,
    publishedAt: raw.publishedAt ?? null,
    archivedAt: raw.archivedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function buildListParams(params?: CourseFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.visibility && params.visibility !== "all") q.visibility = params.visibility;
  if (params.difficulty && params.difficulty !== "all") q.difficulty = params.difficulty;
  if (params.pricing_type && params.pricing_type !== "all") q.pricing_type = params.pricing_type;
  if (params.language && params.language !== "all") q.language = params.language;
  if (params.category_id && params.category_id !== "all") q.category_id = String(params.category_id);
  if (params.instructor_id && params.instructor_id !== "all") q.instructor_id = String(params.instructor_id);
  if (params.featured !== undefined && params.featured !== "all") q.featured = String(params.featured);
  if (params.date_from) q.date_from = params.date_from;
  if (params.date_to) q.date_to = params.date_to;
  if (params.sort) q.sort = params.sort;
  if (params.sort_dir) q.sort_dir = params.sort_dir;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);
  return q;
}

export const coursesService = {
  async list(params?: CourseFilterParams): Promise<{ data: Course[]; total: number }> {
    const { data } = await api.get("/courses", { params: buildListParams(params) });
    return {
      data: (data.data ?? []).map(formatCourse),
      total: data.total ?? 0,
    };
  },

  async getById(id: string): Promise<Course | null> {
    const { data } = await api.get(`/courses/${id}`);
    return data.data ? formatCourse(data.data) : null;
  },

  async getMetrics(): Promise<CourseMetricData> {
    const { data } = await api.get("/courses/metrics");
    return data.data;
  },

  async create(payload: CreateCoursePayload): Promise<Course> {
    const { data } = await api.post("/courses", {
      title: payload.title,
      subtitle: payload.subtitle,
      short_description: payload.shortDescription,
      description: payload.description,
      full_description: payload.fullDescription,
      thumbnail_path: payload.thumbnailPath,
      cover_image_path: payload.coverImagePath,
      visibility: payload.visibility,
      difficulty: payload.difficulty,
      language: payload.language,
      duration: payload.duration,
      pricing_type: payload.pricingType,
      price_amount: payload.price,
      price_currency: payload.currency,
      discount_price: payload.discountPrice,
      enrollment_limit: payload.enrollmentLimit,
      start_date: payload.startDate,
      end_date: payload.endDate,
      certificate_enabled: payload.certificateEnabled,
      seo_title: payload.seoTitle,
      seo_description: payload.seoDescription,
      seo_keywords: payload.seoKeywords,
      category_ids: payload.categoryIds,
      tag_ids: payload.tagIds,
      requirements: payload.requirements,
      learning_outcomes: payload.learningOutcomes,
      target_audience: payload.targetAudience,
    });
    return formatCourse(data.data);
  },

  async update(id: string, payload: UpdateCoursePayload): Promise<Course | null> {
    const body: Record<string, any> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.subtitle !== undefined) body.subtitle = payload.subtitle;
    if (payload.shortDescription !== undefined) body.short_description = payload.shortDescription;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.fullDescription !== undefined) body.full_description = payload.fullDescription;
    if (payload.thumbnailPath !== undefined) body.thumbnail_path = payload.thumbnailPath;
    if (payload.coverImagePath !== undefined) body.cover_image_path = payload.coverImagePath;
    if (payload.visibility !== undefined) body.visibility = payload.visibility;
    if (payload.difficulty !== undefined) body.difficulty = payload.difficulty;
    if (payload.language !== undefined) body.language = payload.language;
    if (payload.duration !== undefined) body.duration = payload.duration;
    if (payload.pricingType !== undefined) body.pricing_type = payload.pricingType;
    if (payload.price !== undefined) body.price_amount = payload.price;
    if (payload.currency !== undefined) body.price_currency = payload.currency;
    if (payload.discountPrice !== undefined) body.discount_price = payload.discountPrice;
    if (payload.enrollmentLimit !== undefined) body.enrollment_limit = payload.enrollmentLimit;
    if (payload.startDate !== undefined) body.start_date = payload.startDate;
    if (payload.endDate !== undefined) body.end_date = payload.endDate;
    if (payload.certificateEnabled !== undefined) body.certificate_enabled = payload.certificateEnabled;
    if (payload.featured !== undefined) body.featured = payload.featured;
    if (payload.seoTitle !== undefined) body.seo_title = payload.seoTitle;
    if (payload.seoDescription !== undefined) body.seo_description = payload.seoDescription;
    if (payload.seoKeywords !== undefined) body.seo_keywords = payload.seoKeywords;
    if (payload.categoryIds !== undefined) body.category_ids = payload.categoryIds;
    if (payload.tagIds !== undefined) body.tag_ids = payload.tagIds;
    if (payload.requirements !== undefined) body.requirements = payload.requirements;
    if (payload.learningOutcomes !== undefined) body.learning_outcomes = payload.learningOutcomes;
    if (payload.targetAudience !== undefined) body.target_audience = payload.targetAudience;

    const { data } = await api.put(`/courses/${id}`, body);
    return data.data ? formatCourse(data.data) : null;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/courses/${id}`);
  },

  async publish(id: string): Promise<Course | null> {
    const { data } = await api.patch(`/courses/${id}/publish`);
    return data.data ? formatCourse(data.data) : null;
  },

  async archive(id: string): Promise<Course | null> {
    const { data } = await api.patch(`/courses/${id}/archive`);
    return data.data ? formatCourse(data.data) : null;
  },

  async restore(id: string): Promise<Course | null> {
    const { data } = await api.post(`/courses/${id}/restore`);
    return data.data ? formatCourse(data.data) : null;
  },

  async duplicate(id: string): Promise<Course | null> {
    const { data } = await api.post(`/courses/${id}/duplicate`);
    return data.data ? formatCourse(data.data) : null;
  },

  async toggleFeature(id: string): Promise<Course | null> {
    const { data } = await api.post(`/courses/${id}/feature`);
    return data.data ? formatCourse(data.data) : null;
  },

  async exportCsv(): Promise<Blob> {
    const response = await api.get("/courses/export", { responseType: "blob" });
    return response.data;
  },
};
