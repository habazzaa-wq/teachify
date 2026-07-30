import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import type { PublicCourse, PublicCourseModule, EnrollmentCheck, RelatedCourse } from "./types";

// Raw API response shape (untyped from Laravel)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/**
 * Server-side fetch helper that reads tenant headers from the incoming request
 * and forwards them to the Laravel API. This is needed because Zustand stores
 * (used by the browser axios interceptor) don't work in Server Components.
 */
async function serverFetch<T>(path: string): Promise<T> {
  const h = await headers();
  const tenantId = h.get("x-tenant-id") ?? "";
  const tenantDomain = h.get("x-tenant-domain") ?? "";

  const url = `${resolveApiBaseUrl()}${path}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
      ...(tenantDomain ? { "X-Tenant-Domain": tenantDomain } : {}),
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  return res.json();
}

function formatCourse(raw: Raw): PublicCourse {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? ""),
    title: raw.title,
    slug: raw.slug,
    subtitle: raw.subtitle ?? null,
    shortDescription: raw.shortDescription ?? null,
    description: raw.description ?? null,
    fullDescription: raw.fullDescription ?? null,
    thumbnail: raw.thumbnail ?? null,
    coverImage: raw.coverImage ?? null,
    status: raw.status ?? "draft",
    visibility: raw.visibility ?? "private",
    difficulty: raw.difficulty ?? "beginner",
    language: raw.language ?? "ar",
    duration: raw.duration ?? null,
    pricingType: raw.pricingType ?? "free",
    price: raw.price ?? null,
    currency: raw.currency ?? null,
    discountPrice: raw.discountPrice ?? null,
    enrollmentLimit: raw.enrollmentLimit ?? null,
    startDate: raw.startDate ?? null,
    endDate: raw.endDate ?? null,
    certificateEnabled: raw.certificateEnabled ?? false,
    featured: raw.featured ?? false,
    seo: {
      title: raw.seo?.title ?? null,
      description: raw.seo?.description ?? null,
      keywords: raw.seo?.keywords ?? null,
    },
    tags: (raw.tags ?? []).map((t: Raw) => ({
      id: String(t.id),
      name: t.name,
      slug: t.slug,
    })),
    requirements: raw.requirements ?? [],
    learningOutcomes: raw.learningOutcomes ?? [],
    targetAudience: raw.targetAudience ?? [],
    instructor: raw.instructor
      ? {
          id: String(raw.instructor.id),
          name: raw.instructor.name,
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
    archivedAt: raw.archivedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function formatModule(raw: Raw): PublicCourseModule {
  return {
    id: String(raw.id),
    title: raw.title,
    description: raw.description ?? null,
    order: raw.order,
    status: raw.status ?? "draft",
    estimatedDuration: raw.estimatedDuration ?? null,
    sectionsCount: raw.sectionsCount ?? 0,
    sections: (raw.sections ?? []).map(formatSection),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function formatSection(raw: Raw): { id: string; title: string; description: string | null; order: number; durationMinutes: number | null; freePreview: boolean; locked: boolean; status: string; lessonsCount: number; lessons: ReturnType<typeof formatLesson>[]; createdAt: string; updatedAt: string } {
  return {
    id: String(raw.id),
    title: raw.title,
    description: raw.description ?? null,
    order: raw.order ?? raw.sort_order ?? 0,
    durationMinutes: raw.durationMinutes ?? null,
    freePreview: raw.freePreview ?? false,
    locked: raw.locked ?? true,
    status: raw.status ?? "draft",
    lessonsCount: raw.lessonsCount ?? 0,
    lessons: (raw.lessons ?? []).map(formatLesson),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function formatLesson(raw: Raw) {
  return {
    id: String(raw.id),
    title: raw.title,
    slug: raw.slug,
    shortDescription: raw.shortDescription ?? null,
    order: raw.order ?? raw.sort_order ?? 0,
    lessonType: raw.lessonType ?? raw.lesson_type ?? raw.type ?? "video",
    status: raw.status ?? "draft",
    visibility: raw.visibility ?? "private",
    durationSeconds: raw.durationSeconds ?? raw.duration_seconds ?? null,
    estimatedDuration: raw.estimatedDuration ?? raw.estimated_duration ?? null,
    freePreview: raw.freePreview ?? raw.free_preview ?? false,
    downloadable: raw.downloadable ?? false,
    featured: raw.featured ?? false,
    examId: raw.examId ?? raw.exam_id ?? null,
    publishedAt: raw.publishedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function formatRelated(raw: Raw): RelatedCourse {
  return {
    id: String(raw.id),
    title: raw.title,
    slug: raw.slug,
    subtitle: raw.subtitle ?? null,
    thumbnail: raw.thumbnail ?? null,
    coverImage: raw.coverImage ?? null,
    price: raw.price ?? null,
    discountPrice: raw.discountPrice ?? null,
    currency: raw.currency ?? null,
    pricingType: raw.pricingType ?? "free",
    difficulty: raw.difficulty ?? "beginner",
    studentsCount: raw.studentsCount ?? 0,
    lessonsCount: raw.lessonsCount ?? 0,
    duration: raw.duration ?? null,
    instructor: raw.instructor ? {
      id: String(raw.instructor.id),
      name: raw.instructor.name,
      avatar: raw.instructor.avatar ?? null,
    } : null,
    category: raw.category ? {
      id: String(raw.category.id),
      name: raw.category.name,
      slug: raw.category.slug,
    } : null,
  };
}

/** Server-only public course API (reads tenant headers from next/headers). */
export const publicCourseServerService = {
  async getBySlug(slug: string): Promise<PublicCourse | null> {
    try {
      const json = await serverFetch<{ data: Raw }>(`/public/courses/${slug}`);
      return json.data ? formatCourse(json.data) : null;
    } catch {
      return null;
    }
  },

  async getModules(slug: string): Promise<PublicCourseModule[]> {
    try {
      const json = await serverFetch<{ data: Raw[] }>(`/public/courses/${slug}/modules`);
      return (json.data ?? []).map(formatModule);
    } catch {
      return [];
    }
  },

  async getRelated(slug: string): Promise<RelatedCourse[]> {
    try {
      const json = await serverFetch<{ data: Raw[] }>(`/public/courses/${slug}/related`);
      return (json.data ?? []).map(formatRelated);
    } catch {
      return [];
    }
  },

  async checkEnrollment(_slug: string): Promise<EnrollmentCheck> {
    // Server-side: can't auth users without a token, return not-enrolled
    return { enrolled: false, enrollment: null };
  },
};
