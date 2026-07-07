export type EnrollmentStatus = "pending" | "active" | "completed" | "cancelled" | "suspended";

export interface Enrollment {
  id: string;
  tenantId: string;
  courseId: string;
  tenantUserId: string;
  status: EnrollmentStatus;
  progress: number;
  completed: boolean;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lastActivityAt: string | null;
  completedAt: string | null;
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentFilterParams {
  search?: string;
  course_id?: string;
  status?: EnrollmentStatus | "all";
  page?: number;
  per_page?: number;
}
