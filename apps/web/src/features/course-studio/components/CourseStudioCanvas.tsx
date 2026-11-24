"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, Layers, Pencil, Plus } from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
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
  const workbar = canvasView === "content" && selectedContent
    ? {
        icon: FileText,
        label: "وحدة المحتوى",
        title: selectedContent.title,
        action: onEditContent ? { label: "تعديل المحتوى", icon: Pencil, onClick: () => onEditContent(selectedContent) } : null,
      }
    : canvasView === "section" && selectedSection
      ? {
          icon: Layers,
          label: "القسم",
          title: selectedSection.title,
          action: onAddContent ? { label: "إضافة محتوى", icon: Plus, onClick: onAddContent } : null,
        }
      : canvasView === "lecture" && selectedLecture
        ? {
            icon: BookOpen,
            label: "المحاضرة",
            title: selectedLecture.title,
            action: onAddSection ? { label: "قسم جديد", icon: Plus, onClick: onAddSection } : null,
          }
        : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={cn("atlas-canvas flex min-w-0 flex-1 flex-col overflow-hidden", className)}
      role="region"
      aria-label="مساحة العمل"
    >
      <div className="atlas-workbar flex shrink-0 items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {workbar ? (
            <>
              <span className="atlas-row-icon hidden shrink-0 sm:flex">
                <workbar.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="atlas-section-label">{workbar.label}</p>
                <p className="truncate text-sm font-bold text-studio-fg">{workbar.title}</p>
              </div>
            </>
          ) : (
            <div>
              <p className="atlas-section-label">مساحة العمل</p>
              <p className="text-sm font-bold text-studio-fg">لوحة التحرير</p>
            </div>
          )}
        </div>
        {workbar?.action && (
          <StudioButton
            variant="primary"
            size="sm"
            icon={<workbar.action.icon className="h-4 w-4" />}
            onClick={workbar.action.onClick}
            className="shrink-0"
          >
            <span className="hidden sm:inline">{workbar.action.label}</span>
          </StudioButton>
        )}
      </div>

      <div className="studio-scrollbar flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {canvasView === "content" && selectedLecture && selectedSection && selectedContent ? (
            <motion.div
              key={`content-${selectedContent.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <CourseStudioContentOverview
                item={selectedContent}
                onEdit={onEditContent ? () => onEditContent(selectedContent) : undefined}
              />
            </motion.div>
          ) : canvasView === "section" && selectedLecture && selectedSection ? (
            <motion.div
              key={`section-${selectedSection.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
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
              <div className="mx-auto w-full max-w-6xl px-3 pb-10 sm:px-5">
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
              transition={{ duration: 0.22 }}
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
              primaryAction={onCreateLecture ? { label: "إنشاء محاضرة", onClick: onCreateLecture } : undefined}
              secondaryAction={onQuickStart ? { label: "مشاهدة دليل البدء السريع", onClick: onQuickStart } : undefined}
              shortcuts={shortcuts}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export { CourseStudioCanvas };
