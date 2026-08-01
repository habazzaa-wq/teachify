import {
  Play,
  FileText,
  FileType,
  ClipboardCheck,
  Headphones,
  Radio,
  ExternalLink,
  Puzzle,
  Monitor,
  FolderOpen,
  FileQuestion,
  ClipboardList,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type {
  PublicCourseLesson,
  PublicCourseModule,
  PublicCourseSection,
} from "./types";

/** Content-type → icon/label/color mapping used across the curriculum. */
export interface LessonTypeConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const LESSON_TYPE_CONFIG: Record<string, LessonTypeConfig> = {
  video: { icon: Play, label: "فيديو", color: "#3b82f6" },
  text: { icon: FileText, label: "نص", color: "#10b981" },
  file: { icon: FolderOpen, label: "ملف", color: "#10b981" },
  pdf: { icon: FileType, label: "ملف PDF", color: "#f43f5e" },
  document: { icon: FileText, label: "مستند", color: "#10b981" },
  exam: { icon: ClipboardCheck, label: "امتحان", color: "#f59e0b" },
  quiz: { icon: FileQuestion, label: "اختبار", color: "#f59e0b" },
  assignment: { icon: ClipboardList, label: "واجب", color: "#8b5cf6" },
  audio: { icon: Headphones, label: "صوتي", color: "#a855f7" },
  live: { icon: Radio, label: "بث مباشر", color: "#f43f5e" },
  external: { icon: ExternalLink, label: "رابط خارجي", color: "#06b6d4" },
  link: { icon: ExternalLink, label: "رابط خارجي", color: "#06b6d4" },
  interactive: { icon: Puzzle, label: "تفاعلي", color: "#8b5cf6" },
  presentation: { icon: Monitor, label: "عرض تقديمي", color: "#f97316" },
  resource: { icon: FolderOpen, label: "مورد", color: "#10b981" },
};

export const FALLBACK_LESSON_CONFIG: LessonTypeConfig = {
  icon: BookOpen,
  label: "درس",
  color: "#6b7280",
};

export function getLessonConfig(
  lesson: Pick<PublicCourseLesson, "lessonType">,
): LessonTypeConfig {
  return LESSON_TYPE_CONFIG[lesson.lessonType] ?? FALLBACK_LESSON_CONFIG;
}

/** Format a duration in seconds into a compact Arabic string. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs} س ${rem} د` : `${hrs} س`;
  }
  if (mins > 0 && secs > 0) return `${mins} د ${secs} ث`;
  if (mins > 0) return `${mins} د`;
  return `${secs} ث`;
}

export function formatDurationLong(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs} ساعة و ${mins} دقيقة`;
  if (hrs > 0) return `${hrs} ساعة`;
  return `${mins} دقيقة`;
}

export interface CurriculumStats {
  sections: number;
  lessons: number;
  videos: number;
  exams: number;
  resources: number;
  audio: number;
  files: number;
  duration: number;
}

export function getModuleStats(module: PublicCourseModule): CurriculumStats {
  const sections = module.sections ?? [];
  const stats: CurriculumStats = {
    sections: sections.length || module.sectionsCount || 0,
    lessons: 0,
    videos: 0,
    exams: 0,
    resources: 0,
    audio: 0,
    files: 0,
    duration: 0,
  };

  for (const section of sections) {
    for (const lesson of section.lessons ?? []) {
      stats.lessons += 1;
      stats.duration += lesson.durationSeconds ?? lesson.estimatedDuration ?? 0;
      const type = lesson.lessonType;
      if (type === "video") stats.videos += 1;
      if (type === "exam" || type === "quiz" || lesson.examId) stats.exams += 1;
      if (type === "audio") stats.audio += 1;
      if (type === "pdf" || type === "document") stats.files += 1;
      if (
        type === "file" ||
        type === "resource" ||
        type === "link" ||
        lesson.downloadable
      ) {
        stats.resources += 1;
      }
    }
  }

  return stats;
}

export function getCourseStats(modules: PublicCourseModule[]): CurriculumStats {
  const total: CurriculumStats = {
    sections: 0,
    lessons: 0,
    videos: 0,
    exams: 0,
    resources: 0,
    audio: 0,
    files: 0,
    duration: 0,
  };

  for (const mod of modules) {
    const stats = getModuleStats(mod);
    total.sections += stats.sections;
    total.lessons += stats.lessons;
    total.videos += stats.videos;
    total.exams += stats.exams;
    total.resources += stats.resources;
    total.audio += stats.audio;
    total.files += stats.files;
    total.duration += stats.duration;
  }

  return total;
}

export function sectionLessons(
  section: PublicCourseSection,
): PublicCourseLesson[] {
  return section.lessons ?? [];
}

export function hasFreePreview(section: PublicCourseSection): boolean {
  return (
    section.freePreview &&
    (section.lessons ?? []).some((lesson) => lesson.freePreview)
  );
}
