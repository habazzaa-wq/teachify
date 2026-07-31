import type { StageItem } from "@/features/homepage/educational-stages/types";

export interface StageCourse {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  shortDescription: string | null;
  thumbnail: string | null;
  coverImage: string | null;
  difficulty: string;
  language: string | null;
  duration: number | null;
  pricingType: string;
  price: number | null;
  currency: string | null;
  discountPrice: number | null;
  certificateEnabled: boolean;
  featured: boolean;
  instructor: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
  educationalStage: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
  category: { id: string; name: string; slug: string } | null;
  studentsCount: number;
  sectionsCount: number;
  lessonsCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export interface StageTeacher {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string | null;
  coursesCount: number;
}

export interface StageSubject {
  id: string;
  name: string;
  coursesCount: number;
}

export interface StageAggregates {
  coursesCount: number;
  teachersCount: number;
  subjects: StageSubject[];
  teachers: StageTeacher[];
}

export interface StageCoursesResponse {
  data: StageCourse[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  aggregates: StageAggregates;
}

export type StagePricingFilter = "all" | "free" | "paid";
export type StageSort = "newest" | "popular" | "alphabetical";

export interface StageCourseFilters {
  search?: string;
  subjectId?: string;
  teacherId?: string;
  pricing?: StagePricingFilter;
  sort?: StageSort;
}

export function isStageItem(value: unknown): value is StageItem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StageItem).id === "number" &&
    typeof (value as StageItem).name === "string"
  );
}
