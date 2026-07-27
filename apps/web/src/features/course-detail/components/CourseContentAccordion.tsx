"use client";

import { useState } from "react";
import {
  ChevronDown, PlayCircle, Lock, Clock, FileText, Headphones,
  ClipboardCheck, Radio, ExternalLink, FileVideo,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { PublicCourseModule, PublicCourseSection, PublicCourseLesson } from "@/features/public-course/types";

interface CourseContentAccordionProps {
  modules: PublicCourseModule[];
  isLoading: boolean;
  isEnrolled: boolean;
}

function formatLessonDuration(seconds: number | null): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}:${String(remainMins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatModuleDuration(seconds: number | null): string {
  if (!seconds) return "";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, "0")}`;
  return `${mins} دقيقة`;
}

function getLessonIcon(type: string) {
  const map: Record<string, React.ElementType> = {
    video: PlayCircle,
    text: FileText,
    pdf: FileVideo,
    exam: ClipboardCheck,
    audio: Headphones,
    live: Radio,
    external: ExternalLink,
  };
  return map[type] ?? PlayCircle;
}

function SectionView({ section, isEnrolled }: { section: PublicCourseSection; isEnrolled: boolean }) {
  return (
    <div className="bg-[var(--course-page-bg)]">
      {section.lessons.map((lesson) => {
        const canWatch = !section.locked || isEnrolled;
        const Icon = getLessonIcon(lesson.lessonType);

        return (
          <div
            key={lesson.id}
            className="flex items-center gap-3 border-b border-[var(--course-card-border)] px-4 py-3 last:border-b-0"
          >
            {canWatch && lesson.freePreview ? (
              <PlayCircle className="h-4 w-4 shrink-0 course-accent-text" />
            ) : canWatch ? (
              <Icon className="h-4 w-4 shrink-0 course-accent-text" />
            ) : (
              <Lock className="h-4 w-4 shrink-0 course-text-tertiary" />
            )}

            <span
              className={cn(
                "flex-1 text-sm",
                canWatch ? "font-medium course-text-primary" : "course-text-secondary",
              )}
            >
              {lesson.title}
            </span>

            <div className="flex items-center gap-1.5 text-xs course-text-tertiary">
              <Clock className="h-3 w-3" />
              {formatLessonDuration(lesson.durationSeconds ?? lesson.estimatedDuration)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CourseContentAccordion({ modules, isLoading, isEnrolled }: CourseContentAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    return modules.length > 0 ? modules[0]!.id : null;
  });

  const toggleSection = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 rounded bg-[var(--course-card-border)]" />
        <div className="h-4 w-64 rounded bg-[var(--course-card-border)]" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[var(--course-card-bg)]" />
          ))}
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold course-text-primary">محتوى الدورة</h2>
        <div className="course-card p-6 text-center">
          <p className="text-sm course-text-secondary">محتوى الدورة غير متاح حالياً.</p>
        </div>
      </div>
    );
  }

  const totalLessons = modules.reduce(
    (acc, m) => acc + m.sections.reduce((sa, s) => sa + s.lessonsCount, 0),
    0,
  );

  const totalSections = modules.reduce((acc, m) => acc + m.sectionsCount, 0);

  const totalDuration = modules.reduce(
    (acc, m) => acc + (m.estimatedDuration ?? 0),
    0,
  );

  const totalDurationFormatted = (() => {
    const hrs = Math.floor(totalDuration / 3600);
    const mins = Math.floor((totalDuration % 3600) / 60);
    if (hrs > 0) return `${hrs} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ""}`;
    return `${mins} دقيقة`;
  })();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold course-text-primary">محتوى الدورة</h2>
        <button
          type="button"
          onClick={() => setExpandedId(expandedId ? null : (modules[0]?.id ?? null))}
          className="text-sm font-medium course-accent-text hover:underline"
        >
          {expandedId ? "طي الكل" : "توسيع الكل"}
        </button>
      </div>

      <p className="text-sm course-text-secondary">
        {totalSections} قسم · {totalLessons} محاضرة · {totalDurationFormatted} إجمالي
      </p>

      {/* Modules accordion */}
      <div className="divide-y divide-[var(--course-card-border)] overflow-hidden rounded-xl border border-[var(--course-card-border)]">
        {modules.map((mod) => {
          const isExpanded = expandedId === mod.id;
          const sectionLessons = mod.sections.reduce((a, s) => a + s.lessonsCount, 0);

          return (
            <div key={mod.id}>
              {/* Module header */}
              <button
                type="button"
                onClick={() => toggleSection(mod.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-right transition-colors duration-200",
                  isExpanded
                    ? "bg-[var(--course-badge-bg)]"
                    : "bg-[var(--course-card-bg)] hover:bg-[var(--course-icon-bg)]",
                )}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 course-text-secondary transition-transform duration-300",
                    isExpanded && "rotate-180",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold course-text-primary truncate">
                    {mod.title}
                  </p>
                </div>
                <span className="text-xs course-text-tertiary whitespace-nowrap">
                  {sectionLessons} محاضرة · {formatModuleDuration(mod.estimatedDuration)}
                </span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div>
                  {mod.sections.length > 0 ? (
                    mod.sections.map((section) => (
                      <SectionView key={section.id} section={section} isEnrolled={isEnrolled} />
                    ))
                  ) : (
                    <div className="bg-[var(--course-page-bg)] px-4 py-6 text-center">
                      <p className="text-sm course-text-secondary">
                        محتوى هذا القسم متاح بعد الاشتراك
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div className="course-card flex items-center gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--course-badge-bg)]">
          <Lock className="h-4 w-4 course-accent-text" />
        </div>
        <p className="text-sm course-text-secondary">
          لديك وصول كامل إلى جميع محتويات الدورة بعد الاشتراك
        </p>
      </div>
    </div>
  );
}
