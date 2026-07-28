"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Play,
  FileText,
  ClipboardCheck,
  Headphones,
  Monitor,
  Link,
  Lock,
  ChevronLeft,
  Clock,
  Download,
  Award,
  CircleDot,
  Puzzle,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { PublicCourseLesson } from "../types";

interface LessonRowProps {
  lesson: PublicCourseLesson;
  isEnrolled: boolean;
  onLockedClick: () => void;
  isPreview?: boolean;
}

const lessonTypeConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  video: {
    icon: Play,
    label: "فيديو",
    color: "text-blue-500 dark:text-blue-400",
  },
  file: {
    icon: FileText,
    label: "ملف",
    color: "text-emerald-500 dark:text-emerald-400",
  },
  exam: {
    icon: ClipboardCheck,
    label: "امتحان",
    color: "text-amber-500 dark:text-amber-400",
  },
  audio: {
    icon: Headphones,
    label: "صوتي",
    color: "text-purple-500 dark:text-purple-400",
  },
  live: {
    icon: Radio,
    label: "بث مباشر",
    color: "text-rose-500 dark:text-rose-400",
  },
  link: {
    icon: Link,
    label: "رابط خارجي",
    color: "text-cyan-500 dark:text-cyan-400",
  },
  interactive: {
    icon: Puzzle,
    label: "تفاعلي",
    color: "text-violet-500 dark:text-violet-400",
  },
  presentation: {
    icon: Monitor,
    label: "عرض تقديمي",
    color: "text-orange-500 dark:text-orange-400",
  },
};

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs} س ${remMins} د` : `${hrs} س`;
  }
  if (mins > 0 && secs > 0) return `${mins} د ${secs} ث`;
  if (mins > 0) return `${mins} د`;
  return `${secs} ث`;
}

function LessonRowInner({
  lesson,
  isEnrolled,
  onLockedClick,
  isPreview = false,
}: LessonRowProps) {
  const typeConfig = lessonTypeConfig[lesson.lessonType] ?? lessonTypeConfig["file"]!;
  const TypeIcon = typeConfig.icon;
  const duration = useMemo(
    () => formatDuration(lesson.durationSeconds ?? lesson.estimatedDuration),
    [lesson.durationSeconds, lesson.estimatedDuration],
  );
  const hasExam = !!lesson.examId;
  const hasResources = lesson.downloadable;
  const isLocked = !isEnrolled && !isPreview;

  const handleClick = () => {
    if (isLocked) {
      onLockedClick();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleClick}
      className={cn(
        "group/lesson flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
        isLocked
          ? "cursor-pointer"
          : "cursor-default",
        "hover:bg-muted/50 dark:hover:bg-white/[0.03]",
        isLocked && "opacity-60",
      )}
      role={isLocked ? "button" : undefined}
      tabIndex={isLocked ? 0 : undefined}
      onKeyDown={
        isLocked
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onLockedClick();
              }
            }
          : undefined
      }
    >
      {/* Type Icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          "bg-muted/70 dark:bg-white/[0.04]",
          "border border-border/30 dark:border-white/[0.06]",
          "transition-colors duration-200",
          "group-hover/lesson:border-border/50 dark:group-hover/lesson:border-white/[0.1]",
        )}
      >
        <TypeIcon className={cn("h-3.5 w-3.5", typeConfig.color)} />
      </div>

      {/* Title & Meta */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium leading-snug line-clamp-1",
              "text-foreground/90 dark:text-foreground/80",
              "transition-colors duration-200",
              "group-hover/lesson:text-foreground",
            )}
          >
            {lesson.title}
          </span>

          {/* Free Preview Badge */}
          {isPreview && lesson.freePreview && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20">
              <Play className="h-2.5 w-2.5 fill-current" />
              معاينة مجانية
            </span>
          )}
        </div>

        {/* Meta Row */}
        <div className="flex items-center gap-2.5">
          {duration && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 dark:text-muted-foreground/50">
              <Clock className="h-3 w-3" />
              {duration}
            </span>
          )}

          {hasResources && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 dark:text-muted-foreground/50">
              <Download className="h-3 w-3" />
              مرفق
            </span>
          )}

          {hasExam && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600/70 dark:text-amber-400/60">
              <Award className="h-3 w-3" />
              امتحان
            </span>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Completion Check (future use) */}
        {isEnrolled && !isPreview && (
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full",
              "border border-border/40 dark:border-white/[0.08]",
              "text-muted-foreground/20 dark:text-muted-foreground/15",
            )}
          >
            <CircleDot className="h-3 w-3" />
          </div>
        )}

        {/* Lock / Chevron */}
        {isLocked ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/30 dark:text-muted-foreground/25 transition-colors duration-200 group-hover/lesson:text-muted-foreground/50 dark:group-hover/lesson:text-muted-foreground/40">
            <Lock className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/25 dark:text-muted-foreground/20 opacity-0 transition-all duration-200 group-hover/lesson:opacity-100 group-hover/lesson:text-muted-foreground/50 dark:group-hover/lesson:text-muted-foreground/40">
            <ChevronLeft className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

const LessonRow = memo(LessonRowInner);

export { LessonRow };
export type { LessonRowProps };
