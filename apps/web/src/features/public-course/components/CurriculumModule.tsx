"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import {
  ChevronDown,
  Layers,
  GraduationCap,
  Clock,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { LessonRow } from "./LessonRow";
import type {
  PublicCourseModule,
  PublicCourseSection,
} from "../types";

interface CurriculumModuleProps {
  module: PublicCourseModule;
  isEnrolled: boolean;
  onLockedClick: () => void;
  defaultExpanded?: boolean;
}

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

function getModuleStats(module: PublicCourseModule) {
  let totalLessons = 0;
  let totalDuration = 0;

  for (const section of module.sections) {
    totalLessons += section.lessonsCount ?? section.lessons?.length ?? 0;
    for (const lesson of section.lessons ?? []) {
      totalDuration += lesson.durationSeconds ?? lesson.estimatedDuration ?? 0;
    }
  }

  return { totalLessons, totalDuration };
}

function CurriculumModuleInner({
  module,
  isEnrolled,
  onLockedClick,
  defaultExpanded = false,
}: CurriculumModuleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const prefersReducedMotion = useReducedMotion();

  const { totalLessons, totalDuration } = useMemo(
    () => getModuleStats(module),
    [module],
  );

  const moduleNumber = useMemo(
    () => String(module.order).padStart(2, "0"),
    [module.order],
  );

  const toggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  const sections = module.sections ?? [];

  const contentVariants: Variants = prefersReducedMotion
    ? { collapsed: { opacity: 0 }, expanded: { opacity: 1 } }
    : {
        collapsed: {
          height: 0,
          opacity: 0,
          transition: {
            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.2 },
          },
        },
        expanded: {
          height: "auto",
          opacity: 1,
          transition: {
            height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.3, delay: 0.1 },
          },
        },
      };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-300",
        "bg-background/80 dark:bg-white/[0.02]",
        "border-border/40 dark:border-white/[0.06]",
        "shadow-sm dark:shadow-none",
        isExpanded
          ? "shadow-md dark:shadow-[0_0_20px_rgba(0,0,0,0.15)] ring-1 ring-primary/5 dark:ring-primary/[0.04]"
          : "hover:border-border/60 dark:hover:border-white/[0.1]",
        !isEnrolled && "opacity-75",
      )}
    >
      {/* Module Header */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4",
          "text-start transition-colors duration-200",
          "hover:bg-muted/30 dark:hover:bg-white/[0.02]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
          "rounded-2xl",
        )}
        aria-expanded={isExpanded}
      >
        {/* Module Number Badge */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            "bg-gradient-to-br from-primary/10 to-primary/5",
            "dark:from-primary/15 dark:to-primary/5",
            "border border-primary/10 dark:border-primary/15",
            "text-xs font-bold tabular-nums text-primary",
            "transition-all duration-300",
            isExpanded && "from-primary/15 to-primary/10 dark:from-primary/20 dark:to-primary/8 scale-105",
          )}
        >
          {moduleNumber}
        </div>

        {/* Title & Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3
            className={cn(
              "text-sm sm:text-[15px] font-bold leading-snug line-clamp-1",
              "text-foreground transition-colors duration-200",
            )}
          >
            {module.title}
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 dark:text-muted-foreground/50">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {module.sectionsCount} {module.sectionsCount === 1 ? "قسم" : "أقسام"}
            </span>
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {totalLessons} {totalLessons === 1 ? "درس" : "دروس"}
            </span>
            {(module.estimatedDuration ?? totalDuration) > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(module.estimatedDuration ?? totalDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            "bg-muted/50 dark:bg-white/[0.04]",
            "text-muted-foreground/50 dark:text-muted-foreground/40",
            "transition-colors duration-200",
            "group-hover/accordion:text-foreground/70",
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false} mode="sync">
        {isExpanded && (
          <motion.div
            key="content"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="border-t border-border/25 dark:border-white/[0.04] px-4 pb-3 pt-2 sm:px-5">
              {sections.map((section, sectionIdx) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  sectionIdx={sectionIdx}
                  isEnrolled={isEnrolled}
                  onLockedClick={onLockedClick}
                  isLast={sectionIdx === sections.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Section Block ──────────────────────────────────────────────── */

interface SectionBlockProps {
  section: PublicCourseSection;
  sectionIdx: number;
  isEnrolled: boolean;
  onLockedClick: () => void;
  isLast: boolean;
}

function SectionBlockInner({
  section,
  sectionIdx,
  isEnrolled,
  onLockedClick,
  isLast,
}: SectionBlockProps) {
  const lessons = section.lessons ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: sectionIdx * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(!isLast && "mb-2")}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 px-1 py-2">
        <BookOpen className="h-3.5 w-3.5 text-muted-foreground/40 dark:text-muted-foreground/30" />
        <span className="text-xs font-semibold text-foreground/70 dark:text-foreground/60 line-clamp-1">
          {section.title}
        </span>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full",
            "bg-muted/70 dark:bg-white/[0.05]",
            "px-2 py-0.5 text-[10px] font-semibold tabular-nums",
            "text-muted-foreground/60 dark:text-muted-foreground/50",
            "border border-border/20 dark:border-white/[0.05]",
          )}
        >
          {section.lessonsCount ?? lessons.length}
        </span>
        {section.freePreview && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/8 dark:bg-emerald-400/8 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600/70 dark:text-emerald-400/60">
            معاينة
          </span>
        )}
      </div>

      {/* Lessons */}
      <div className="space-y-0.5">
        {lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            isEnrolled={isEnrolled}
            onLockedClick={onLockedClick}
            isPreview={section.freePreview}
          />
        ))}
      </div>
    </motion.div>
  );
}

const SectionBlock = memo(SectionBlockInner);

const CurriculumModule = memo(CurriculumModuleInner);

export { CurriculumModule };
export type { CurriculumModuleProps };
