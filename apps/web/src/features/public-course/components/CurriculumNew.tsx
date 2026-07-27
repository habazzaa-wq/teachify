"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ChevronDown,
  Play,
  FileText,
  ClipboardCheck,
  Headphones,
  Radio,
  Link,
  Puzzle,
  Monitor,
  Lock,
  Clock,
  Search,
  Layers,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AppTooltip, AppTooltipTrigger, AppTooltipContent } from "@/components/ui/AppTooltip";
import type {
  PublicCourseModule,
  PublicCourseSection,
  PublicCourseLesson,
} from "../types";

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs} س ${rem} د` : `${hrs} س`;
  }
  if (mins > 0 && secs > 0) return `${mins} د ${secs} ث`;
  if (mins > 0) return `${mins} د`;
  return `${secs} ث`;
}

function getModuleStats(mod: PublicCourseModule) {
  let lessons = 0;
  let duration = 0;
  for (const sec of mod.sections ?? []) {
    lessons += sec.lessonsCount ?? sec.lessons?.length ?? 0;
    for (const l of sec.lessons ?? []) {
      duration += l.durationSeconds ?? l.estimatedDuration ?? 0;
    }
  }
  return { lessons, duration };
}

const LESSON_TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  video: { icon: Play, label: "فيديو", color: "text-blue-500" },
  text: { icon: FileText, label: "نص", color: "text-emerald-500" },
  file: { icon: FileText, label: "ملف", color: "text-emerald-500" },
  exam: { icon: ClipboardCheck, label: "امتحان", color: "text-amber-500" },
  audio: { icon: Headphones, label: "صوتي", color: "text-purple-500" },
  live: { icon: Radio, label: "بث مباشر", color: "text-rose-500" },
  link: { icon: Link, label: "رابط خارجي", color: "text-cyan-500" },
  interactive: { icon: Puzzle, label: "تفاعلي", color: "text-violet-500" },
  presentation: { icon: Monitor, label: "عرض تقديمي", color: "text-orange-500" },
};

/* ─── Lesson Row ───────────────────────────────────────────────────── */

interface LessonRowProps {
  lesson: PublicCourseLesson;
  isEnrolled: boolean;
  isPreview: boolean;
  onLockedClick: () => void;
}

const LessonRow = memo(function LessonRow({
  lesson,
  isEnrolled,
  isPreview,
  onLockedClick,
}: LessonRowProps) {
  const config = LESSON_TYPE_CONFIG[lesson.lessonType] ?? LESSON_TYPE_CONFIG.file!;
  const TypeIcon = config.icon;
  const duration = lesson.durationSeconds ?? lesson.estimatedDuration;
  const isLocked = !isEnrolled && !isPreview;

  const content = (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={isLocked ? onLockedClick : undefined}
      className={cn(
        "group/lesson flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
        isLocked ? "cursor-pointer opacity-55 hover:opacity-80 hover:bg-muted/40" : "cursor-default hover:bg-muted/40",
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
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
          isLocked
            ? "bg-muted/60 border-border/30"
            : "bg-muted/70 border-border/30 group-hover/lesson:border-border/50",
        )}
      >
        {isLocked ? (
          <Lock className="h-3.5 w-3.5 text-amber-500/50" />
        ) : (
          <TypeIcon className={cn("h-3.5 w-3.5", config.color)} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium leading-snug line-clamp-1 text-foreground/90 group-hover/lesson:text-foreground transition-colors duration-200">
            {lesson.title}
          </span>
          {isPreview && lesson.freePreview && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <Play className="h-2.5 w-2.5 fill-current" />
              معاينة
            </span>
          )}
          {isLocked && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 ring-1 ring-amber-400/20">
              <Lock className="h-2.5 w-2.5" />
              مقفل
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {duration != null && duration > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/55">
              <Clock className="h-3 w-3" />
              {formatDuration(duration)}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground/45">{config.label}</span>
        </div>
      </div>

      {isLocked ? (
        <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500/35 group-hover/lesson:text-amber-500/60 transition-colors duration-200" />
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/25 opacity-0 transition-all duration-200 group-hover/lesson:opacity-100 group-hover/lesson:text-muted-foreground/50">
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
        </div>
      )}
    </motion.div>
  );

  if (isLocked) {
    return (
      <AppTooltip>
        <AppTooltipTrigger asChild>{content}</AppTooltipTrigger>
        <AppTooltipContent side="top" align="center">
          <p className="text-xs">اشترك لفتح هذا الدرس</p>
        </AppTooltipContent>
      </AppTooltip>
    );
  }

  return content;
});

/* ─── Section Block ──────────────────────────────────────────────── */

interface SectionBlockProps {
  section: PublicCourseSection;
  isEnrolled: boolean;
  onLockedClick: () => void;
}

const SectionBlock = memo(function SectionBlock({
  section,
  isEnrolled,
  onLockedClick,
}: SectionBlockProps) {
  const lessons = section.lessons ?? [];

  return (
    <div className="py-1.5">
      {section.title && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-0.5">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="text-[11px] font-semibold text-muted-foreground/60 line-clamp-1">
            {section.title}
          </span>
          <span className="text-[10px] text-muted-foreground/35 tabular-nums">
            ({section.lessonsCount ?? lessons.length})
          </span>
          {section.freePreview && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              معاينة
            </span>
          )}
        </div>
      )}
      <div className="space-y-0.5">
        {lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            isEnrolled={isEnrolled}
            isPreview={section.freePreview}
            onLockedClick={onLockedClick}
          />
        ))}
      </div>
    </div>
  );
});

/* ─── Module Accordion ───────────────────────────────────────────── */

interface ModuleAccordionProps {
  module: PublicCourseModule;
  index: number;
  isEnrolled: boolean;
  onLockedClick: () => void;
  defaultExpanded: boolean;
}

const ModuleAccordion = memo(function ModuleAccordion({
  module,
  index,
  isEnrolled,
  onLockedClick,
  defaultExpanded,
}: ModuleAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { lessons: totalLessons, duration: totalDuration } = useMemo(
    () => getModuleStats(module),
    [module],
  );

  const toggle = useCallback(() => setIsExpanded((p) => !p), []);
  const sections = module.sections ?? [];
  const moduleNumber = String(module.order).padStart(2, "0");

  const contentVariants: Variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.15 },
      },
    },
    expanded: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.25, delay: 0.05 },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-300",
        "bg-card/50 border-border/30",
        isExpanded
          ? "shadow-sm border-primary/10"
          : "hover:border-border/50 hover:bg-card/70",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 text-start",
          "transition-colors duration-200 hover:bg-muted/25 rounded-2xl",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
        )}
        aria-expanded={isExpanded}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums transition-all duration-300",
            "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 text-primary",
            isExpanded && "from-primary/15 to-primary/10 scale-105",
          )}
        >
          {moduleNumber}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-sm sm:text-[15px] font-bold leading-snug line-clamp-1 text-foreground">
            {module.title}
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/55">
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

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground/45"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

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
            <div className="border-t border-border/20 px-2 pb-2 pt-1">
              {sections.map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  isEnrolled={isEnrolled}
                  onLockedClick={onLockedClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/* ─── Curriculum Section ──────────────────────────────────────────── */

interface CurriculumNewProps {
  modules: PublicCourseModule[];
  isLoading: boolean;
  isEnrolled: boolean;
  onLockedClick: () => void;
}

function getAggregateStats(modules: PublicCourseModule[]) {
  let totalSections = 0;
  let totalLessons = 0;
  let totalDuration = 0;
  for (const mod of modules) {
    totalSections += mod.sectionsCount ?? mod.sections?.length ?? 0;
    for (const section of mod.sections ?? []) {
      totalLessons += section.lessonsCount ?? section.lessons?.length ?? 0;
      for (const lesson of section.lessons ?? []) {
        totalDuration += lesson.durationSeconds ?? lesson.estimatedDuration ?? 0;
      }
    }
  }
  return { totalSections, totalLessons, totalDuration };
}

function filterModules(modules: PublicCourseModule[], query: string): PublicCourseModule[] {
  if (!query.trim()) return modules;
  const lower = query.toLowerCase().trim();
  return modules
    .map((mod) => {
      const filteredSections = (mod.sections ?? [])
        .map((section) => {
          const filteredLessons = (section.lessons ?? []).filter((lesson) =>
            lesson.title.toLowerCase().includes(lower),
          );
          if (filteredLessons.length === 0) return null;
          return { ...section, lessons: filteredLessons, lessonsCount: filteredLessons.length };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);
      if (filteredSections.length === 0) return null;
      return { ...mod, sections: filteredSections, sectionsCount: filteredSections.length };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
}

function CurriculumNewInner({
  modules,
  isLoading,
  isEnrolled,
  onLockedClick,
}: CurriculumNewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allExpanded, setAllExpanded] = useState(false);

  const stats = useMemo(() => getAggregateStats(modules), [modules]);
  const filteredModules = useMemo(() => filterModules(modules, searchQuery), [modules, searchQuery]);
  const hasQuery = searchQuery.trim().length > 0;

  const toggleAll = useCallback(() => setAllExpanded((p) => !p), []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) setAllExpanded(true);
  }, []);

  if (isLoading) {
    return (
      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 animate-pulse" />
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 w-full rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!modules.length) return null;

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={sectionVariants}
      className="space-y-5"
      dir="rtl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Search className="h-5 w-5 text-primary/70" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            محتوى الدورة
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
            <Layers className="h-4 w-4 text-primary/50" />
            <span className="font-semibold tabular-nums text-foreground/80">{stats.totalSections}</span>
            <span>{stats.totalSections === 1 ? "قسم" : "أقسام"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
            <GraduationCap className="h-4 w-4 text-primary/50" />
            <span className="font-semibold tabular-nums text-foreground/80">{stats.totalLessons}</span>
            <span>{stats.totalLessons === 1 ? "درس" : "دروس"}</span>
          </div>
          {stats.totalDuration > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
              <Clock className="h-4 w-4 text-primary/50" />
              <span className="font-semibold text-foreground/80">{formatDuration(stats.totalDuration)}</span>
              <span>مدة التعلم</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search & Controls */}
      <motion.div variants={itemVariants} className="flex items-center gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="ابحث في الدروس..."
            dir="rtl"
            className={cn(
              "flex h-10 w-full rounded-xl border bg-card/50",
              "px-4 py-2 pe-10 ps-3 text-sm",
              "text-foreground placeholder:text-muted-foreground/40",
              "border-border/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
              "focus-visible:border-primary/30",
              "transition-all duration-200",
            )}
          />
        </div>

        <motion.button
          type="button"
          onClick={toggleAll}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium",
            "text-muted-foreground/70 bg-card/50 border-border/40",
            "hover:bg-muted/50 hover:border-border/60",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
            "shrink-0",
          )}
          aria-label={allExpanded ? "طي الكل" : "توسيع الكل"}
        >
          {allExpanded ? (
            <>
              <ArrowUp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">طي الكل</span>
            </>
          ) : (
            <>
              <ArrowDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">توسيع الكل</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Modules */}
      <motion.div variants={itemVariants} className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredModules.length > 0 ? (
            filteredModules.map((mod, idx) => (
              <motion.div
                key={mod.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <ModuleAccordion
                  module={mod}
                  index={idx}
                  isEnrolled={isEnrolled}
                  onLockedClick={onLockedClick}
                  defaultExpanded={allExpanded || hasQuery || modules.length <= 3}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-2xl py-12",
                "border border-dashed border-border/40 bg-muted/10",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 border border-border/30">
                <Search className="h-5 w-5 text-muted-foreground/30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground/70">
                  لا توجد نتائج لـ &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="mt-1 text-xs text-muted-foreground/40">
                  جرّب كلمات بحث مختلفة
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
}

export const CurriculumNew = memo(CurriculumNewInner);
