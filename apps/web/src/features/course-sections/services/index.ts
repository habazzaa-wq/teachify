import { api } from "@/services/api";
import type { CourseSection, SectionFilterParams, SectionMetricData, CreateCourseSectionPayload, UpdateCourseSectionPayload } from "../types";

function formatSection(raw: any): CourseSection {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId),
    courseId: String(raw.courseId),
    courseModuleId: raw.courseModuleId ? String(raw.courseModuleId) : null,
    title: raw.title,
    slug: raw.slug ?? null,
    description: raw.description ?? null,
    order: raw.order ?? 0,
    durationMinutes: raw.durationMinutes ?? null,
    freePreview: raw.freePreview ?? false,
    status: raw.status ?? "draft",
    published: raw.published ?? false,
    locked: raw.locked ?? false,
    featured: raw.featured ?? false,
    color: raw.color ?? null,
    icon: raw.icon ?? null,
    notes: raw.notes ?? null,
    lessonsCount: raw.lessonsCount ?? 0,
    course: raw.course ? { id: String(raw.course.id), title: raw.course.title, slug: raw.course.slug } : null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function buildListParams(params?: SectionFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.course_id && params.course_id !== "all") q.course_id = String(params.course_id);
  if (params.course_module_id && params.course_module_id !== "all") q.course_module_id = String(params.course_module_id);
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.published !== undefined && params.published !== "all") q.published = String(params.published);
  if (params.locked !== undefined && params.locked !== "all") q.locked = String(params.locked);
  if (params.sort) q.sort = params.sort;
  if (params.sort_dir) q.sort_dir = params.sort_dir;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);
  return q;
}

export const sectionsService = {
  async list(courseId: string, params?: SectionFilterParams): Promise<{ data: CourseSection[]; total: number }> {
    const { data } = await api.get(`/courses/${courseId}/sections`, { params: buildListParams(params) });
    return {
      data: (data.data ?? []).map(formatSection),
      total: data.total ?? 0,
    };
  },

  async getById(courseId: string, id: string): Promise<CourseSection | null> {
    const { data } = await api.get(`/courses/${courseId}/sections/${id}`);
    return data.data ? formatSection(data.data) : null;
  },

  async getMetrics(courseId?: string): Promise<SectionMetricData> {
    const params: Record<string, string> = {};
    if (courseId) params.course_id = courseId;
    const { data } = await api.get("/sections/metrics", { params });
    return data.data;
  },

  async create(courseId: string, payload: CreateCourseSectionPayload): Promise<CourseSection> {
    const { data } = await api.post(`/courses/${courseId}/sections`, {
      title: payload.title,
      slug: payload.slug,
      description: payload.description,
      sort_order: payload.sort_order,
      duration_minutes: payload.duration_minutes,
      free_preview: payload.free_preview,
      locked: payload.locked,
      featured: payload.featured,
      color: payload.color,
      icon: payload.icon,
      notes: payload.notes,
    });
    return formatSection(data.data);
  },

  async update(courseId: string, id: string, payload: UpdateCourseSectionPayload): Promise<CourseSection | null> {
    const body: Record<string, any> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.slug !== undefined) body.slug = payload.slug;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.sort_order !== undefined) body.sort_order = payload.sort_order;
    if (payload.duration_minutes !== undefined) body.duration_minutes = payload.duration_minutes;
    if (payload.free_preview !== undefined) body.free_preview = payload.free_preview;
    if (payload.locked !== undefined) body.locked = payload.locked;
    if (payload.featured !== undefined) body.featured = payload.featured;
    if (payload.color !== undefined) body.color = payload.color;
    if (payload.icon !== undefined) body.icon = payload.icon;
    if (payload.notes !== undefined) body.notes = payload.notes;

    const { data } = await api.put(`/courses/${courseId}/sections/${id}`, body);
    return data.data ? formatSection(data.data) : null;
  },

  async delete(courseId: string, id: string): Promise<void> {
    await api.delete(`/courses/${courseId}/sections/${id}`);
  },

  async publish(courseId: string, id: string): Promise<CourseSection | null> {
    const { data } = await api.patch(`/courses/${courseId}/sections/${id}/publish`);
    return data.data ? formatSection(data.data) : null;
  },

  async unpublish(courseId: string, id: string): Promise<CourseSection | null> {
    const { data } = await api.patch(`/courses/${courseId}/sections/${id}/unpublish`);
    return data.data ? formatSection(data.data) : null;
  },

  async toggleLock(courseId: string, id: string): Promise<CourseSection | null> {
    const { data } = await api.post(`/courses/${courseId}/sections/${id}/lock`);
    return data.data ? formatSection(data.data) : null;
  },

  async toggleFeature(courseId: string, id: string): Promise<CourseSection | null> {
    const { data } = await api.post(`/courses/${courseId}/sections/${id}/feature`);
    return data.data ? formatSection(data.data) : null;
  },

  async archive(courseId: string, id: string): Promise<CourseSection | null> {
    const { data } = await api.patch(`/courses/${courseId}/sections/${id}/archive`);
    return data.data ? formatSection(data.data) : null;
  },

  async restore(courseId: string, id: string): Promise<CourseSection | null> {
    const { data } = await api.post(`/courses/${courseId}/sections/${id}/restore`);
    return data.data ? formatSection(data.data) : null;
  },

  async duplicate(courseId: string, id: string): Promise<CourseSection | null> {
    const { data } = await api.post(`/courses/${courseId}/sections/${id}/duplicate`);
    return data.data ? formatSection(data.data) : null;
  },

  async reorder(courseId: string, sections: Array<{ id: number; sort_order: number }>): Promise<void> {
    await api.post(`/courses/${courseId}/sections/reorder`, { sections });
  },

  async exportCsv(courseId: string): Promise<Blob> {
    const response = await api.get(`/courses/${courseId}/sections/export`, { responseType: "blob" });
    return response.data;
  },
};
