import type { StageItem } from "@/features/homepage/educational-stages/types";

export interface CatalogCourse {
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

export interface CatalogTeacher {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string | null;
  coursesCount: number;
}

export interface CatalogSubject {
  id: string;
  name: string;
  coursesCount: number;
}

export interface CatalogAggregates {
  coursesCount: number;
  teachersCount: number;
  subjects: CatalogSubject[];
  teachers: CatalogTeacher[];
}

export interface CatalogCoursesResponse {
  data: CatalogCourse[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  aggregates: CatalogAggregates;
}

export type CatalogPricingFilter = "all" | "free" | "paid";
export type CatalogSort =
  | "newest"
  | "popular"
  | "alphabetical"
  | "price_asc"
  | "price_desc";

export interface CatalogFilters {
  search?: string;
  stageId?: string;
  subjectId?: string;
  teacherId?: string;
  pricing?: CatalogPricingFilter;
  sort?: CatalogSort;
}

export type { StageItem };
