"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import {
  Search,
  Layers,
  GraduationCap,
  Clock,
  ArrowUp,
  ArrowDown,
  List,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CurriculumModule } from "./CurriculumModule";
import type { PublicCourseModule } from "../types";

interface CurriculumSectionProps {
  modules: PublicCourseModule[];
  isEnrolled: boolean;
  onLockedClick: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs} س ${mins} د`;
  if (hrs > 0) return `${hrs} ساعة`;
  if (mins > 0) return `${mins} دقيقة`;
  return `${seconds} ثانية`;
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

function filterModules(
  modules: PublicCourseModule[],
  query: string,
): PublicCourseModule[] {
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
      return {
        ...mod,
        sections: filteredSections,
        sectionsCount: filteredSections.length,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
}

function CurriculumSectionInner({
  modules,
  isEnrolled,
  onLockedClick,
}: CurriculumSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allExpanded, setAllExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const stats = useMemo(() => getAggregateStats(modules), [modules]);

  const filteredModules = useMemo(
    () => filterModules(modules, searchQuery),
    [modules, searchQuery],
  );

  const hasQuery = searchQuery.trim().length > 0;

  const toggleAll = useCallback(() => {
    setAllExpanded((prev) => !prev);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      if (e.target.value.trim()) {
        setAllExpanded(true);
      }
    },
    [],
  );

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
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
      className="space-y-5 sm:space-y-6"
      dir="rtl"
    >
      {/* Section Header */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-primary/10 to-primary/5",
              "dark:from-primary/15 dark:to-primary/[0.03]",
              "border border-primary/10 dark:border-primary/15",
            )}
          >
            <List className="h-5 w-5 text-primary/70 dark:text-primary/60" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              محتوى الدورة
            </h2>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70 dark:text-muted-foreground/60">
            <Layers className="h-4 w-4 text-primary/50 dark:text-primary/40" />
            <span className="font-semibold tabular-nums text-foreground/80 dark:text-foreground/70">
              {stats.totalSections}
            </span>
            <span>{stats.totalSections === 1 ? "قسم" : "أقسام"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70 dark:text-muted-foreground/60">
            <GraduationCap className="h-4 w-4 text-primary/50 dark:text-primary/40" />
            <span className="font-semibold tabular-nums text-foreground/80 dark:text-foreground/70">
              {stats.totalLessons}
            </span>
            <span>{stats.totalLessons === 1 ? "درس" : "دروس"}</span>
          </div>
          {stats.totalDuration > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70 dark:text-muted-foreground/60">
              <Clock className="h-4 w-4 text-primary/50 dark:text-primary/40" />
              <span className="font-semibold text-foreground/80 dark:text-foreground/70">
                {formatDuration(stats.totalDuration)}
              </span>
              <span>مدة التعلم</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search & Controls Bar */}
      <motion.div variants={itemVariants} className="flex items-center gap-2.5">
        {/* Search Input */}
        <div
          className={cn(
            "relative flex-1 max-w-md",
          )}
        >
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40 dark:text-muted-foreground/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="ابحث في الدروس..."
            dir="rtl"
            className={cn(
              "flex h-10 w-full rounded-xl border bg-background/60 dark:bg-white/[0.03]",
              "px-4 py-2 pe-10 ps-3 text-sm",
              "text-foreground placeholder:text-muted-foreground/40 dark:placeholder:text-muted-foreground/30",
              "border-border/40 dark:border-white/[0.08]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/15",
              "focus-visible:border-primary/30 dark:focus-visible:border-primary/20",
              "transition-all duration-200",
            )}
          />
        </div>

        {/* Expand / Collapse All */}
        <motion.button
          type="button"
          onClick={toggleAll}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium",
            "text-muted-foreground/70 dark:text-muted-foreground/60",
            "bg-background/60 dark:bg-white/[0.03]",
            "border-border/40 dark:border-white/[0.08]",
            "hover:bg-muted/50 dark:hover:bg-white/[0.05]",
            "hover:border-border/60 dark:hover:border-white/[0.12]",
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

      {/* Modules Accordion */}
      <motion.div variants={itemVariants} className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredModules.length > 0 ? (
            filteredModules.map((mod, idx) => (
              <motion.div
                key={mod.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.35,
                  delay: idx * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <CurriculumModule
                  module={mod}
                  isEnrolled={isEnrolled}
                  onLockedClick={onLockedClick}
                  defaultExpanded={allExpanded || hasQuery}
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
                "border border-dashed border-border/40 dark:border-white/[0.08]",
                "bg-muted/20 dark:bg-white/[0.01]",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  "bg-muted/50 dark:bg-white/[0.04]",
                  "border border-border/30 dark:border-white/[0.06]",
                )}
              >
                <Search className="h-5 w-5 text-muted-foreground/30 dark:text-muted-foreground/25" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground/70 dark:text-muted-foreground/60">
                  لا توجد نتائج لـ &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="mt-1 text-xs text-muted-foreground/40 dark:text-muted-foreground/30">
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

const CurriculumSection = memo(CurriculumSectionInner);

export { CurriculumSection };
export type { CurriculumSectionProps };
