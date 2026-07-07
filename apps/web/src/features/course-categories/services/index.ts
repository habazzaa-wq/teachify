import { api } from "@/services/api";
import type { Category, CategoryFilterParams, CategoryMetricData, CreateCategoryPayload, UpdateCategoryPayload } from "../types";

function formatCategory(raw: any): Category {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId),
    parentId: raw.parentId ? String(raw.parentId) : null,
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? null,
    thumbnail: raw.thumbnail ?? null,
    icon: raw.icon ?? null,
    color: raw.color ?? null,
    sortOrder: raw.sortOrder ?? 0,
    featured: raw.featured ?? false,
    active: raw.active ?? true,
    seo: {
      title: raw.seo?.title ?? null,
      description: raw.seo?.description ?? null,
      keywords: raw.seo?.keywords ?? null,
    },
    parent: raw.parent ? { id: String(raw.parent.id), name: raw.parent.name, slug: raw.parent.slug } : null,
    children: (raw.children ?? []).map((c: any) => ({
      id: String(c.id),
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder ?? 0,
      coursesCount: c.coursesCount ?? 0,
    })),
    coursesCount: raw.coursesCount ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function buildListParams(params?: CategoryFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.featured !== undefined && params.featured !== "all") q.featured = String(params.featured);
  if (params.parent_id !== undefined && params.parent_id !== "all") q.parent_id = String(params.parent_id);
  if (params.has_courses !== undefined && params.has_courses !== "all") q.has_courses = String(params.has_courses);
  if (params.date_from) q.date_from = params.date_from;
  if (params.date_to) q.date_to = params.date_to;
  if (params.sort) q.sort = params.sort;
  if (params.sort_dir) q.sort_dir = params.sort_dir;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);
  return q;
}

export const categoriesService = {
  async list(params?: CategoryFilterParams): Promise<{ data: Category[]; total: number }> {
    const { data } = await api.get("/categories", { params: buildListParams(params) });
    return {
      data: (data.data ?? []).map(formatCategory),
      total: data.total ?? 0,
    };
  },

  async getTree(): Promise<Category[]> {
    const { data } = await api.get("/categories/tree");
    return (data.data ?? []).map(formatCategory);
  },

  async getById(id: string): Promise<Category | null> {
    const { data } = await api.get(`/categories/${id}`);
    return data.data ? formatCategory(data.data) : null;
  },

  async getMetrics(): Promise<CategoryMetricData> {
    const { data } = await api.get("/categories/metrics");
    return data.data;
  },

  async create(payload: CreateCategoryPayload): Promise<Category> {
    const { data } = await api.post("/categories", {
      name: payload.name,
      slug: payload.slug,
      parent_id: payload.parentId,
      description: payload.description,
      thumbnail_path: payload.thumbnailPath,
      icon: payload.icon,
      color: payload.color,
      sort_order: payload.sortOrder,
      featured: payload.featured,
      active: payload.active,
      seo_title: payload.seoTitle,
      seo_description: payload.seoDescription,
      seo_keywords: payload.seoKeywords,
    });
    return formatCategory(data.data);
  },

  async update(id: string, payload: UpdateCategoryPayload): Promise<Category | null> {
    const body: Record<string, any> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.slug !== undefined) body.slug = payload.slug;
    if (payload.parentId !== undefined) body.parent_id = payload.parentId;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.thumbnailPath !== undefined) body.thumbnail_path = payload.thumbnailPath;
    if (payload.icon !== undefined) body.icon = payload.icon;
    if (payload.color !== undefined) body.color = payload.color;
    if (payload.sortOrder !== undefined) body.sort_order = payload.sortOrder;
    if (payload.featured !== undefined) body.featured = payload.featured;
    if (payload.active !== undefined) body.active = payload.active;
    if (payload.seoTitle !== undefined) body.seo_title = payload.seoTitle;
    if (payload.seoDescription !== undefined) body.seo_description = payload.seoDescription;
    if (payload.seoKeywords !== undefined) body.seo_keywords = payload.seoKeywords;

    const { data } = await api.put(`/categories/${id}`, body);
    return data.data ? formatCategory(data.data) : null;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  async restore(id: string): Promise<Category | null> {
    const { data } = await api.post(`/categories/${id}/restore`);
    return data.data ? formatCategory(data.data) : null;
  },

  async forceDelete(id: string): Promise<void> {
    await api.post(`/categories/${id}/force-delete`);
  },

  async duplicate(id: string): Promise<Category | null> {
    const { data } = await api.post(`/categories/${id}/duplicate`);
    return data.data ? formatCategory(data.data) : null;
  },

  async toggleFeatured(id: string): Promise<Category | null> {
    const { data } = await api.post(`/categories/${id}/feature`);
    return data.data ? formatCategory(data.data) : null;
  },

  async toggleActive(id: string): Promise<Category | null> {
    const { data } = await api.post(`/categories/${id}/activate`);
    return data.data ? formatCategory(data.data) : null;
  },

  async exportCsv(): Promise<Blob> {
    const response = await api.get("/categories/export", { responseType: "blob" });
    return response.data;
  },
};