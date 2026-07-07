export type CategoryStatus = "active" | "inactive";
export type CategorySort = "name" | "slug" | "sort_order" | "featured" | "active" | "created_at" | "updated_at";

export interface Category {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  featured: boolean;
  active: boolean;
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
  };
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    coursesCount: number;
    active: boolean;
    featured: boolean;
  }>;
  coursesCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  parentId?: number | null;
  description?: string | null;
  thumbnailPath?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder?: number;
  featured?: boolean;
  active?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  parentId?: number | null;
  description?: string | null;
  thumbnailPath?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder?: number;
  featured?: boolean;
  active?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
}

export interface CategoryFilterParams {
  search?: string;
  status?: CategoryStatus | "all";
  featured?: boolean | "all";
  parent_id?: number | "all" | "none" | "has";
  has_courses?: boolean | "all";
  date_from?: string;
  date_to?: string;
  sort?: CategorySort;
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface CategoryMetricData {
  totalCategories: number;
  active: number;
  inactive: number;
  featured: number;
  parentCategories: number;
  childCategories: number;
  coursesCount: number;
  emptyCategories: number;
}

export interface CategoryActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}