"use client";

import { memo } from "react";
import {
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppBadge,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { GripVertical, Video, FileText, File, Globe, Radio } from "lucide-react";
import { LESSON_STATUS_CONFIG, LESSON_TYPE_CONFIG } from "../constants";
import { LessonRowActions } from "./LessonRowActions";
import type { Lesson, LessonStatus } from "../types";

interface LessonsTableProps {
  lessons: Lesson[];
  onView: (lesson: Lesson) => void;
  onEdit: (lesson: Lesson) => void;
  onPublish: (lesson: Lesson) => void;
  onArchive: (lesson: Lesson) => void;
  onDuplicate: (lesson: Lesson) => void;
  onToggleFeature: (lesson: Lesson) => void;
  onToggleFreePreview: (lesson: Lesson) => void;
  onRestore: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onMoveUp?: (lesson: Lesson) => void;
  onMoveDown?: (lesson: Lesson) => void;
}

const TYPE_ICONS: Record<string, typeof Video> = {
  video: Video,
  text: FileText,
  pdf: File,
  external: Globe,
  live: Radio,
};

const LessonsTableRow = memo(function LessonsTableRow({
  lesson,
  onView,
  onEdit,
  onPublish,
  onArchive,
  onDuplicate,
  onToggleFeature,
  onToggleFreePreview,
  onRestore,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  lesson: Lesson;
  onView: (lesson: Lesson) => void;
  onEdit: (lesson: Lesson) => void;
  onPublish: (lesson: Lesson) => void;
  onArchive: (lesson: Lesson) => void;
  onDuplicate: (lesson: Lesson) => void;
  onToggleFeature: (lesson: Lesson) => void;
  onToggleFreePreview: (lesson: Lesson) => void;
  onRestore: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onMoveUp?: (lesson: Lesson) => void;
  onMoveDown?: (lesson: Lesson) => void;
}) {
  const statusConfig = LESSON_STATUS_CONFIG[lesson.status as LessonStatus] ?? LESSON_STATUS_CONFIG.draft;
  const typeConfig = LESSON_TYPE_CONFIG[lesson.lessonType] ?? LESSON_TYPE_CONFIG.video;
  const TypeIcon = TYPE_ICONS[lesson.lessonType] ?? Video;

  return (
    <AppTableRow className="group cursor-pointer" onClick={() => onEdit(lesson)}>
      <AppTableCell className="w-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 cursor-grab" />
          <span className="text-xs text-muted-foreground tabular-nums w-5 text-center">
            {lesson.order}
          </span>
        </div>
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-2 min-w-0">
          {lesson.color && (
            <span
              className="h-3 w-3 rounded-full shrink-0 ring-1 ring-border"
              style={{ backgroundColor: lesson.color }}
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{lesson.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {lesson.course?.title ?? "—"} / {lesson.section?.title ?? "—"}
            </p>
          </div>
        </div>
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground">
        {lesson.course?.title ?? "—"}
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground">
        {lesson.section?.title ?? "—"}
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-1.5">
          <TypeIcon className="h-3.5 w-3.5" style={{ color: `var(--${typeConfig.color})` }} />
          <span className="text-xs">{typeConfig.label}</span>
        </div>
      </AppTableCell>
      <AppTableCell className="tabular-nums text-sm">
        {lesson.estimatedDuration ? `${lesson.estimatedDuration} د` : lesson.durationSeconds ? `${Math.round(lesson.durationSeconds / 60)} د` : "—"}
      </AppTableCell>
      <AppTableCell>
        <AppBadge variant={statusConfig.color as "success" | "secondary" | "destructive" | "warning" | "default"} className="text-[10px] gap-1">
          <span className="h-1.5 w-1.5 rounded-full inline-block bg-current" />
          {statusConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        <span className="text-xs text-muted-foreground">
          {lesson.visibility === "public" ? "عام" : lesson.visibility === "preview" ? "معاينة" : "خاص"}
        </span>
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {lesson.publishedAt ? formatDate(lesson.publishedAt) : "—"}
      </AppTableCell>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <LessonRowActions
          lesson={lesson}
          onView={() => onView(lesson)}
          onEdit={() => onEdit(lesson)}
          onPublish={() => onPublish(lesson)}
          onArchive={() => onArchive(lesson)}
          onDuplicate={() => onDuplicate(lesson)}
          onToggleFeature={() => onToggleFeature(lesson)}
          onToggleFreePreview={() => onToggleFreePreview(lesson)}
          onRestore={() => onRestore(lesson)}
          onDelete={() => onDelete(lesson)}
          onMoveUp={onMoveUp ? () => onMoveUp(lesson) : undefined}
          onMoveDown={onMoveDown ? () => onMoveDown(lesson) : undefined}
        />
      </AppTableCell>
    </AppTableRow>
  );
});

function LessonsTable(props: LessonsTableProps) {
  const { lessons, ...actions } = props;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <AppTable>
          <AppTableHeader>
            <AppTableRow>
              <AppTableHead className="w-16">الترتيب</AppTableHead>
              <AppTableHead>العنوان</AppTableHead>
              <AppTableHead>الدورة</AppTableHead>
              <AppTableHead>القسم</AppTableHead>
              <AppTableHead>النوع</AppTableHead>
              <AppTableHead>المدة</AppTableHead>
              <AppTableHead>الحالة</AppTableHead>
              <AppTableHead>الرؤية</AppTableHead>
              <AppTableHead>تاريخ النشر</AppTableHead>
              <AppTableHead className="w-10" />
            </AppTableRow>
          </AppTableHeader>
          <AppTableBody>
            {lessons.map((lesson) => (
              <LessonsTableRow key={lesson.id} lesson={lesson} {...actions} />
            ))}
          </AppTableBody>
        </AppTable>
      </div>
    </div>
  );
}

export { LessonsTable };
