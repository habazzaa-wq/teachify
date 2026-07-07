"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Clock,
  BookOpen,
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Send,
  Archive,
  Trash2,
  FileText,
  CheckCircle2,
  Circle,
  GripVertical,
} from "lucide-react";
import { KnowledgeSection } from "./KnowledgeSection";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  PermissionGuard,
} from "@/components/ui";
import type { CourseModule } from "@/features/course-content/types";
import type { CourseModuleSection, ContentItem } from "@/features/course-content/types";
import { cn } from "@/lib/cn";

interface KnowledgeLectureProps {
  lecture: CourseModule;
  index: number;
  selectedSectionId?: string | null;
  selectedItemId?: string | null;
  onSelectLecture: (lecture: CourseModule) => void;
  onSelectSection: (section: CourseModuleSection) => void;
  onSelectItem: (item: ContentItem) => void;
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

function KnowledgeLecture({
  lecture,
  index,
  selectedSectionId,
  selectedItemId,
  onSelectLecture,
  onSelectSection,
  onSelectItem,
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
}: KnowledgeLectureProps) {
  const [expanded, setExpanded] = useState(index === 0);
  const toggleExpanded = useCallback(() => setExpanded((o) => !o), []);

  const handleLectureClick = useCallback(() => {
    onSelectLecture(lecture);
    setExpanded(true);
  }, [onSelectLecture, lecture]);

  const sections = lecture.sections ?? [];
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const isSelected = false;

  return (
    <div className="group/lecture">
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-2 rounded-xl transition-all duration-200 cursor-pointer",
          "hover:bg-muted/40",
        )}
      >
        {/* DRAG HANDLE */}
        <button
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/10 hover:text-foreground hover:bg-muted/30 cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover/lecture:opacity-100"
          aria-label="سحب لإعادة الترتيب"
          tabIndex={-1}
        >
          <GripVertical className="h-3 w-3" />
        </button>

        {/* EXPAND TOGGLE */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/30 hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label={expanded ? "طي" : "توسيع"}
          aria-expanded={expanded}
        >
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>

        {/* ICON */}
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/[0.08] text-[10px] font-bold text-primary/70 shrink-0">
          {index + 1}
        </span>

        {/* TITLE */}
        <div className="min-w-0 flex-1" onClick={handleLectureClick}>
          <span className="text-xs font-semibold truncate block leading-tight">{lecture.title}</span>
          <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1.5">
            <span>{sections.length} أقسام</span>
            <span>·</span>
            <span>{totalItems} محتوى</span>
            {lecture.durationMinutes != null && lecture.durationMinutes > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {lecture.durationMinutes}د
                </span>
              </>
            )}
          </span>
        </div>

        {/* STATUS */}
        <span className="shrink-0">
          {lecture.status === "published" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground/20" />
          )}
        </span>

        {/* CONTEXT MENU */}
        <PermissionGuard permission="modules.update">
          <AppDropdownMenu>
            <AppDropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/20 hover:text-foreground hover:bg-muted/50 transition-all opacity-0 group-hover/lecture:opacity-100"
                aria-label="خيارات"
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </AppDropdownMenuTrigger>
            <AppDropdownMenuContent align="end" className="w-40">
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditLecture?.(lecture); }}>
                <Pencil className="h-3.5 w-3.5 ms-2" />
                تعديل
              </AppDropdownMenuItem>
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicateLecture?.(lecture); }}>
                <Copy className="h-3.5 w-3.5 ms-2" />
                نسخ
              </AppDropdownMenuItem>
              {lecture.status !== "published" && (
                <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onPublishLecture?.(lecture); }}>
                  <Send className="h-3.5 w-3.5 ms-2" />
                  نشر
                </AppDropdownMenuItem>
              )}
              <AppDropdownMenuSeparator />
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchiveLecture?.(lecture); }}>
                <Archive className="h-3.5 w-3.5 ms-2" />
                أرشفة
              </AppDropdownMenuItem>
              <AppDropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDeleteLecture?.(lecture); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 ms-2" />
                حذف
              </AppDropdownMenuItem>
            </AppDropdownMenuContent>
          </AppDropdownMenu>
        </PermissionGuard>
      </div>

      {/* SECTIONS LIST */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 py-1 pe-1 me-2 border-s-2 border-border/20 ms-[22px]">
              {sections.length === 0 ? (
                <div className="flex items-center gap-2 py-2 px-3">
                  <FileText className="h-3 w-3 text-muted-foreground/20" />
                  <span className="text-[10px] text-muted-foreground/40">لا توجد أقسام</span>
                </div>
              ) : (
                sections.map((section) => (
                  <KnowledgeSection
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    selectedItemId={selectedItemId}
                    onSelectSection={onSelectSection}
                    onSelectItem={onSelectItem}
                    onAddContent={onAddContent}
                    onEditSection={onEditSection}
                    onDuplicateSection={onDuplicateSection}
                    onPublishSection={onPublishSection}
                    onArchiveSection={onArchiveSection}
                    onDeleteSection={onDeleteSection}
                  />
                ))
              )}

              {/* ADD SECTION BUTTON */}
              <PermissionGuard permission="sections.create">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddSection?.(lecture.id); }}
                  className="flex items-center gap-1.5 w-full px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/20 transition-all"
                >
                  <Plus className="h-3 w-3" />
                  إضافة قسم
                </button>
              </PermissionGuard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { KnowledgeLecture };
