"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { CourseStudioLectureOverview } from "./CourseStudioLectureOverview";
import { CourseStudioSectionOverview } from "./CourseStudioSectionOverview";
import { CourseStudioContentOverview } from "./CourseStudioContentOverview";
import { CourseStudioContentList } from "./CourseStudioContentList";
import { CourseStudioOnboarding, type KeyboardShortcut } from "./CourseStudioOnboarding";
import type { CourseModule } from "@/features/course-modules/types";
import type { CourseSection } from "@/features/course-sections/types";
import type { ContentItem } from "@/features/course-content/types";

export type CanvasView = "lecture" | "section" | "content";

interface CourseStudioCanvasProps {
  selectedLecture: CourseModule | null;
  selectedSection: CourseSection | null;
  selectedContent: ContentItem | null;
  lectureSections?: CourseSection[];
  sectionContents?: ContentItem[];
  canvasView: CanvasView | null;
  onCreateLecture?: () => void;
  onAddSection?: () => void;
  onAddContent?: () => void;
  onEditSection?: (section: CourseSection) => void;
  onDuplicateSection?: (section: CourseSection) => void;
  onArchiveSection?: (section: CourseSection) => void;
  onDeleteSection?: (section: CourseSection) => void;
  onRestoreSection?: (section: CourseSection) => void;
  onSelectContent?: (id: string) => void;
  onEditContent?: (item: ContentItem) => void;
  onPublishContent?: (item: ContentItem) => void;
  onArchiveContent?: (item: ContentItem) => void;
  onDuplicateContent?: (item: ContentItem) => void;
  onDeleteContent?: (item: ContentItem) => void;
  onRestoreContent?: (item: ContentItem) => void;
  onToggleFreePreview?: (item: ContentItem) => void;
  onReorderContent?: (items: ContentItem[], fromIndex: number, toIndex: number) => void;
  onQuickStart?: () => void;
  className?: string;
}

const shortcuts: KeyboardShortcut[] = [
  { keys: ["⌘", "B"], label: "إظهار/إخفاء المستكشف" },
  { keys: ["⌘", "I"], label: "إظهار/إخفاء الخصائص" },
  { keys: ["⌘", "K"], label: "فتح البحث" },
  { keys: ["⌘", "Enter"], label: "نشر الدورة" },
];

function CourseStudioCanvas({
  selectedLecture,
  selectedSection,
  selectedContent,
  lectureSections,
  sectionContents,
  canvasView,
  onCreateLecture,
  onAddSection,
  onAddContent,
  onEditSection,
  onDuplicateSection,
  onArchiveSection,
  onDeleteSection,
  onRestoreSection,
  onSelectContent,
  onEditContent,
  onPublishContent,
  onArchiveContent,
  onDuplicateContent,
  onDeleteContent,
  onRestoreContent,
  onToggleFreePreview,
  onReorderContent,
  onQuickStart,
  className,
}: CourseStudioCanvasProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex min-w-0 flex-1 flex-col overflow-hidden bg-studio-bg",
        className,
      )}
      role="region"
      aria-label="مساحة العمل"
    >
      <div className="flex-1 overflow-y-auto studio-scrollbar">
        <AnimatePresence mode="wait">
          {canvasView === "content" && selectedLecture && selectedSection && selectedContent ? (
            <motion.div
              key={`content-${selectedContent.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <CourseStudioContentOverview item={selectedContent} />
            </motion.div>
          ) : canvasView === "section" && selectedLecture && selectedSection ? (
            <motion.div
              key={`section-${selectedSection.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <CourseStudioSectionOverview
                section={selectedSection}
                lecture={selectedLecture}
                onAddContent={onAddContent}
                onEdit={onEditSection}
                onDuplicate={onDuplicateSection}
                onArchive={onArchiveSection}
                onDelete={onDeleteSection}
                onRestore={onRestoreSection}
              />
              <div className="mx-auto w-full max-w-3xl px-6 pb-8 md:px-8">
                <CourseStudioContentList
                  items={sectionContents ?? []}
                  selectedId={selectedContent?.id ?? null}
                  onSelect={onSelectContent ?? (() => {})}
                  onAddContent={onAddContent}
                  onEdit={onEditContent}
                  onPublish={onPublishContent}
                  onArchive={onArchiveContent}
                  onDuplicate={onDuplicateContent}
                  onDelete={onDeleteContent}
                  onRestore={onRestoreContent}
                  onToggleFreePreview={onToggleFreePreview}
                  onReorder={onReorderContent}
                />
              </div>
            </motion.div>
          ) : canvasView === "lecture" && selectedLecture ? (
            <motion.div
              key={`lecture-${selectedLecture.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <CourseStudioLectureOverview
                lecture={selectedLecture}
                sections={lectureSections}
                onAddSection={onAddSection}
              />
            </motion.div>
          ) : (
            <CourseStudioOnboarding
              key="onboarding"
              variant="canvas"
              title="ابدأ ببناء منهجك التعليمي"
              description="قم بإضافة المحاضرات والأقسام والمحتوى التفاعلي لبناء دورة تعليمية متكاملة. استخدم الأدوات المتاحة لتنظيم وتحرير المحتوى الخاص بك."
              primaryAction={
                onCreateLecture
                  ? { label: "إنشاء محاضرة", onClick: onCreateLecture }
                  : undefined
              }
              secondaryAction={
                onQuickStart
                  ? { label: "مشاهدة دليل البدء السريع", onClick: onQuickStart }
                  : undefined
              }
              shortcuts={shortcuts}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export { CourseStudioCanvas };
