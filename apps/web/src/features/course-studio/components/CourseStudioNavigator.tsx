"use client";

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { CourseStudioLectureItem } from "./CourseStudioLectureItem";
import { CourseStudioOnboarding } from "./CourseStudioOnboarding";
import type { CourseModule } from "@/features/course-modules/types";
import type { CourseSection } from "@/features/course-sections/types";

interface CourseStudioNavigatorProps {
  open: boolean;
  width: number;
  lectures: CourseModule[];
  sections?: Record<string, CourseSection[]>;
  courseId?: string;
  selectedLectureId: string | null;
  selectedSectionId?: string | null;
  expandedLectures?: string[];
  isLoading?: boolean;
  variant?: "sidebar" | "drawer";
  onSelectLecture: (id: string) => void;
  onToggleLecture?: (id: string) => void;
  onSelectSection?: (id: string) => void;
  onCreateLecture?: () => void;
  onEditLecture?: (lecture: CourseModule) => void;
  onPublishLecture?: (lecture: CourseModule) => void;
  onArchiveLecture?: (lecture: CourseModule) => void;
  onDuplicateLecture?: (lecture: CourseModule) => void;
  onDeleteLecture?: (lecture: CourseModule) => void;
  onRestoreLecture?: (lecture: CourseModule) => void;
  onReorder?: (lectures: CourseModule[], fromIndex: number, toIndex: number) => void;
  onEditSection?: (section: CourseSection) => void;
  onPublishSection?: (section: CourseSection) => void;
  onArchiveSection?: (section: CourseSection) => void;
  onDuplicateSection?: (section: CourseSection) => void;
  onDeleteSection?: (section: CourseSection) => void;
  onRestoreSection?: (section: CourseSection) => void;
  onAddSection?: (lectureId: string) => void;
  onReorderSections?: (courseId: string, sections: Array<{ id: number; sort_order: number }>) => void;
  className?: string;
}

function CourseStudioNavigator({
  open,
  width,
  lectures,
  sections,
  courseId,
  selectedLectureId,
  selectedSectionId,
  expandedLectures,
  isLoading,
  variant = "sidebar",
  onSelectLecture,
  onToggleLecture,
  onSelectSection,
  onCreateLecture,
  onEditLecture,
  onPublishLecture,
  onArchiveLecture,
  onDuplicateLecture,
  onDeleteLecture,
  onRestoreLecture,
  onReorder,
  onEditSection,
  onPublishSection,
  onArchiveSection,
  onDuplicateSection,
  onDeleteSection,
  onRestoreSection,
  onAddSection,
  onReorderSections,
  className,
}: CourseStudioNavigatorProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<number | null>(null);
  const [query, setQuery] = useState("");

  const filteredLectures = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return lectures;
    return lectures.filter((lecture) => {
      if (lecture.title.toLocaleLowerCase().includes(needle)) return true;
      return (sections?.[lecture.id] ?? []).some((section) =>
        section.title.toLocaleLowerCase().includes(needle),
      );
    });
  }, [lectures, sections, query]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, lecture: CourseModule) => {
      dragItem.current = lectures.findIndex((l) => l.id === lecture.id);
      e.dataTransfer.effectAllowed = "move";
    },
    [lectures],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, lecture: CourseModule) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, lecture: CourseModule) => {
      e.preventDefault();
      if (dragItem.current === null) return;
      const toIndex = lectures.findIndex((l) => l.id === lecture.id);
      if (dragItem.current === toIndex) return;
      onReorder?.(lectures, dragItem.current, toIndex);
      dragItem.current = null;
    },
    [lectures, onReorder],
  );

  const sectionDragItem = useRef<{ lectureId: string; index: number } | null>(null);

  const handleSectionDragStart = useCallback(
    (e: React.DragEvent, section: CourseSection) => {
      const lectureEntry = Object.entries(sections ?? {}).find(
        ([, secs]) => secs.some((s) => s.id === section.id),
      );
      if (lectureEntry) {
        const idx = lectureEntry[1].findIndex((s) => s.id === section.id);
        sectionDragItem.current = { lectureId: lectureEntry[0], index: idx };
      }
      e.dataTransfer.effectAllowed = "move";
    },
    [sections],
  );

  const handleSectionDrop = useCallback(
    (e: React.DragEvent, targetSection: CourseSection) => {
      e.preventDefault();
      if (!sectionDragItem.current || !courseId || !onReorderSections) {
        sectionDragItem.current = null;
        return;
      }
      const { lectureId: fromLectureId, index: fromIndex } = sectionDragItem.current;
      const targetLectureEntry = Object.entries(sections ?? {}).find(
        ([, secs]) => secs.some((s) => s.id === targetSection.id),
      );
      if (!targetLectureEntry) {
        sectionDragItem.current = null;
        return;
      }
      const toLectureId = targetLectureEntry[0];
      const targetSecs = targetLectureEntry[1];
      const toIndex = targetSecs.findIndex((s) => s.id === targetSection.id);
      if (fromLectureId === toLectureId && fromIndex === toIndex) {
        sectionDragItem.current = null;
        return;
      }
      const sourceSecs = sections?.[fromLectureId] ?? [];
      const updated = [...sourceSecs];
      const moved = updated.splice(fromIndex, 1)[0];
      if (!moved) {
        sectionDragItem.current = null;
        return;
      }
      if (fromLectureId === toLectureId) {
        updated.splice(toIndex, 0, moved);
      }
      const reordered = updated.map((s, i) => ({
        id: parseInt(s.id, 10),
        sort_order: i + 1,
      }));
      onReorderSections(courseId, reordered);
      sectionDragItem.current = null;
    },
    [sections, courseId],
  );

  const handleSectionDragOver = useCallback(
    (e: React.DragEvent, _section: CourseSection) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const isSectionFocused = !!selectedSectionId;

      if (isTyping) return;

      if (isSectionFocused && onSelectSection) {
        const flatSections = Object.values(sections ?? {}).flat();
        const currentIndex = flatSections.findIndex((s) => s.id === selectedSectionId);
        if (currentIndex === -1) return;
        const currentSection = flatSections[currentIndex];
        if (!currentSection) return;

        let nextIndex = currentIndex;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          nextIndex = Math.min(currentIndex + 1, flatSections.length - 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          nextIndex = Math.max(currentIndex - 1, 0);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (onSelectLecture && currentSection.courseModuleId) {
            onSelectLecture(currentSection.courseModuleId);
          } else if (onSelectLecture && lectures[0]) {
            onSelectLecture(lectures[0].id);
          }
          return;
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          if (onSelectLecture && currentSection.courseModuleId) {
            onSelectLecture(currentSection.courseModuleId);
          } else if (onSelectLecture && lectures[0]) {
            onSelectLecture(lectures[0].id);
          }
          return;
        } else if (e.key === "Home") {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === "End") {
          e.preventDefault();
          nextIndex = flatSections.length - 1;
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectSection(currentSection.id);
          return;
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          if (!currentSection.deletedAt) {
            onDeleteSection?.(currentSection);
          }
          return;
        }

        if (nextIndex !== currentIndex) {
          const nextSection = flatSections[nextIndex];
          if (nextSection) {
            onSelectSection(nextSection.id);
            requestAnimationFrame(() => {
              const el = document.querySelector(`[data-section-id="${nextSection.id}"]`);
              if (el) {
                (el as HTMLElement).focus();
                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
            });
          }
        }
        return;
      }

      const currentIndex = lectures.findIndex((l) => l.id === selectedLectureId);
      if (currentIndex === -1) return;
      const currentLecture = lectures[currentIndex];
      if (!currentLecture) return;
      let nextIndex = currentIndex;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = Math.min(currentIndex + 1, lectures.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (onToggleLecture) {
          onToggleLecture(currentLecture.id);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (onToggleLecture && !expandedLectures?.includes(currentLecture.id)) {
          onToggleLecture(currentLecture.id);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = lectures.length - 1;
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (currentLecture && !currentLecture.deletedAt) {
          e.preventDefault();
          onDeleteLecture?.(currentLecture);
        }
      }
      if (nextIndex !== currentIndex) {
        const nextLecture = lectures[nextIndex];
        if (nextLecture) onSelectLecture(nextLecture.id);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, lectures, selectedLectureId, selectedSectionId, expandedLectures, sections, onSelectLecture, onSelectSection, onDeleteLecture, onDeleteSection, onArchiveSection, onRestoreSection, onToggleLecture]);

  const hasLectures = lectures.length > 0;
  const noSearchResults = query.trim().length > 0 && filteredLectures.length === 0;
  const isFloating = className?.includes("nova-float-panel") ?? false;

  const content = (
    <div style={!isFloating && variant === "sidebar" ? { width } : undefined} className="nova-nav flex h-full flex-col">
      <div className="nova-nav-head shrink-0 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="nova-eyebrow">مساحة التحرير</p>
            <h3 className="mt-0.5 text-sm font-semibold text-studio-fg">منهج الدورة</h3>
          </div>
          <span className="nova-count-pill" aria-label={`${lectures.length} محاضرة`}>
            {lectures.length}
          </span>
        </div>

        <label className="nova-search mt-3 flex h-10 items-center gap-2 rounded-xl px-3">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن محاضرة أو قسم…"
            aria-label="البحث في منهج الدورة"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="مسح البحث"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-studio-fg-subtle hover:bg-studio-soft hover:text-studio-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        {onCreateLecture && (
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button type="button" onClick={onCreateLecture} className="nova-nav-add flex-1 gap-1.5">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              محاضرة جديدة
            </button>
            <span className="hidden text-[10px] text-studio-fg-subtle sm:block">اسحب لإعادة الترتيب</span>
          </div>
        )}
      </div>

      <div ref={listRef} className="studio-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2" role="tree" aria-label="قائمة المحاضرات">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-studio-skeleton" />
            ))}
          </div>
        ) : noSearchResults ? (
          <div className="rounded-xl border border-dashed border-studio-border bg-studio-soft/40 p-5 text-center">
            <Search className="mx-auto h-5 w-5 text-studio-fg-subtle" aria-hidden="true" />
            <p className="mt-2 text-xs font-medium text-studio-fg">لا توجد نتائج مطابقة</p>
            <p className="mt-1 text-[11px] text-studio-fg-muted">جرّب كلمة مختلفة أو امسح البحث.</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-3 rounded-lg border border-studio-border bg-studio-surface px-3 py-1.5 text-xs font-medium text-studio-accent hover:bg-studio-accent-soft"
            >
              مسح البحث
            </button>
          </div>
        ) : hasLectures ? (
          <div className="space-y-1">
            {filteredLectures.map((lecture) => {
              const originalIndex = lectures.findIndex((l) => l.id === lecture.id);
              return (
                <CourseStudioLectureItem
                  key={lecture.id}
                  lecture={lecture}
                  sections={sections?.[lecture.id]}
                  isSelected={selectedLectureId === lecture.id}
                  isExpanded={expandedLectures?.includes(lecture.id) ?? false}
                  selectedSectionId={selectedSectionId}
                  onSelect={onSelectLecture}
                  onToggle={() => onToggleLecture?.(lecture.id)}
                  onEdit={onEditLecture ?? (() => {})}
                  onPublish={onPublishLecture ?? (() => {})}
                  onArchive={onArchiveLecture ?? (() => {})}
                  onDuplicate={onDuplicateLecture ?? (() => {})}
                  onDelete={onDeleteLecture ?? (() => {})}
                  onRestore={onRestoreLecture ?? (() => {})}
                  onSelectSection={onSelectSection}
                  onEditSection={onEditSection}
                  onPublishSection={onPublishSection}
                  onArchiveSection={onArchiveSection}
                  onDuplicateSection={onDuplicateSection}
                  onDeleteSection={onDeleteSection}
                  onRestoreSection={onRestoreSection}
                  onAddSection={onAddSection ? () => onAddSection(lecture.id) : undefined}
                  onDragSectionStart={handleSectionDragStart}
                  onDragSectionOver={handleSectionDragOver}
                  onDropSection={handleSectionDrop}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onMoveUp={originalIndex > 0 && onReorder ? () => onReorder(lectures, originalIndex, originalIndex - 1) : undefined}
                  onMoveDown={originalIndex < lectures.length - 1 && onReorder ? () => onReorder(lectures, originalIndex, originalIndex + 1) : undefined}
                />
              );
            })}
          </div>
        ) : (
          <CourseStudioOnboarding
            variant="navigator"
            title="لا توجد محاضرات بعد"
            description="ابدأ بإضافة محاضرات لبناء منهج الكورس."
            primaryAction={onCreateLecture ? { label: "إنشاء أول محاضرة", onClick: onCreateLecture } : undefined}
          />
        )}
      </div>
    </div>
  );

  if (variant === "drawer") {
    return open ? <div className={cn("nova-nav flex h-full flex-col", className)}>{content}</div> : null;
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: -18, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -18, scale: 0.98 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className={cn("nova-float-panel nova-float-navigator shrink-0 overflow-hidden", className)}
          role="navigation"
          aria-label="متصفح المحتوى"
        >
          {content}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
export { CourseStudioNavigator };
