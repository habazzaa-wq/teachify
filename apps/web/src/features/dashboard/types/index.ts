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

export type DashboardPeriodPreset =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "180d"
  | "12m"
  | "all";

export type Granularity = "hourly" | "daily" | "weekly" | "monthly";

export interface DashboardQueryParams {
  period?: DashboardPeriodPreset;
  from?: string;
  to?: string;
}

export interface DashboardFiltersInfo {
  period: DashboardPeriodPreset | "custom";
  from: string | null;
  to: string | null;
  granularity: Granularity;
  bucket_count: number;
  bucket_label: string;
  days: number;
}

export interface PeriodBound {
  from: string | null;
  to: string | null;
}

export interface StudentsSummary {
  total: number;
  active: number;
  new_period: number;
  previous_period: number;
  change_percent: number;
}

export interface CoursesSummary {
  total: number;
  published: number;
  created_period: number;
  previous_period: number;
  change_percent: number;
}

export interface EnrollmentsSummary {
  total: number;
  active: number;
  completed: number;
  new_period: number;
  previous_period: number;
  change_percent: number;
}

export interface ExamsSummary {
  total: number;
  published: number;
  questions: number;
  attempts_total: number;
  attempts_submitted: number;
  attempts_passed: number;
  attempts_period: number;
  previous_period: number;
  passed_period: number;
  pass_rate_total: number;
  pass_rate_period: number;
  avg_score_period: number;
  change_percent: number;
}

export interface RevenueSummary {
  total: number;
  period: number;
  today: number;
  previous_period: number;
  change_percent: number;
  avg_per_day: number;
  transactions_total: number;
  transactions_period: number;
}

export interface CertificatesSummary {
  total: number;
  issued_period: number;
  previous_period: number;
  change_percent: number;
}

export interface CompletionsSummary {
  total: number;
  period: number;
  previous_period: number;
  rate: number;
  change_percent: number;
}

export interface RechargeCodesSummary {
  total: number;
  active: number;
  redeemed_period: number;
}

export interface MediaSummary {
  total: number;
  videos: number;
}

export interface DashboardSummary {
  students: StudentsSummary;
  courses: CoursesSummary;
  enrollments: EnrollmentsSummary;
  exams: ExamsSummary;
  revenue: RevenueSummary;
  certificates: CertificatesSummary;
  completions: CompletionsSummary;
  recharge_codes: RechargeCodesSummary;
  media: MediaSummary;
  storage: StorageInfo;
  subscription: SubscriptionInfo;
}

export interface DashboardTrendGroup {
  revenue: DashboardTrendPoint[];
  enrollments: DashboardTrendPoint[];
  students_new: DashboardTrendPoint[];
  exam_attempts: DashboardTrendPoint[];
  exam_pass_rate: DashboardTrendPoint[];
  certificates: DashboardTrendPoint[];
  completions: DashboardTrendPoint[];
}

export interface TopCourseItem {
  id: number;
  title: string;
  slug: string;
  status: string;
  thumbnail: string | null;
  students_total: number;
  students_period: number;
  completions_total: number;
  completions_period: number;
  completion_rate: number;
  revenue_total: number;
  revenue_period: number;
}

export interface ExamPerformanceItem {
  exam_id: number;
  title: string;
  attempts_total: number;
  attempts_period: number;
  passed_period: number;
  pass_rate_period: number;
  avg_score_period: number;
  last_attempted_at: string | null;
}

export interface DashboardBreakdowns {
  top_courses: TopCourseItem[];
  exam_performance: ExamPerformanceItem[];
}

export interface RecentActivityItem {
  id: string;
  type: "enrollment" | "exam" | "certificate" | "payment";
  title: string;
  description: string;
  timestamp: string;
}

export interface TeacherDashboardData {
  filters: DashboardFiltersInfo;
  periods: {
    current: PeriodBound;
    previous: PeriodBound;
  };
  summary: DashboardSummary;
  trends: DashboardTrendGroup;
  breakdowns: DashboardBreakdowns;
  recent_activity: RecentActivityItem[];
}