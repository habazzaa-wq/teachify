import { api } from "@/services/api";
import { tenantStudentFetch } from "@/services/api/tenant-student-fetch";
import type { PublicCourse, PublicCourseModule, PublicCourseSection, PublicCourseLesson, PublicCourseLessonVideo, PublicCourseLessonFiles, EnrollmentCheck, RelatedCourse } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Raw API responses have untyped shapes
type Raw = Record<string, any>;

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
          bio: raw.instructor.bio ?? raw.instructor.biography ?? null,
          title: raw.instructor.title ?? raw.instructor.headline ?? null,
          coursesCount: raw.instructor.coursesCount ?? raw.instructor.courses_count ?? null,
          studentsCount: raw.instructor.studentsCount ?? raw.instructor.students_count ?? null,
          rating: raw.instructor.rating ?? raw.instructor.average_rating ?? null,
          socialLinks: Array.isArray(raw.instructor.socialLinks)
            ? raw.instructor.socialLinks
            : [],
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

function formatSection(raw: Raw): PublicCourseSection {
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

function formatLesson(raw: Raw): PublicCourseLesson {
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

export const publicCourseService = {
  async getBySlug(slug: string): Promise<PublicCourse | null> {
    const { data } = await api.get(`/public/courses/${slug}`);
    return data.data ? formatCourse(data.data) : null;
  },

  async getModules(slug: string): Promise<PublicCourseModule[]> {
    const { data } = await api.get(`/public/courses/${slug}/modules`);
    return (data.data ?? []).map(formatModule);
  },

  async getRelated(slug: string): Promise<RelatedCourse[]> {
    const { data } = await api.get(`/public/courses/${slug}/related`);
    return (data.data ?? []).map(formatRelated);
  },

  async checkEnrollment(slug: string): Promise<EnrollmentCheck> {
    try {
      const { data } = await api.get(`/public/courses/${slug}/enrollment`);
      return {
        enrolled: data.enrolled ?? false,
        enrollment: data.enrollment ?? null,
      };
    } catch {
      return { enrolled: false, enrollment: null };
    }
  },

  async getLessonVideo(slug: string, lessonId: string): Promise<PublicCourseLessonVideo | null> {
    try {
      const json = await tenantStudentFetch<{ data?: PublicCourseLessonVideo }>(
        `/public/courses/${slug}/lessons/${lessonId}/video`,
      );
      return json.data ?? null;
    } catch {
      return null;
    }
  },

  async getLessonFiles(slug: string, lessonId: string): Promise<PublicCourseLessonFiles | null> {
    try {
      const json = await tenantStudentFetch<{ data?: PublicCourseLessonFiles }>(
        `/public/courses/${slug}/lessons/${lessonId}/files`,
      );
      return json.data ?? null;
    } catch {
      return null;
    }
  },

  async purchaseCourse(slug: string): Promise<{
    message: string;
    enrolled: boolean;
    amount: number;
    balance: number;
    enrollment: { id: string; status: string } | null;
  }> {
    const { data } = await api.post(`/public/courses/${slug}/enroll`);
    return {
      message: data.message,
      enrolled: data.enrolled ?? true,
      amount: data.amount ?? 0,
      balance: data.balance ?? 0,
      enrollment: data.enrollment ?? null,
    };
  },
};
