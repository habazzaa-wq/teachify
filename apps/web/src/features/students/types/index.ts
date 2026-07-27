export type StudentStatus = "active" | "inactive" | "suspended";

export type EnrollmentStatus = "pending" | "active" | "completed" | "cancelled" | "suspended";

export interface Student {
  id: string;
  tenantUserId: string;
  fullName: string;
  email: string;
  phone: string;
  parentPhone: string;
  gender: string;
  nationality: string;
  studyLevel: string;
  governorate: string;
  city: string;
  avatar: string | null;
  status: StudentStatus;
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  joinedAt: string | null;
  lastActivityAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface StudentDetail extends Student {
  averageProgress: number;
  averageQuizScore: number;
  averageAssignmentScore: number;
  role: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface StudentMetrics {
  totalStudents: number;
  activeStudents: number;
  enrolledStudents: number;
  newThisMonth: number;
  averageProgress: number;
  completionRate: number;
}

export interface StudentEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  courseSlug: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  completionPercent: number;
  progressRecordsCount: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
}

export interface StudentAnalytics {
  totalEnrolledCourses: number;
  completedCourses: number;
  averageProgress: number;
  averageQuizScore: number;
  totalQuizAttempts: number;
  averageAssignmentScore: number;
  totalAssignmentSubmissions: number;
  certificatesEarned: number;
  lastActivityAt: string | null;
}

export interface StudentFilterParams {
  search?: string;
  status?: StudentStatus | "all";
  sort?: "created_at" | "last_login_at" | "last_accessed_at";
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface CreateStudentPayload {
  name: string;
  email: string;
  phone?: string;
  parent_phone?: string;
  password: string;
  password_confirmation: string;
  gender?: string;
  nationality?: string;
  study_level?: string;
  governorate?: string;
  city?: string;
}

export interface InviteStudentPayload {
  email: string;
}
