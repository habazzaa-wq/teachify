export type ModuleStatus = "draft" | "published" | "archived";

export interface CourseModule {
  id: string;
  tenantId: string;
  courseId: string;
  title: string;
  slug: string | null;
  description: string | null;
  order: number;
  status: ModuleStatus;
  published: boolean;
  featured: boolean;
  estimatedDuration: number | null;
  color: string | null;
  icon: string | null;
  notes: string | null;
  sectionsCount: number;
  publishedAt: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCourseModulePayload {
  title: string;
  slug?: string;
  description?: string | null;
  order?: number;
  estimated_duration?: number | null;
  featured?: boolean;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
}

export interface UpdateCourseModulePayload {
  title?: string;
  slug?: string;
  description?: string | null;
  order?: number;
  estimated_duration?: number | null;
  featured?: boolean;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
}

export interface ModuleFilterParams {
  search?: string;
  course_id?: number | "all";
  status?: ModuleStatus | "all";
  featured?: boolean | "all";
  sort?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface ModuleMetricData {
  totalModules: number;
  published: number;
  draft: number;
  featured: number;
  avgDuration: number;
  totalSections: number;
}

export interface ModuleActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}
