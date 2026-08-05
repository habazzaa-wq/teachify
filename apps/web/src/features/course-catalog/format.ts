import type {
  CatalogAggregates,
  CatalogCourse,
  CatalogCoursesResponse,
  CatalogSubject,
  CatalogTeacher,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>;

export function formatCatalogCourse(raw: Raw): CatalogCourse {
  return {
    id: String(raw.id),
    title: raw.title,
    slug: raw.slug,
    subtitle: raw.subtitle ?? null,
    shortDescription: raw.shortDescription ?? null,
    thumbnail: raw.thumbnail ?? null,
    coverImage: raw.coverImage ?? null,
    difficulty: raw.difficulty ?? "beginner",
    language: raw.language ?? null,
    duration: raw.duration ?? null,
    pricingType: raw.pricingType ?? "free",
    price: raw.price ?? null,
    currency: raw.currency ?? null,
    discountPrice: raw.discountPrice ?? null,
    certificateEnabled: raw.certificateEnabled ?? false,
    featured: raw.featured ?? false,
    instructor: raw.instructor
      ? {
          id: String(raw.instructor.id),
          name: raw.instructor.name ?? null,
          avatar: raw.instructor.avatar ?? null,
        }
      : null,
    educationalStage: raw.educationalStage
      ? { id: String(raw.educationalStage.id), name: raw.educationalStage.name }
      : null,
    subject: raw.subject
      ? { id: String(raw.subject.id), name: raw.subject.name }
      : null,
    category: raw.category
      ? {
          id: String(raw.category.id),
          name: raw.category.name,
          slug: raw.category.slug,
        }
      : null,
    studentsCount: raw.studentsCount ?? 0,
    sectionsCount: raw.sectionsCount ?? 0,
    lessonsCount: raw.lessonsCount ?? 0,
    publishedAt: raw.publishedAt ?? null,
    createdAt: raw.createdAt,
  };
}

function formatTeacher(raw: Raw): CatalogTeacher {
  return {
    id: String(raw.id),
    name: raw.name ?? "مدرس",
    avatar: raw.avatar ?? null,
    specialization: raw.specialization ?? null,
    coursesCount: raw.coursesCount ?? 0,
  };
}

function formatSubject(raw: Raw): CatalogSubject {
  return {
    id: String(raw.id),
    name: raw.name ?? "مادة",
    coursesCount: raw.coursesCount ?? 0,
  };
}

function formatAggregates(raw: Raw | undefined): CatalogAggregates {
  const aggregates = raw ?? {};
  return {
    coursesCount: aggregates.coursesCount ?? 0,
    teachersCount: aggregates.teachersCount ?? 0,
    subjects: (aggregates.subjects ?? []).map(formatSubject),
    teachers: (aggregates.teachers ?? []).map(formatTeacher),
  };
}

export function formatCatalogCoursesResponse(raw: Raw): CatalogCoursesResponse {
  return {
    data: (raw.data ?? []).map(formatCatalogCourse),
    total: raw.total ?? 0,
    perPage: raw.per_page ?? 12,
    currentPage: raw.current_page ?? 1,
    lastPage: raw.last_page ?? 1,
    aggregates: formatAggregates(raw.aggregates),
  };
}
