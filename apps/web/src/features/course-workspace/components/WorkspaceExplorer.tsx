"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Archive,
  Trash2,
  CheckCircle2,
  CircleDashed,
  Lock,
  Globe,
  Video,
  FileText,
  FileSpreadsheet,
  PenTool,
  Headphones,
  FolderOpen,
  Monitor,
  ExternalLink,
  Box,
  Award,
  Clock,
  Layers,
  Sparkles,
  RotateCcw,
  FileType,
  Puzzle,
  ClipboardList,
  Link,
} from "lucide-react";
import { Skeleton, PermissionGuard } from "@/components/ui";
import { useWorkspaceStore } from "../store";
import type { CourseModule, CourseModuleSection, ContentItem } from "@/features/course-content/types";
import type { Course } from "@/features/courses/types";
import { cn } from "@/lib/cn";
import { estimateDurationMinutes } from "@/features/course-content/utils";

const contentTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Video,
  pdf: FileType,
  exam: ClipboardList,
  assignment: PenTool,
  audio: Headphones,
  resource: FolderOpen,
  live: Monitor,
  scorm: Puzzle,
  external_link: Link,
  certificate: Award,
};

const contentTypeColors: Record<string, string> = {
  video: "text-blue-500",
  pdf: "text-rose-500",
  exam: "text-secondary",
  assignment: "text-amber-500",
  audio: "text-emerald-500",
  resource: "text-cyan-500",
  live: "text-red-500",
  scorm: "text-indigo-500",
  external_link: "text-sky-500",
  certificate: "text-yellow-500",
};

interface WorkspaceExplorerProps {
  course?: Course | null;
  courseLoading?: boolean;
  modules: CourseModule[];
  modulesLoading?: boolean;
  sectionsCount?: number;
  lessonsCount?: number;
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

function ContentItemRow({
  item,
  depth,
  selectedId,
  onSelect,
  onContextMenu,
}: {
  item: ContentItem;
  depth: number;
  selectedId: string | null;
  onSelect: (item: ContentItem) => void;
  onContextMenu?: (e: React.MouseEvent, item: ContentItem) => void;
}) {
  const Icon = contentTypeIcons[item.type] ?? FolderOpen;
  const color = contentTypeColors[item.type] ?? "text-muted-foreground";

  return (
    <button
      onClick={() => onSelect(item)}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, item); }}
      className={cn(
        "flex w-full items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-all text-start",
        selectedId === item.id
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground/70 hover:bg-muted/20 hover:text-foreground",
      )}
      style={{ paddingInlineStart: `${12 + depth * 16}px` }}
      aria-current={selectedId === item.id ? "true" : undefined}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
      <span className="truncate flex-1">{item.title}</span>
      {item.duration != null && item.duration > 0 && (
        <span className="text-[10px] text-muted-foreground/40 shrink-0">
          {Math.round(item.duration / 60)}د
        </span>
      )}
      <span className={cn(
        "h-1.5 w-1.5 rounded-full shrink-0",
        item.status === "published" ? "bg-emerald-500" : "bg-amber-500",
      )} />
    </button>
  );
}

function SectionRow({
  section,
  depth,
  selectedId,
  selectedItemId,
  expandedSections,
  onSelect,
  onSelectItem,
  onToggleSection,
  onContextMenu,
  onAddContent,
}: {
  section: CourseModuleSection;
  depth: number;
  selectedId: string | null;
  selectedItemId: string | null;
  expandedSections: string[];
  onSelect: (section: CourseModuleSection) => void;
  onSelectItem: (item: ContentItem) => void;
  onToggleSection: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, section: CourseModuleSection) => void;
  onAddContent?: (sectionId: string) => void;
}) {
  const isExpanded = expandedSections.includes(section.id);
  const isSelected = selectedId === section.id;
  const hasItems = section.items.length > 0;

  return (
    <div>
      <div className="flex items-center gap-1 group">
        <button
          onClick={() => onToggleSection(section.id)}
          className="p-0.5 rounded text-muted-foreground/30 hover:text-foreground transition-colors shrink-0"
          aria-label={isExpanded ? "طي القسم" : "توسيع القسم"}
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", isExpanded ? "-rotate-90" : "")} />
        </button>
        <button
          onClick={() => onSelect(section)}
          onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, section); }}
          className={cn(
            "flex flex-1 items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-all text-start min-w-0",
            isSelected
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground/70 hover:bg-muted/20 hover:text-foreground",
          )}
          style={{ paddingInlineStart: `${8 + depth * 16}px` }}
          aria-current={isSelected ? "true" : undefined}
        >
          <Layers className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <span className="truncate flex-1">{section.title}</span>
          {section.freePreview && (
            <Globe className="h-3 w-3 text-emerald-500 shrink-0" />
          )}
          {section.locked && (
            <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          )}
          <span className="text-[10px] text-muted-foreground/40 shrink-0">{section.items.length}</span>
          <span className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            section.status === "published" ? "bg-emerald-500" : "bg-amber-500",
          )} />
        </button>
        <PermissionGuard permission="lessons.create">
          <button
            onClick={(e) => { e.stopPropagation(); onAddContent?.(section.id); }}
            className="p-1 rounded text-muted-foreground/20 hover:text-foreground hover:bg-muted/30 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            aria-label="إضافة محتوى"
          >
            <Plus className="h-3 w-3" />
          </button>
        </PermissionGuard>
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && hasItems && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {section.items.map((item) => (
              <ContentItemRow
                key={item.id}
                item={item}
                depth={depth + 1}
                selectedId={selectedItemId}
                onSelect={onSelectItem}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LectureRow({
  lecture,
  depth,
  selectedId,
  selectedSectionId,
  selectedItemId,
  expandedLectures,
  expandedSections,
  onSelect,
  onSelectSection,
  onSelectItem,
  onToggleLecture,
  onToggleSection,
  onContextMenu,
  onSectionContextMenu,
  onAddSection,
  onAddContent,
}: {
  lecture: CourseModule;
  depth: number;
  selectedId: string | null;
  selectedSectionId: string | null;
  selectedItemId: string | null;
  expandedLectures: string[];
  expandedSections: string[];
  onSelect: (lecture: CourseModule) => void;
  onSelectSection: (section: CourseModuleSection) => void;
  onSelectItem: (item: ContentItem) => void;
  onToggleLecture: (id: string) => void;
  onToggleSection: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, lecture: CourseModule) => void;
  onSectionContextMenu?: (e: React.MouseEvent, section: CourseModuleSection) => void;
  onAddSection?: (lectureId: string) => void;
  onAddContent?: (sectionId: string) => void;
}) {
  const isExpanded = expandedLectures.includes(lecture.id);
  const isSelected = selectedId === lecture.id;
  const totalContent = lecture.sections.reduce((s, sec) => s + sec.items.length, 0);
  const totalDuration = lecture.sections.reduce((s, sec) => s + (sec.durationMinutes ?? 0), 0);

  return (
    <div>
      <div className="flex items-center gap-1 group">
        <button
          onClick={() => onToggleLecture(lecture.id)}
          className="p-0.5 rounded text-muted-foreground/30 hover:text-foreground transition-colors shrink-0"
          aria-label={isExpanded ? "طي المحاضرة" : "توسيع المحاضرة"}
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", isExpanded ? "-rotate-90" : "")} />
        </button>
        <button
          onClick={() => onSelect(lecture)}
          onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, lecture); }}
          className={cn(
            "flex flex-1 items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-all text-start min-w-0",
            isSelected
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground/70 hover:bg-muted/20 hover:text-foreground",
          )}
          style={{ paddingInlineStart: `${8 + depth * 16}px` }}
          aria-current={isSelected ? "true" : undefined}
        >
          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate flex-1">{lecture.title}</span>
          <span className="text-[10px] text-muted-foreground/40 shrink-0">{lecture.sections.length}</span>
          {totalDuration > 0 && (
            <span className="text-[10px] text-muted-foreground/30 shrink-0">{estimateDurationMinutes(totalDuration)}</span>
          )}
          <span className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            lecture.status === "published" ? "bg-emerald-500" : "bg-amber-500",
          )} />
        </button>
        <PermissionGuard permission="sections.create">
          <button
            onClick={(e) => { e.stopPropagation(); onAddSection?.(lecture.id); }}
            className="p-1 rounded text-muted-foreground/20 hover:text-foreground hover:bg-muted/30 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            aria-label="إضافة قسم"
          >
            <Plus className="h-3 w-3" />
          </button>
        </PermissionGuard>
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {lecture.sections.map((section) => (
              <SectionRow
                key={section.id}
                section={section}
                depth={depth + 1}
                selectedId={selectedSectionId}
                selectedItemId={selectedItemId}
                expandedSections={expandedSections}
                onSelect={onSelectSection}
                onSelectItem={onSelectItem}
                onToggleSection={onToggleSection}
                onAddContent={onAddContent}
                onContextMenu={onSectionContextMenu}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkspaceExplorer({
  course,
  courseLoading,
  modules,
  modulesLoading,
  sectionsCount = 0,
  lessonsCount = 0,
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
}: WorkspaceExplorerProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "lecture" | "section";
    item: CourseModule | CourseModuleSection;
  } | null>(null);
  const {
    selectedType,
    selectedId,
    expandedLectures,
    expandedSections,
    select,
    toggleLecture,
    toggleSection,
    expandLectures,
  } = useWorkspaceStore();

  const handleSelectCourse = useCallback(() => {
    select("course", course?.id ?? null);
  }, [select, course?.id]);

  const handleSelectLecture = useCallback((lecture: CourseModule) => {
    select("lecture", lecture.id);
  }, [select]);

  const handleSelectSection = useCallback((section: CourseModuleSection) => {
    select("section", section.id);
  }, [select]);

  const handleSelectItem = useCallback((item: ContentItem) => {
    select("content", item.id);
  }, [select]);

  const handleToggleLecture = useCallback((id: string) => {
    toggleLecture(id);
  }, [toggleLecture]);

  const handleToggleSection = useCallback((id: string) => {
    toggleSection(id);
  }, [toggleSection]);

  const handleLectureContextMenu = useCallback((e: React.MouseEvent, lecture: CourseModule) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: "lecture", item: lecture });
  }, []);

  const handleSectionContextMenu = useCallback((e: React.MouseEvent, section: CourseModuleSection) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: "section", item: section });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  const totalDuration = useMemo(
    () => modules.reduce(
      (sum, m) => sum + (m.durationMinutes ?? 0) + m.sections.reduce((s, sec) => s + (sec.durationMinutes ?? 0), 0),
      0,
    ),
    [modules],
  );

  if (courseLoading || modulesLoading) {
    return (
      <div className="space-y-2 px-3 py-4">
        <Skeleton className="h-5 w-32 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 py-3 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-xs font-semibold text-muted-foreground/70">مستكشف المنهج</span>
          </div>
          <PermissionGuard permission="modules.create">
            <button
              onClick={onAddLecture}
              className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-muted/30 transition-colors"
              aria-label="إضافة محاضرة"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </PermissionGuard>
        </div>
        {course && (
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground/50">
            <GraduationCap className="h-3 w-3" />
            <span>{modules.length} محاضرات</span>
            <span>·</span>
            <Layers className="h-3 w-3" />
            <span>{sectionsCount} أقسام</span>
            <span>·</span>
            <Clock className="h-3 w-3" />
            <span>{estimateDurationMinutes(totalDuration)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        {/* Course Root Node */}
        {course && (
          <div className="mb-1">
            <button
              onClick={handleSelectCourse}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all text-start",
                selectedType === "course" && selectedId === course.id
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/80 hover:bg-muted/20",
              )}
              aria-current={selectedType === "course" ? "true" : undefined}
            >
              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate flex-1">{course.title}</span>
              {course.status === "published" && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              )}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!courseLoading && modules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary/25" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground/60">لم تتم إضافة محاضرات بعد</p>
              <p className="text-xs text-muted-foreground/40">أضف أول محاضرة لبدء بناء المنهج</p>
            </div>
            <PermissionGuard permission="modules.create">
              <button
                onClick={onAddLecture}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة محاضرة
              </button>
            </PermissionGuard>
          </div>
        )}

        {/* Lecture List */}
        <div className="space-y-0.5">
          {modules.map((lecture) => (
            <LectureRow
              key={lecture.id}
              lecture={lecture}
              depth={0}
              selectedId={selectedType === "lecture" ? selectedId : null}
              selectedSectionId={selectedType === "section" ? selectedId : null}
              selectedItemId={selectedType === "content" ? selectedId : null}
              expandedLectures={expandedLectures}
              expandedSections={expandedSections}
              onSelect={handleSelectLecture}
              onSelectSection={handleSelectSection}
              onSelectItem={handleSelectItem}
              onToggleLecture={handleToggleLecture}
              onToggleSection={handleToggleSection}
              onAddSection={onAddSection}
              onAddContent={onAddContent}
              onContextMenu={handleLectureContextMenu}
              onSectionContextMenu={handleSectionContextMenu}
            />
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] bg-card border border-border/40 rounded-xl shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          {contextMenu.type === "lecture" && (
            <>
              <button
                onClick={() => { onEditLecture?.(contextMenu.item as CourseModule); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start hover:bg-muted/30 transition-colors"
                role="menuitem"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground/50" />
                تعديل
              </button>
              <button
                onClick={() => { onDuplicateLecture?.(contextMenu.item as CourseModule); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start hover:bg-muted/30 transition-colors"
                role="menuitem"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground/50" />
                نسخ
              </button>
              <button
                onClick={() => { onPublishLecture?.(contextMenu.item as CourseModule); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start hover:bg-muted/30 transition-colors"
                role="menuitem"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                نشر
              </button>
              <button
                onClick={() => { onArchiveLecture?.(contextMenu.item as CourseModule); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start hover:bg-muted/30 transition-colors"
                role="menuitem"
              >
                <Archive className="h-3.5 w-3.5 text-muted-foreground/50" />
                أرشفة
              </button>
              <div className="h-px bg-border/30 my-1" />
              <button
                onClick={() => { onDeleteLecture?.(contextMenu.item as CourseModule); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start text-red-500 hover:bg-red-500/10 transition-colors"
                role="menuitem"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف
              </button>
            </>
          )}
          {contextMenu.type === "section" && (
            <>
              <button
                onClick={() => { onEditSection?.(contextMenu.item as CourseModuleSection); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start hover:bg-muted/30 transition-colors"
                role="menuitem"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground/50" />
                تعديل
              </button>
              <button
                onClick={() => { onDuplicateSection?.(contextMenu.item as CourseModuleSection); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start hover:bg-muted/30 transition-colors"
                role="menuitem"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground/50" />
                نسخ
              </button>
              <button
                onClick={() => { onPublishSection?.(contextMenu.item as CourseModuleSection); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start hover:bg-muted/30 transition-colors"
                role="menuitem"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                نشر
              </button>
              <button
                onClick={() => { onArchiveSection?.(contextMenu.item as CourseModuleSection); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start hover:bg-muted/30 transition-colors"
                role="menuitem"
              >
                <Archive className="h-3.5 w-3.5 text-muted-foreground/50" />
                أرشفة
              </button>
              <div className="h-px bg-border/30 my-1" />
              <button
                onClick={() => { onDeleteSection?.(contextMenu.item as CourseModuleSection); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-start text-red-500 hover:bg-red-500/10 transition-colors"
                role="menuitem"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { WorkspaceExplorer };
