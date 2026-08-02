export interface StudentDashboardStudent {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string;
  gender: string;
  nationality: string;
  studyLevel: string;
  governorate: string;
  city: string;
  status: string;
  joinedAt: string | null;
}

export interface StudentDashboardStats {
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  averageProgressPercent: number;
  averageExamScorePercent: number;
  certificatesCount: number;
  attemptsCount: number;
  passedAttemptsCount: number;
  activeDaysCount: number;
  currentStreakDays: number;
  lastActivityAt: string | null;
}

export interface ContinueLearningItem {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  thumbnail: string | null;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lastActivityAt: string | null;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
}

export interface RecentAttemptItem {
  attemptId: string;
  examId: string;
  examTitle: string;
  status: string;
  isPractice: boolean;
  score: number;
  maxScore: number;
  percentage: number | null;
  passed: boolean;
  submittedAt: string | null;
  courseTitle: string | null;
  courseSlug: string | null;
}

export type UpcomingTaskType = "exam" | "course";
export type UpcomingTaskPriority = "high" | "normal";

export interface UpcomingTask {
  id: string;
  type: UpcomingTaskType;
  title: string;
  link: string;
  dueAt: string | null;
  priority: UpcomingTaskPriority;
}

export type TimelineEventType =
  | "course_enrolled"
  | "lesson_progressed"
  | "lesson_completed"
  | "course_completed"
  | "exam_submitted"
  | "exam_passed"
  | "certificate_issued";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string | null;
  occurredAt: string;
}

export type AchievementType = "course_completed" | "exam_passed" | "certificate";

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string | null;
  earnedAt: string;
}

export type CalendarItemType = "exam_due" | "course_ends";

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  at: string;
}

export interface CalendarDay {
  date: string;
  items: CalendarItem[];
}

export interface StudentDashboardData {
  student: StudentDashboardStudent;
  stats: StudentDashboardStats;
  continueLearning: ContinueLearningItem[];
  recentAttempts: RecentAttemptItem[];
  upcomingTasks: UpcomingTask[];
  timeline: TimelineEvent[];
  achievements: Achievement[];
  calendar: CalendarDay[];
}
