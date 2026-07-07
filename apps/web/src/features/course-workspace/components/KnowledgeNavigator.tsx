"use client";

import { motion } from "framer-motion";
import { Layers, Plus } from "lucide-react";
import { AppButton, Skeleton, PermissionGuard } from "@/components/ui";
import { KnowledgeLecture } from "./KnowledgeLecture";
import type { CourseModule } from "@/features/course-content/types";
import type { CourseModuleSection, ContentItem } from "@/features/course-content/types";
import { estimateDurationMinutes } from "@/features/course-content/utils";

interface KnowledgeNavigatorProps {
  modules: CourseModule[];
  loading?: boolean;
  selectedLectureId?: string | null;
  selectedSectionId?: string | null;
  selectedItemId?: string | null;
  onSelectLecture: (lecture: CourseModule) => void;
  onSelectSection: (section: CourseModuleSection) => void;
  onSelectItem: (item: ContentItem) => void;
  onAddLecture?: () => void;
  onAddSection?: (lectureId: string) => void;
  onAddContent?: (sectionId: string) => void;
  onEditLecture?: (lecture: CourseModule) => void;
  onDuplicateLecture?: (lecture: CourseModule) => void;
  onPublishLecture?: (lecture: CourseModule) => void;
  onArchiveLecture?: (lecture: CourseModule) => void;
  onDeleteLecture?: (lecture: CourseModule) => void;
  onEditSection?: (section: CourseModuleSection) => void;
  onDuplicateSection?: (section: CourseModuleSection) => void;
  onPublishSection?: (section: CourseModuleSection) => void;
  onArchiveSection?: (section: CourseModuleSection) => void;
  onDeleteSection?: (section: CourseModuleSection) => void;
}

function KnowledgeNavigator({
  modules,
  loading,
  selectedLectureId,
  selectedSectionId,
  selectedItemId,
  onSelectLecture,
  onSelectSection,
  onSelectItem,
  onAddLecture,
  onAddSection,
  onAddContent,
  onEditLecture,
  onDuplicateLecture,
  onPublishLecture,
  onArchiveLecture,
  onDeleteLecture,
  onEditSection,
  onDuplicateSection,
  onPublishSection,
  onArchiveSection,
  onDeleteSection,
}: KnowledgeNavigatorProps) {
  const totalDuration = modules.reduce(
    (sum, m) => sum + (m.durationMinutes ?? 0) + m.sections.reduce((s, sec) => s + (sec.durationMinutes ?? 0), 0),
    0,
  );
  const totalContent = modules.reduce(
    (sum, m) => sum + m.sections.reduce((s, sec) => s + sec.items.length, 0),
    0,
  );

  if (loading) {
    return (
      <div className="space-y-2 px-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 gap-4"
      >
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center ring-4 ring-background/50">
          <Layers className="h-7 w-7 text-primary/25" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-muted-foreground/60">لم تتم إضافة محاضرات بعد</p>
          <p className="text-xs text-muted-foreground/40">أضف أول محاضرة لبدء بناء المنهج</p>
        </div>
        <PermissionGuard permission="modules.create">
          <AppButton size="sm" className="rounded-xl gap-1.5 text-xs h-8" onClick={onAddLecture}>
            <Plus className="h-3.5 w-3.5" />
            إضافة محاضرة
          </AppButton>
        </PermissionGuard>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1">
      {modules.map((lecture, index) => (
        <KnowledgeLecture
          key={lecture.id}
          lecture={lecture}
          index={index}
          selectedSectionId={selectedSectionId}
          selectedItemId={selectedItemId}
          onSelectLecture={onSelectLecture}
          onSelectSection={onSelectSection}
          onSelectItem={onSelectItem}
          onAddSection={onAddSection}
          onAddContent={onAddContent}
          onEditLecture={onEditLecture}
          onDuplicateLecture={onDuplicateLecture}
          onPublishLecture={onPublishLecture}
          onArchiveLecture={onArchiveLecture}
          onDeleteLecture={onDeleteLecture}
          onEditSection={onEditSection}
          onDuplicateSection={onDuplicateSection}
          onPublishSection={onPublishSection}
          onArchiveSection={onArchiveSection}
          onDeleteSection={onDeleteSection}
        />
      ))}
    </div>
  );
}

export { KnowledgeNavigator };
