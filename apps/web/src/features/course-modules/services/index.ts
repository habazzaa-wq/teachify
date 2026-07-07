import { api } from "@/services/api";
import type { CourseModule, ModuleFilterParams, ModuleMetricData, CreateCourseModulePayload, UpdateCourseModulePayload } from "../types";

function formatModule(raw: any): CourseModule {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId),
    courseId: String(raw.courseId),
    title: raw.title,
    slug: raw.slug ?? null,
    description: raw.description ?? null,
    order: raw.order ?? 0,
    status: raw.status ?? "draft",
    published: raw.published ?? false,
    featured: raw.featured ?? false,
    estimatedDuration: raw.estimatedDuration ?? null,
    color: raw.color ?? null,
    icon: raw.icon ?? null,
    notes: raw.notes ?? null,
    sectionsCount: raw.sectionsCount ?? 0,
    publishedAt: raw.publishedAt ?? null,
    course: raw.course ? { id: String(raw.course.id), title: raw.course.title, slug: raw.course.slug } : null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function buildListParams(params?: ModuleFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.course_id && params.course_id !== "all") q.course_id = String(params.course_id);
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.featured !== undefined && params.featured !== "all") q.featured = String(params.featured);
  if (params.sort) q.sort = params.sort;
  if (params.sort_dir) q.sort_dir = params.sort_dir;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);
  return q;
}

export const modulesService = {
  async list(courseId: string, params?: ModuleFilterParams): Promise<{ data: CourseModule[]; total: number }> {
    const { data } = await api.get(`/courses/${courseId}/modules`, { params: buildListParams(params) });
    return {
      data: (data.data ?? []).map(formatModule),
      total: data.total ?? 0,
    };
  },

  async getById(courseId: string, id: string): Promise<CourseModule | null> {
    const { data } = await api.get(`/courses/${courseId}/modules/${id}`);
    return data.data ? formatModule(data.data) : null;
  },

  async getMetrics(courseId?: string): Promise<ModuleMetricData> {
    const params: Record<string, string> = {};
    if (courseId) params.course_id = courseId;
    const { data } = await api.get("/modules/metrics", { params });
    return data.data;
  },

  async create(courseId: string, payload: CreateCourseModulePayload): Promise<CourseModule> {
    const { data } = await api.post(`/courses/${courseId}/modules`, {
      title: payload.title,
      slug: payload.slug,
      description: payload.description,
      order: payload.order,
      estimated_duration: payload.estimated_duration,
      featured: payload.featured,
      color: payload.color,
      icon: payload.icon,
      notes: payload.notes,
    });
    return formatModule(data.data);
  },

  async update(courseId: string, id: string, payload: UpdateCourseModulePayload): Promise<CourseModule | null> {
    const body: Record<string, any> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.slug !== undefined) body.slug = payload.slug;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.order !== undefined) body.order = payload.order;
    if (payload.estimated_duration !== undefined) body.estimated_duration = payload.estimated_duration;
    if (payload.featured !== undefined) body.featured = payload.featured;
    if (payload.color !== undefined) body.color = payload.color;
    if (payload.icon !== undefined) body.icon = payload.icon;
    if (payload.notes !== undefined) body.notes = payload.notes;

    const { data } = await api.put(`/courses/${courseId}/modules/${id}`, body);
    return data.data ? formatModule(data.data) : null;
  },

  async delete(courseId: string, id: string): Promise<void> {
    await api.delete(`/courses/${courseId}/modules/${id}`);
  },

  async publish(courseId: string, id: string): Promise<CourseModule | null> {
    const { data } = await api.patch(`/courses/${courseId}/modules/${id}/publish`);
    return data.data ? formatModule(data.data) : null;
  },

  async archive(courseId: string, id: string): Promise<CourseModule | null> {
    const { data } = await api.patch(`/courses/${courseId}/modules/${id}/archive`);
    return data.data ? formatModule(data.data) : null;
  },

  async toggleFeature(courseId: string, id: string): Promise<CourseModule | null> {
    const { data } = await api.post(`/courses/${courseId}/modules/${id}/feature`);
    return data.data ? formatModule(data.data) : null;
  },

  async restore(courseId: string, id: string): Promise<CourseModule | null> {
    const { data } = await api.post(`/courses/${courseId}/modules/${id}/restore`);
    return data.data ? formatModule(data.data) : null;
  },

  async duplicate(courseId: string, id: string): Promise<CourseModule | null> {
    const { data } = await api.post(`/courses/${courseId}/modules/${id}/duplicate`);
    return data.data ? formatModule(data.data) : null;
  },

  async reorder(courseId: string, modules: Array<{ id: number; order: number }>): Promise<void> {
    await api.post(`/courses/${courseId}/modules/reorder`, { modules });
  },

  async exportCsv(courseId: string): Promise<Blob> {
    const response = await api.get(`/courses/${courseId}/modules/export`, { responseType: "blob" });
    return response.data;
  },
};
