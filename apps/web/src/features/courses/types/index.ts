export type CourseStatus = "draft" | "review" | "published" | "scheduled" | "archived";
export type CourseVisibility = "private" | "public" | "unlisted";
export type CourseDifficulty = "beginner" | "intermediate" | "advanced" | "all_levels";
export type PricingType = "free" | "one_time" | "subscription";

export interface Course {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  subtitle: string | null;
  shortDescription: string | null;
  description: string | null;
  fullDescription: string | null;
  thumbnail: string | null;
  coverImage: string | null;
  status: CourseStatus;
  visibility: CourseVisibility;
  difficulty: CourseDifficulty;
  language: string;
  duration: number | null;
  pricingType: PricingType;
  price: number | null;
  currency: string | null;
  discountPrice: number | null;
  enrollmentLimit: number | null;
  startDate: string | null;
  endDate: string | null;
  certificateEnabled: boolean;
  featured: boolean;
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
  };
  tags: Array<{ id: string; name: string; slug: string }>;
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  educationalStage: {
    id: string;
    name: string;
  } | null;
  subject: {
    id: string;
    name: string;
  } | null;
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  studentsCount: number;
  sectionsCount: number;
  lessonsCount: number;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoursePayload {
  title: string;
  subtitle?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  fullDescription?: string | null;
  thumbnailPath?: string | null;
  coverImagePath?: string | null;
  visibility?: CourseVisibility;
  difficulty?: CourseDifficulty;
  language?: string;
  duration?: number | null;
  pricingType?: PricingType;
  price?: number | null;
  currency?: string | null;
  discountPrice?: number | null;
  enrollmentLimit?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  certificateEnabled?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  educationalStageId?: number | null;
  subjectId?: number | null;
  categoryIds?: number[];
  tagIds?: number[];
  requirements?: string[];
  learningOutcomes?: string[];
  targetAudience?: string[];
}

export interface UpdateCoursePayload {
  title?: string;
  subtitle?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  fullDescription?: string | null;
  thumbnailPath?: string | null;
  coverImagePath?: string | null;
  visibility?: CourseVisibility;
  difficulty?: CourseDifficulty;
  language?: string;
  duration?: number | null;
  pricingType?: PricingType;
  price?: number | null;
  currency?: string | null;
  discountPrice?: number | null;
  enrollmentLimit?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  certificateEnabled?: boolean;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  educationalStageId?: number | null;
  subjectId?: number | null;
  categoryIds?: number[];
  tagIds?: number[];
  requirements?: string[];
  learningOutcomes?: string[];
  targetAudience?: string[];
}

export interface CourseFilterParams {
  search?: string;
  status?: CourseStatus | "all";
  visibility?: CourseVisibility | "all";
  difficulty?: CourseDifficulty | "all";
  category_id?: number | "all";
  instructor_id?: number | "all";
  language?: string | "all";
  pricing_type?: PricingType | "all";
  featured?: boolean | "all";
  date_from?: string;
  date_to?: string;
  sort?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface CourseMetricData {
  totalCourses: number;
  published: number;
  draft: number;
  archived: number;
  revenue: number;
  enrollments: number;
  avgRating: number;
  completionRate: number;
  featured: number;
  totalSections: number;
}

export interface CourseActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}
