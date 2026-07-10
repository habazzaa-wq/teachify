export type LessonStatus = "draft" | "review" | "published" | "scheduled" | "archived";
export type LessonVisibility = "private" | "preview" | "public";
export type LessonType = "video" | "text" | "pdf" | "external" | "live";
export type LessonSort = "title" | "sort_order" | "status" | "visibility" | "lesson_type" | "duration_seconds" | "estimated_duration" | "free_preview" | "featured" | "created_at" | "updated_at";

export interface Lesson {
  id: string;
  tenantId: string;
  courseId: string;
  sectionId: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  order: number;
  lessonType: LessonType;
  status: LessonStatus;
  visibility: LessonVisibility;
  durationSeconds: number | null;
  estimatedDuration: number | null;
  freePreview: boolean;
  downloadable: boolean;
  featured: boolean;
  commentsEnabled: boolean;
  notes: string | null;
  color: string | null;
  icon: string | null;
  publishedAt: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
  } | null;
  section: {
    id: string;
    title: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateLessonPayload {
  title: string;
  slug?: string;
  short_description?: string | null;
  description?: string | null;
  lesson_type: LessonType;
  status?: LessonStatus;
  visibility?: LessonVisibility;
  sort_order?: number;
  duration_seconds?: number | null;
  estimated_duration?: number | null;
  free_preview?: boolean;
  downloadable?: boolean;
  featured?: boolean;
  comments_enabled?: boolean;
  notes?: string | null;
  color?: string | null;
  icon?: string | null;
  exam_id?: number | null;
}

export interface UpdateLessonPayload {
  title?: string;
  slug?: string;
  short_description?: string | null;
  description?: string | null;
  lesson_type?: LessonType;
  status?: LessonStatus;
  visibility?: LessonVisibility;
  sort_order?: number;
  duration_seconds?: number | null;
  estimated_duration?: number | null;
  free_preview?: boolean;
  downloadable?: boolean;
  featured?: boolean;
  comments_enabled?: boolean;
  notes?: string | null;
  color?: string | null;
  icon?: string | null;
  exam_id?: number | null;
}

export interface LessonFilterParams {
  search?: string;
  course_id?: number | "all";
  section_id?: number | "all";
  status?: LessonStatus | "all";
  visibility?: LessonVisibility | "all";
  lesson_type?: LessonType | "all";
  featured?: boolean | "all";
  free_preview?: boolean | "all";
  sort?: LessonSort;
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface LessonMetricData {
  totalLessons: number;
  published: number;
  draft: number;
  archived: number;
  freePreview: number;
  featured: number;
  avgDuration: number;
}

export interface LessonActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}
