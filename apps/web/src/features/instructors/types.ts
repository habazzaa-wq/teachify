export interface InstructorUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

export interface InstructorMembership {
  id: number;
  tenant_id: number;
  status?: string;
  must_change_password?: boolean;
}

export interface InstructorCourse {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  status: string;
  visibility: string;
  difficulty?: string | null;
  language?: string | null;
  duration?: number | null;
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
