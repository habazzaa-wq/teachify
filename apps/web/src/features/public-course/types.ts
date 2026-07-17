import type { Course } from "@/features/courses/types";

export type { Course } from "@/features/courses/types";

// Public course with full content tree
export interface PublicCourse extends Course {
  fullDescription: string | null;
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
}

export interface PublicCourseModule {
  id: string;
  title: string;
  description: string | null;
  order: number;
  status: "draft" | "published" | "archived";
  estimatedDuration: number | null;
  sectionsCount: number;
  sections: PublicCourseSection[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicCourseSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  durationMinutes: number | null;
  freePreview: boolean;
  locked: boolean;
  status: "draft" | "published" | "archived";
  lessonsCount: number;
  lessons: PublicCourseLesson[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicCourseLesson {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  order: number;
  lessonType: string;
  status: string;
  visibility: string;
  durationSeconds: number | null;
  estimatedDuration: number | null;
  freePreview: boolean;
  downloadable: boolean;
  featured: boolean;
  examId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentCheck {
  enrolled: boolean;
  enrollment: {
    id: string;
    status: string;
    progress: number;
    completedAt: string | null;
  } | null;
}

export interface RelatedCourse {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  thumbnail: string | null;
  coverImage: string | null;
  price: number | null;
  discountPrice: number | null;
  currency: string | null;
  pricingType: string;
  difficulty: string;
  studentsCount: number;
  lessonsCount: number;
  duration: number | null;
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
}

export interface CourseFAQ {
  question: string;
  answer: string;
}
