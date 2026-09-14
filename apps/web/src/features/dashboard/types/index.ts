export interface DashboardTrendPoint {
  label: string;
  value: number;
}

export interface StorageInfo {
  used: number;
  remaining: number;
  total: number;
  usage_percent: number;
}

export interface SubscriptionInfo {
  plan: string;
  days_left: number;
  progress: number;
  trial_days_remaining: number;
  status: string;
}

export interface DashboardStats {
  students_total: number;
  students_active: number;
  students_new_month: number;
  students_trend: number;
  courses_total: number;
  courses_published: number;
  courses_trend: number;
  exams_total: number;
  exams_published: number;
  exams_trend: number;
  questions_total: number;
  enrollments_total: number;
  enrollments_active: number;
  enrollments_completed: number;
  enrollments_trend: number;
  revenue_total: number;
  revenue_month: number;
  revenue_today: number;
  revenue_trend: number;
  certificates_total: number;
  certificates_trend: number;
  attempts_total: number;
  attempts_submitted: number;
  attempts_passed: number;
  attempts_pass_rate: number;
  attempts_average_score: number;
  attempts_trend: number;
  average_completion_rate: number;
  completed_learners: number;
  recharge_codes_total: number;
  recharge_codes_active: number;
  media_total: number;
  media_videos: number;
  storage: StorageInfo;
  subscription: SubscriptionInfo;
}

export interface TopCourseItem {
  id: number;
  title: string;
  slug: string;
  students: number;
  completion_rate: number;
  revenue: number;
  status: string;
  thumbnail: string | null;
}

export interface RecentActivityItem {
  id: string;
  type: "enrollment" | "exam" | "certificate" | "payment";
  title: string;
  description: string;
  timestamp: string;
}

export interface TeacherDashboardData {
  stats: DashboardStats;
  revenue_trend: DashboardTrendPoint[];
  enrollment_trend: DashboardTrendPoint[];
  students_trend: DashboardTrendPoint[];
  exam_attempts_trend: DashboardTrendPoint[];
  top_courses: TopCourseItem[];
  recent_activity: RecentActivityItem[];
}