export type SectionStatus = "draft" | "published" | "archived";

export interface CourseSection {
  id: string;
  tenantId: string;
  courseId: string;
  courseModuleId: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  order: number;
  durationMinutes: number | null;
  freePreview: boolean;
  status: SectionStatus;
  published: boolean;
  locked: boolean;
  featured: boolean;
  color: string | null;
  icon: string | null;
  notes: string | null;
  lessonsCount: number;
  course: {
    id: string;
    title: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCourseSectionPayload {
  title: string;
  slug?: string;
  description?: string | null;
  course_module_id?: string | null;
  sort_order?: number;
  duration_minutes?: number | null;
  free_preview?: boolean;
  locked?: boolean;
  featured?: boolean;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
}

export interface UpdateCourseSectionPayload {
  title?: string;
  slug?: string;
  description?: string | null;
  sort_order?: number;
  duration_minutes?: number | null;
  free_preview?: boolean;
  locked?: boolean;
  featured?: boolean;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
}

export interface SectionFilterParams {
  search?: string;
  course_id?: number | "all";
  course_module_id?: string | "null" | "all";
  status?: SectionStatus | "all";
  published?: boolean | "all";
  locked?: boolean | "all";
  sort?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface SectionMetricData {
  totalSections: number;
  published: number;
  draft: number;
  locked: number;
  freePreview: number;
  avgDuration: number;
  totalLessons: number;
}

export interface SectionActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}
