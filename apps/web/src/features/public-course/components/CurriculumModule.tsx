"use client";

import { memo, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { ChevronDown, Layers, GraduationCap, Clock, BookOpen, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { LessonRow } from "./LessonRow";
import { SubscribeButton } from "./primitives";
import { ExamEntryCard } from "@/features/exam-entry/components/ExamEntryCard";
import { getModuleStats, formatDuration } from "../utils";
import { LOCKED_GRADIENT } from "../brand";
import type { PublicCourseLesson, PublicCourseModule, PublicCourseSection } from "../types";

interface CurriculumModuleProps {
  module: PublicCourseModule;
  isEnrolled: boolean;
  onLockedClick: () => void;
  onPlay: (lesson: PublicCourseLesson) => void;
  isExpanded: boolean;
  onToggle: () => void;
  expandedSections: ReadonlySet<string>;
  onToggleSection: (id: string) => void;
}

function CurriculumModuleInner({
  module,
  isEnrolled,
  onLockedClick,
  onPlay,
  isExpanded,
  onToggle,
  expandedSections,
  onToggleSection,
}: CurriculumModuleProps) {
  const prefersReducedMotion = useReducedMotion();
  const stats = useMemo(() => getModuleStats(module), [module]);  const moduleNumber = useMemo(
    () => String(module.order ?? 0).padStart(2, "0"),
    [module.order],
  );

  const duration = useMemo(
    () =>
      formatDuration(
        module.estimatedDuration && module.estimatedDuration > 0
          ? module.estimatedDuration
          : stats.duration,
      ),
    [module.estimatedDuration, stats.duration],
  );

  const contentVariants: Variants = prefersReducedMotion
    ? { collapsed: { opacity: 0 }, expanded: { opacity: 1 } }
    : {
        collapsed: {
          height: 0,
          opacity: 0,
          transition: {
            height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.2 },
          },
        },
        expanded: {
          height: "auto",
          opacity: 1,
          transition: {
            height: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.3, delay: 0.08 },
          },
        },
      };

  return (
    <motion.div
      initial={false}
      className={cn(
        "overflow-hidden rounded-2xl border transition-colors duration-300",
        "border-border/50 dark:border-white/[0.07]",
        isExpanded
          ? "border-[rgb(var(--brand-primary-rgb)/0.25)] bg-card shadow-sm"
          : "bg-card/60 hover:border-[rgb(var(--brand-primary-rgb)/0.25)]",
      )}
    >
      {/* Module Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-4 text-start sm:px-5",
          "transition-colors duration-200 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--brand-primary-rgb)/0.4)]",
          isExpanded ? "bg-[rgb(var(--brand-primary-rgb)/0.04)]" : "hover:bg-muted/30",
        )}
      >
        {/* Module Number Badge */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold tabular-nums transition-all duration-300",
            isExpanded
              ? "scale-105 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white shadow-md shadow-[rgb(var(--brand-primary-rgb)/0.3)]"
              : "border border-[rgb(var(--brand-primary-rgb)/0.2)] bg-[rgb(var(--brand-primary-rgb)/0.08)] text-[var(--brand-primary)]",
          )}
        >
          {moduleNumber}
        </div>

        {/* Title & Meta */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="line-clamp-1 text-sm font-bold leading-snug text-foreground sm:text-[15px]">
            {module.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/70">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3 text-[rgb(var(--brand-primary-rgb)/0.6)]" />
              {stats.sections} {stats.sections === 1 ? "قسم" : "أقسام"}
            </span>
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-[rgb(var(--brand-primary-rgb)/0.6)]" />
              {stats.lessons} {stats.lessons === 1 ? "درس" : "دروس"}
            </span>
            {duration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-[rgb(var(--brand-primary-rgb)/0.6)]" />
                {duration}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
            isExpanded
              ? "bg-[rgb(var(--brand-primary-rgb)/0.1)] text-[var(--brand-primary)]"
              : "bg-muted/50 text-muted-foreground/50",
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border/30 px-3 py-4 sm:px-4">
              {module.sections.length > 0 ? (
                module.sections.map((section) => (
                  <SectionAccordion
                    key={section.id}
                    section={section}
                    isEnrolled={isEnrolled}
                    onLockedClick={onLockedClick}
                    onPlay={onPlay}
                    isExpanded={expandedSections.has(section.id)}
                    onToggle={() => onToggleSection(section.id)}
                  />
                ))
              ) : (
                <p className="px-1 text-xs text-muted-foreground/60">
                  لا توجد دروس في هذا القسم بعد.
                </p>
              )}

              {/* Locked subscribe CTA card */}
              {!isEnrolled && (
                <div
                  className="overflow-hidden rounded-xl border border-[rgb(var(--brand-primary-rgb)/0.2)]"
                  style={{ background: LOCKED_GRADIENT }}
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-foreground">
                        هذا المحتوى متاح للمشتركين فقط
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        اشترك الآن للوصول إلى جميع المحاضرات والملفات والاختبارات الخاصة بهذه الدورة.
                      </p>
                    </div>
                    <SubscribeButton
                      onClick={onLockedClick}
                      label="اشترك الآن"
                      size="md"
                      className="sm:w-auto sm:shrink-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Section accordion (nested) ──────────────────────────────────── */

interface SectionAccordionProps {
  section: PublicCourseSection;
  isEnrolled: boolean;
  onLockedClick: () => void;
  onPlay: (lesson: PublicCourseLesson) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function SectionAccordionInner({
  section,
  isEnrolled,
  onLockedClick,
  onPlay,
  isExpanded,
  onToggle,
}: SectionAccordionProps) {
  const prefersReducedMotion = useReducedMotion();
  const lessons = section.lessons ?? [];

  const duration = useMemo(() => {
    if (section.durationMinutes) {
      return formatDuration(section.durationMinutes * 60);
    }
    const seconds = (section.lessons ?? []).reduce(
      (acc, l) => acc + (l.durationSeconds ?? l.estimatedDuration ?? 0),
      0,
    );
    return formatDuration(seconds);
  }, [section.durationMinutes, section.lessons]);

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 dark:border-white/[0.06] bg-background/50">
      {/* Section Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={cn(
          "flex w-full items-center gap-2.5 px-3 py-2.5 text-start transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--brand-primary-rgb)/0.4)]",
          "hover:bg-muted/30",
        )}
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--brand-primary-rgb)/0.7)]" />
        <span className="line-clamp-1 flex-1 text-xs font-bold text-foreground/80">
          {section.title}
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
            "bg-[rgb(var(--brand-primary-rgb)/0.08)] text-[var(--brand-primary)]",
          )}
        >
          {lessons.length || section.lessonsCount} دروس
        </span>
        {duration && (
          <span className="hidden shrink-0 items-center gap-1 text-[10px] text-muted-foreground/60 sm:inline-flex">
            <Clock className="h-3 w-3" />
            {duration}
          </span>
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 text-muted-foreground/50"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
      </button>

      {/* Lessons */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="lessons"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.2 } }
            }
            className="overflow-hidden"
          >
            <div className="space-y-0.5 border-t border-border/20 px-1 py-1.5">
              {lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <div key={lesson.id}>
                    <LessonRow
                      lesson={lesson}
                      isEnrolled={isEnrolled}
                      onLockedClick={onLockedClick}
                      onPlay={onPlay}
                      isPreview={section.freePreview}
                    />
                    {isEnrolled && lesson.examId && (
                      <div className="px-1 pb-1.5 pt-1.5">
                        <ExamEntryCard lessonId={lesson.id} enabled={isEnrolled} />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-[11px] text-muted-foreground/50">
                  لا توجد دروس في هذا القسم بعد.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SectionAccordion = memo(SectionAccordionInner);
const CurriculumModule = memo(CurriculumModuleInner);

export { CurriculumModule };
export type { CurriculumModuleProps };
