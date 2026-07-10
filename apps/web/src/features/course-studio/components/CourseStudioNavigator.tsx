"use client";

import { useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
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

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0, minWidth: 0 }}
          animate={{ width, opacity: 1, minWidth: width }}
          exit={{ width: 0, opacity: 0, minWidth: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "shrink-0 overflow-hidden border-e border-studio-border bg-studio-surface",
            className,
          )}
          role="navigation"
          aria-label="مستكشف المحتوى"
        >
          <div style={{ width }} className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-studio-border px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-studio-fg-muted">
                المحتوى التعليمي
              </h3>
              {onCreateLecture && (
                <StudioButton
                  variant="ghost"
                  size="icon"
                  onClick={onCreateLecture}
                  aria-label="إضافة محاضرة"
                  className="h-7 w-7"
                >
                  <Plus className="h-3.5 w-3.5" />
                </StudioButton>
              )}
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto studio-scrollbar p-2"
              role="tree"
              aria-label="قائمة المحاضرات"
            >
              {isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-lg bg-studio-skeleton"
                    />
                  ))}
                </div>
              ) : hasLectures ? (
                <div className="space-y-0.5">
                  {lectures.map((lecture) => (
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
                    />
                  ))}
                </div>
              ) : (
                <CourseStudioOnboarding
                  variant="navigator"
                  title="لا توجد محاضرات بعد"
                  description="ابدأ بإضافة محاضرات لبناء منهج الكورس."
                  primaryAction={
                    onCreateLecture
                      ? {
                          label: "إنشاء أول محاضرة",
                          onClick: onCreateLecture,
                        }
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export { CourseStudioNavigator };
