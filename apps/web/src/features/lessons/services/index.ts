import { api } from "@/services/api";
import type { Lesson, LessonFilterParams, LessonMetricData, CreateLessonPayload, UpdateLessonPayload } from "../types";

function formatLesson(raw: any): Lesson {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId),
    courseId: String(raw.courseId),
    sectionId: String(raw.sectionId),
    title: raw.title,
    slug: raw.slug,
    shortDescription: raw.shortDescription ?? null,
    description: raw.description ?? null,
    order: raw.order ?? 0,
    lessonType: raw.lessonType ?? "video",
    status: raw.status ?? "draft",
    visibility: raw.visibility ?? "private",
    durationSeconds: raw.durationSeconds ?? null,
    estimatedDuration: raw.estimatedDuration ?? null,
    freePreview: raw.freePreview ?? false,
    downloadable: raw.downloadable ?? false,
    featured: raw.featured ?? false,
    commentsEnabled: raw.commentsEnabled ?? true,
    notes: raw.notes ?? null,
    color: raw.color ?? null,
    icon: raw.icon ?? null,
    examId: raw.examId != null ? String(raw.examId) : null,
    publishedAt: raw.publishedAt ?? null,
    course: raw.course ? { id: String(raw.course.id), title: raw.course.title, slug: raw.course.slug } : null,
    section: raw.section ? { id: String(raw.section.id), title: raw.section.title, slug: raw.section.slug } : null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function buildListParams(params?: LessonFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.course_id && params.course_id !== "all") q.course_id = String(params.course_id);
  if (params.section_id && params.section_id !== "all") q.section_id = String(params.section_id);
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.visibility && params.visibility !== "all") q.visibility = params.visibility;
  if (params.lesson_type && params.lesson_type !== "all") q.lesson_type = params.lesson_type;
  if (params.featured !== undefined && params.featured !== "all") q.featured = String(params.featured);
  if (params.free_preview !== undefined && params.free_preview !== "all") q.free_preview = String(params.free_preview);
  if (params.sort) q.sort = params.sort;
  if (params.sort_dir) q.sort_dir = params.sort_dir;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);
  return q;
}

export const lessonsService = {
  async list(courseId: string, sectionId: string, params?: LessonFilterParams): Promise<{ data: Lesson[]; total: number }> {
    const { data } = await api.get(`/courses/${courseId}/sections/${sectionId}/lessons`, { params: buildListParams(params) });
    return {
      data: (data.data ?? []).map(formatLesson),
      total: data.total ?? 0,
    };
  },

  async getById(courseId: string, sectionId: string, id: string): Promise<Lesson | null> {
    const { data } = await api.get(`/courses/${courseId}/sections/${sectionId}/lessons/${id}`);
    return data.data ? formatLesson(data.data) : null;
  },

  async getMetrics(courseId?: string, sectionId?: string): Promise<LessonMetricData> {
    const params: Record<string, string> = {};
    if (courseId) params.course_id = courseId;
    if (sectionId) params.section_id = sectionId;
    const { data } = await api.get("/lessons/metrics", { params });
    return data.data;
  },

  async create(courseId: string, sectionId: string, payload: CreateLessonPayload): Promise<Lesson> {
    const { data } = await api.post(`/courses/${courseId}/sections/${sectionId}/lessons`, {
      title: payload.title,
      slug: payload.slug,
      short_description: payload.short_description,
      description: payload.description,
      lesson_type: payload.lesson_type,
      status: payload.status,
      visibility: payload.visibility,
      sort_order: payload.sort_order,
      duration_seconds: payload.duration_seconds,
      estimated_duration: payload.estimated_duration,
      free_preview: payload.free_preview,
      downloadable: payload.downloadable,
      featured: payload.featured,
      comments_enabled: payload.comments_enabled,
      notes: payload.notes,
      color: payload.color,
      icon: payload.icon,
      exam_id: payload.exam_id,
    });
    return formatLesson(data.data);
  },

  async update(courseId: string, sectionId: string, id: string, payload: UpdateLessonPayload): Promise<Lesson | null> {
    const body: Record<string, any> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.slug !== undefined) body.slug = payload.slug;
    if (payload.short_description !== undefined) body.short_description = payload.short_description;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.lesson_type !== undefined) body.lesson_type = payload.lesson_type;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.visibility !== undefined) body.visibility = payload.visibility;
    if (payload.sort_order !== undefined) body.sort_order = payload.sort_order;
    if (payload.duration_seconds !== undefined) body.duration_seconds = payload.duration_seconds;
    if (payload.estimated_duration !== undefined) body.estimated_duration = payload.estimated_duration;
    if (payload.free_preview !== undefined) body.free_preview = payload.free_preview;
    if (payload.downloadable !== undefined) body.downloadable = payload.downloadable;
    if (payload.featured !== undefined) body.featured = payload.featured;
    if (payload.comments_enabled !== undefined) body.comments_enabled = payload.comments_enabled;
    if (payload.notes !== undefined) body.notes = payload.notes;
    if (payload.color !== undefined) body.color = payload.color;
    if (payload.icon !== undefined) body.icon = payload.icon;
    if (payload.exam_id !== undefined) body.exam_id = payload.exam_id;

    const { data } = await api.put(`/courses/${courseId}/sections/${sectionId}/lessons/${id}`, body);
    return data.data ? formatLesson(data.data) : null;
  },

  async delete(courseId: string, sectionId: string, id: string): Promise<void> {
    await api.delete(`/courses/${courseId}/sections/${sectionId}/lessons/${id}`);
  },

  async publish(courseId: string, sectionId: string, id: string): Promise<Lesson | null> {
    const { data } = await api.patch(`/courses/${courseId}/sections/${sectionId}/lessons/${id}/publish`);
    return data.data ? formatLesson(data.data) : null;
  },

  async attachVideo(courseId: string, sectionId: string, id: string, mediaAssetId: number): Promise<void> {
    await api.post(`/courses/${courseId}/sections/${sectionId}/lessons/${id}/video`, {
      media_asset_id: mediaAssetId,
    });
  },

  async attachFile(courseId: string, sectionId: string, id: string, mediaAssetId: number, title: string): Promise<void> {
    await api.post(`/courses/${courseId}/sections/${sectionId}/lessons/${id}/files`, {
      media_asset_id: mediaAssetId,
      title,
    });
  },

  async archive(courseId: string, sectionId: string, id: string): Promise<Lesson | null> {
    const { data } = await api.patch(`/courses/${courseId}/sections/${sectionId}/lessons/${id}/archive`);
    return data.data ? formatLesson(data.data) : null;
  },

  async toggleFeature(courseId: string, sectionId: string, id: string): Promise<Lesson | null> {
    const { data } = await api.post(`/courses/${courseId}/sections/${sectionId}/lessons/${id}/feature`);
    return data.data ? formatLesson(data.data) : null;
  },

  async toggleFreePreview(courseId: string, sectionId: string, id: string): Promise<Lesson | null> {
    const { data } = await api.post(`/courses/${courseId}/sections/${sectionId}/lessons/${id}/free-preview`);
    return data.data ? formatLesson(data.data) : null;
  },

  async restore(courseId: string, sectionId: string, id: string): Promise<Lesson | null> {
    const { data } = await api.post(`/courses/${courseId}/sections/${sectionId}/lessons/${id}/restore`);
    return data.data ? formatLesson(data.data) : null;
  },

  async duplicate(courseId: string, sectionId: string, id: string): Promise<Lesson | null> {
    const { data } = await api.post(`/courses/${courseId}/sections/${sectionId}/lessons/${id}/duplicate`);
    return data.data ? formatLesson(data.data) : null;
  },

  async reorder(courseId: string, sectionId: string, lessons: Array<{ id: number; sort_order: number }>): Promise<void> {
    await api.post(`/courses/${courseId}/sections/${sectionId}/lessons/reorder`, { lessons });
  },

  async move(courseId: string, sectionId: string, id: string, targetSectionId: number, sortOrder?: number): Promise<Lesson | null> {
    const { data } = await api.post(`/courses/${courseId}/sections/${sectionId}/lessons/${id}/move`, {
      course_section_id: targetSectionId,
      sort_order: sortOrder,
    });
    return data.data ? formatLesson(data.data) : null;
  },

  async exportCsv(courseId: string, sectionId: string): Promise<Blob> {
    const response = await api.get(`/courses/${courseId}/sections/${sectionId}/lessons/export`, { responseType: "blob" });
    return response.data;
  },
};
