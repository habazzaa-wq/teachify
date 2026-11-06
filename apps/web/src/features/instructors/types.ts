export interface InstructorUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

export interface InstructorMembership {
  id: number;
  tenant_id: number;
  permissions?: string[];
  status?: string;
  must_change_password?: boolean;
  joined_at?: string | null;
  last_login_at?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
  department?: string | null;
  phone?: string | null;
  bio?: string | null;
  expertise?: string | null;
  experience_years?: number | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  youtube_url?: string | null;
}

export interface InstructorCourse {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  fullDescription?: string | null;
  status: string;
  visibility: string;
  difficulty?: string | null;
  language?: string | null;
  duration?: number | null;
  thumbnail?: string | null;
  coverImage?: string | null;
  pricingType?: "free" | "one_time" | "subscription";
  price?: number | null;
  currency?: string | null;
  discountPrice?: number | null;
  enrollmentLimit?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  certificateEnabled?: boolean;
  featured?: boolean;
  studentsCount?: number;
  sectionsCount?: number;
  lessonsCount?: number;
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  instructor?: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
}

export interface InstructorSessionResponse {
  access_token: string;
  refresh_token: string | null;
  must_change_password: boolean;
  user: InstructorUser;
  membership: InstructorMembership;
}

export interface InstructorCoursesResponse {
  data: InstructorCourse[];
}

export interface InstructorCourseResponse {
  data: InstructorCourse;
}

export interface InstructorCourseUpdatePayload {
  title: string;
  subtitle: string;
  short_description: string;
  description: string;
  difficulty: string;
  language: string;
}
