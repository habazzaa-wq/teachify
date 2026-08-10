"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Download, Lock, Award, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLessonConfig, formatDuration } from "../utils";
import type { PublicCourseLesson } from "../types";

interface LessonRowProps {
  lesson: PublicCourseLesson;
  isEnrolled: boolean;
  onLockedClick: () => void;
  onPlay?: (lesson: PublicCourseLesson) => void;
  isPreview?: boolean;
}

function LessonRowInner({
  lesson,
  isEnrolled,
  onLockedClick,
  onPlay,
  isPreview = false,
}: LessonRowProps) {
  const config = useMemo(() => getLessonConfig(lesson), [lesson]);
  const TypeIcon = config.icon;

  const duration = useMemo(
    () => formatDuration(lesson.durationSeconds ?? lesson.estimatedDuration),
    [lesson.durationSeconds, lesson.estimatedDuration],
  );

  const hasExam = !!lesson.examId;
  const hasResources = (lesson.filesCount ?? 0) > 0 || lesson.downloadable;
  const isLocked = !isEnrolled;
  const showPreview = isPreview && lesson.freePreview;

  const handleActivate = () => {
    if (isLocked) {
      onLockedClick();
      return;
    }
    onPlay?.(lesson);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      aria-label={isLocked ? `الدرس مقفل: ${lesson.title}` : lesson.title}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
      className={cn(
        "group/lesson flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200",
        "hover:bg-[rgb(var(--brand-primary-rgb)/0.05)] dark:hover:bg-white/[0.03]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary-rgb)/0.4)] focus-visible:ring-inset",
      )}
    >
      {/* Type Icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover/lesson:scale-105"
        style={{ backgroundColor: `${config.color}16` }}
      >
        <TypeIcon className="h-4 w-4" style={{ color: config.color }} />
      </div>

      {/* Title & Meta */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="line-clamp-1 text-sm font-semibold leading-snug text-foreground/90 transition-colors duration-200 group-hover/lesson:text-foreground">
            {lesson.title}
          </span>
          {showPreview && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
              <Play className="h-2.5 w-2.5 fill-current" />
              معاينة مجانية
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground/60">
          {duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {duration}
            </span>
          )}
          {hasExam && (
            <span className="inline-flex items-center gap-1 text-amber-600/70 dark:text-amber-400/70">
              <Award className="h-3 w-3" />
              امتحان
            </span>
          )}
          {hasResources && (
            <span className="inline-flex items-center gap-1">
              <Download className="h-3 w-3" />
              مرفقات
            </span>
          )}
        </div>
      </div>

      {/* Status icon */}
      {isLocked ? (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 transition-transform duration-200 group-hover/lesson:scale-110 dark:text-amber-400">
          <Lock className="h-3.5 w-3.5" />
        </div>
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-primary-rgb)/0.1)] text-[var(--brand-primary)] transition-transform duration-200 group-hover/lesson:scale-110">
          <Play className="h-3.5 w-3.5 fill-current" />
        </div>
      )}
    </motion.div>
  );
}

const LessonRow = memo(LessonRowInner);

export { LessonRow };
export type { LessonRowProps };
