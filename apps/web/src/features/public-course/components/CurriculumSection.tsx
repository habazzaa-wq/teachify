"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ListTree, Search, Layers, GraduationCap, Clock, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { CurriculumModule } from "./CurriculumModule";
import { SectionHeader } from "./primitives";
import { getCourseStats, formatDuration } from "../utils";
import type { PublicCourseLesson, PublicCourseModule } from "../types";

interface CurriculumSectionProps {
  modules: PublicCourseModule[];
  isEnrolled: boolean;
  onLockedClick: () => void;
  onPlay: (lesson: PublicCourseLesson) => void;
}

function filterModules(
  modules: PublicCourseModule[],
  query: string,
): PublicCourseModule[] {
  if (!query.trim()) return modules;
  const lower = query.toLowerCase().trim();

  return modules
    .map((mod) => {
      const sections = (mod.sections ?? [])
        .map((section) => {
          const lessons = (section.lessons ?? []).filter((lesson) =>
            lesson.title.toLowerCase().includes(lower),
          );
          if (lessons.length === 0) return null;
          return { ...section, lessons, lessonsCount: lessons.length };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      const modMatches = mod.title.toLowerCase().includes(lower);
      if (!modMatches && sections.length === 0) return null;

      return {
        ...mod,
        sections: modMatches ? mod.sections : sections,
        sectionsCount: sections.length,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
}

function CurriculumSectionInner({
  modules,
  isEnrolled,
  onLockedClick,
  onPlay,
}: CurriculumSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const stats = useMemo(() => getCourseStats(modules), [modules]);
  const filteredModules = useMemo(
    () => filterModules(modules, searchQuery),
    [modules, searchQuery],
  );
  const searchActive = searchQuery.trim().length > 0;

  const allExpanded = useMemo(
    () =>
      filteredModules.length > 0 &&
      filteredModules.every((m) => expandedModules.has(m.id) || searchActive),
    [filteredModules, expandedModules, searchActive],
  );

  const toggleModule = useCallback((id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setExpandedModules(new Set());
      setExpandedSections(new Set());
    } else {
      const moduleIds = new Set<string>();
      const sectionIds = new Set<string>();
      for (const mod of filteredModules) {
        moduleIds.add(mod.id);
        for (const section of mod.sections ?? []) sectionIds.add(section.id);
      }
      setExpandedModules(moduleIds);
      setExpandedSections(sectionIds);
    }
  }, [allExpanded, filteredModules]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    [],
  );

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.07,
        delayChildren: 0.05,
      },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={sectionVariants}
      dir="rtl"
      className="space-y-5"
    >
      <SectionHeader
        icon={<ListTree className="h-5 w-5" />}
        title="محتوى الدورة"
        subtitle="تصفّح جميع المحاضرات والأقسام قبل الاشتراك"
      />

      {/* Stats chips */}
      <motion.div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/80">
          <Layers className="h-4 w-4 text-[var(--brand-primary)]" />
          <b className="tabular-nums text-foreground">{stats.sections}</b>
          {stats.sections === 1 ? "قسم" : "أقسام"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/80">
          <GraduationCap className="h-4 w-4 text-[var(--brand-primary)]" />
          <b className="tabular-nums text-foreground">{stats.lessons}</b>
          {stats.lessons === 1 ? "درس" : "درسًا"}
        </span>
        {stats.duration > 0 && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/80">
            <Clock className="h-4 w-4 text-[var(--brand-primary)]" />
            <b className="tabular-nums text-foreground">{formatDuration(stats.duration)}</b>
            مدة التعلم
          </span>
        )}
      </motion.div>

      {/* Search & controls */}
      <motion.div className="flex items-center gap-2.5">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="ابحث في الدروس..."
            dir="rtl"
            aria-label="البحث في الدروس"
            className={cn(
              "flex h-10 w-full rounded-xl border bg-card/60 px-4 py-2 pe-10 ps-3 text-sm text-foreground",
              "border-border/50 placeholder:text-muted-foreground/40",
              "transition-all duration-200 focus-visible:border-[rgb(var(--brand-primary-rgb)/0.4)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary-rgb)/0.25)]",
            )}
          />
        </div>

        <button
          type="button"
          onClick={toggleAll}
          aria-label={allExpanded ? "طي الكل" : "توسيع الكل"}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all duration-200",
            "border-border/50 bg-card/60 text-muted-foreground/80 hover:border-[rgb(var(--brand-primary-rgb)/0.3)] hover:text-[var(--brand-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary-rgb)/0.25)]",
          )}
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
        </button>
      </motion.div>

      {/* Modules list */}
      <motion.div className="space-y-3">
        {filteredModules.length > 0 ? (
          filteredModules.map((mod) => (
            <CurriculumModule
              key={mod.id}
              module={mod}
              isEnrolled={isEnrolled}
              onLockedClick={onLockedClick}
              onPlay={onPlay}
              isExpanded={searchActive || expandedModules.has(mod.id)}
              onToggle={() => toggleModule(mod.id)}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-card/50 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
              <Search className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-muted-foreground/80">
                {searchActive
                  ? `لا توجد نتائج لـ "${searchQuery}"`
                  : "لا يوجد محتوى لهذه الدورة بعد"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                {searchActive ? "جرّب كلمات بحث مختلفة" : "تحقق لاحقًا"}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.section>
  );
}

const CurriculumSection = memo(CurriculumSectionInner);

export { CurriculumSection };
export type { CurriculumSectionProps };
