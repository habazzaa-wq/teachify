import api from "@/services/api/axios";
import type { HomepageCourse, PublicCoursesResponse } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function formatCourse(raw: Raw): HomepageCourse {
  return {
    id: String(raw.id),
    title: raw.title,
    slug: raw.slug,
    subtitle: raw.subtitle ?? null,
    shortDescription: raw.shortDescription ?? null,
    thumbnail: raw.thumbnail ?? null,
    coverImage: raw.coverImage ?? null,
    difficulty: raw.difficulty ?? "beginner",
    pricingType: raw.pricingType ?? "free",
    price: raw.price ?? null,
    discountPrice: raw.discountPrice ?? null,
    currency: raw.currency ?? null,
    duration: raw.duration ?? null,
    certificateEnabled: raw.certificateEnabled ?? false,
    featured: raw.featured ?? false,
    instructor: raw.instructor
      ? {
          id: String(raw.instructor.id),
          name: raw.instructor.name,
          avatar: raw.instructor.avatar ?? null,
        }
      : null,
    category: raw.category
      ? {
          id: String(raw.category.id),
          name: raw.category.name,
          slug: raw.category.slug,
        }
      : null,
    studentsCount: raw.studentsCount ?? 0,
    lessonsCount: raw.lessonsCount ?? 0,
    sectionsCount: raw.sectionsCount ?? 0,
  };
}

export const homepageCoursesService = {
  async getPublicCourses(): Promise<HomepageCourse[]> {
    const { data } = await api.get<PublicCoursesResponse>("/public/courses");
    return (data.data ?? []).map(formatCourse);
  },
};
