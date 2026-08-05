import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Trophy,
  Target,
  Award,
  GraduationCap,
  Flame,
  Clock,
} from "lucide-react";
import type {
  TimelineEventType,
  AchievementType,
  CalendarItemType,
  StudentDashboardStats,
} from "../types";

/**
 * Brand palette shared with the public site (the-mechanist.com).
 * Each visual element uses exactly ONE of these two colors — never both.
 */
export const BRAND_PRIMARY = "#D87B63";
export const BRAND_SECONDARY = "#FFB50E";
export const BRAND_TEXT_ON_PRIMARY = "#FFFFFF";
export const BRAND_TEXT_ON_SECONDARY = "#5A3A00";

/** Maps a stat-card semantic color to a single brand color. */
export function brandColorFor(color: StatCardConfig["color"]): string {
  return color === "warning" || color === "destructive"
    ? BRAND_SECONDARY
    : BRAND_PRIMARY;
}

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  course_enrolled: "التحق بدورة",
  lesson_progressed: "تقدّم في درس",
  lesson_completed: "أكمل درسًا",
  course_completed: "أتمّ دورة",
  exam_submitted: "قدّم اختبارًا",
  exam_passed: "اجتاز اختبارًا",
  certificate_issued: "حصل على شهادة",
};

export const ACHIEVEMENT_LABELS: Record<AchievementType, string> = {
  course_completed: "دورة مكتملة",
  exam_passed: "اختبار مُجتاز",
  certificate: "شهادة",
};

export const CALENDAR_ITEM_LABELS: Record<CalendarItemType, string> = {
  exam_due: "انتهاء موعد الاختبار",
  course_ends: "نهاية الدورة",
};

export interface StatCardConfig {
  key: keyof StudentDashboardStats;
  label: string;
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "destructive" | "info";
  suffix?: string;
}

export const STAT_CARDS: StatCardConfig[] = [
  {
    key: "enrolledCoursesCount",
    label: "الدورات المسجّلة",
    icon: BookOpen,
    color: "primary",
  },
  {
    key: "completedCoursesCount",
    label: "الدورات المكتملة",
    icon: Trophy,
    color: "success",
  },
  {
    key: "averageProgressPercent",
    label: "متوسط التقدّم",
    icon: Target,
    color: "info",
    suffix: "%",
  },
  {
    key: "averageExamScorePercent",
    label: "متوسط نتائج الاختبارات",
    icon: Award,
    color: "warning",
    suffix: "%",
  },
  {
    key: "certificatesCount",
    label: "الشهادات",
    icon: GraduationCap,
    color: "success",
  },
  {
    key: "passedAttemptsCount",
    label: "الاختبارات المجتازة",
    icon: Trophy,
    color: "primary",
  },
  {
    key: "currentStreakDays",
    label: "أيام التعلّم المتتالية",
    icon: Flame,
    color: "warning",
  },
  {
    key: "activeDaysCount",
    label: "أيام التعلّم",
    icon: Clock,
    color: "info",
  },
];
