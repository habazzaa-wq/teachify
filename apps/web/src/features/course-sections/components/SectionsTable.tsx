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
import { GripVertical } from "lucide-react";
import { SECTION_STATUS_CONFIG } from "../constants";
import { SectionRowActions } from "./SectionRowActions";
import type { CourseSection, SectionStatus } from "../types";

interface SectionsTableProps {
  sections: CourseSection[];
  onView: (section: CourseSection) => void;
  onEdit: (section: CourseSection) => void;
  onPublish: (section: CourseSection) => void;
  onUnpublish: (section: CourseSection) => void;
  onDuplicate: (section: CourseSection) => void;
  onToggleFeature: (section: CourseSection) => void;
  onToggleLock: (section: CourseSection) => void;
  onRestore: (section: CourseSection) => void;
  onDelete: (section: CourseSection) => void;
  onMoveUp?: (section: CourseSection) => void;
  onMoveDown?: (section: CourseSection) => void;
  onDragStart?: (section: CourseSection) => void;
  onDragOver?: (section: CourseSection) => void;
  onDrop?: (section: CourseSection) => void;
}

const SectionsTableRow = memo(function SectionsTableRow({
  section,
  onView,
  onEdit,
  onPublish,
  onUnpublish,
  onDuplicate,
  onToggleFeature,
  onToggleLock,
  onRestore,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  section: CourseSection;
  onView: (section: CourseSection) => void;
  onEdit: (section: CourseSection) => void;
  onPublish: (section: CourseSection) => void;
  onUnpublish: (section: CourseSection) => void;
  onDuplicate: (section: CourseSection) => void;
  onToggleFeature: (section: CourseSection) => void;
  onToggleLock: (section: CourseSection) => void;
  onRestore: (section: CourseSection) => void;
  onDelete: (section: CourseSection) => void;
  onMoveUp?: (section: CourseSection) => void;
  onMoveDown?: (section: CourseSection) => void;
}) {
  const statusConfig = SECTION_STATUS_CONFIG[section.status as SectionStatus] ?? SECTION_STATUS_CONFIG.draft;

  return (
    <AppTableRow className="group cursor-pointer" onClick={() => onEdit(section)}>
      <AppTableCell className="w-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 cursor-grab" />
          <span className="text-xs text-muted-foreground tabular-nums w-5 text-center">
            {section.order}
          </span>
        </div>
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-2 min-w-0">
          {section.color && (
            <span
              className="h-3 w-3 rounded-full shrink-0 ring-1 ring-border"
              style={{ backgroundColor: section.color }}
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{section.title}</p>
            <p className="text-xs text-muted-foreground truncate">{section.course?.title ?? "—"}</p>
          </div>
        </div>
      </AppTableCell>
      <AppTableCell className="tabular-nums text-sm">{section.lessonsCount}</AppTableCell>
      <AppTableCell className="tabular-nums text-sm">
        {section.durationMinutes ? `${section.durationMinutes} د` : "—"}
      </AppTableCell>
      <AppTableCell>
        <AppBadge variant={statusConfig.color as "success" | "secondary" | "destructive" | "warning" | "default"} className="text-[10px] gap-1">
          <span className={`h-1.5 w-1.5 rounded-full inline-block bg-${statusConfig.color === "success" ? "success" : statusConfig.color === "destructive" ? "destructive" : "muted-foreground"}`} />
          {statusConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        {section.locked ? (
          <AppBadge variant="destructive" className="text-[10px]">مقفل</AppBadge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {formatDate(section.createdAt)}
      </AppTableCell>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <SectionRowActions
          section={section}
          onView={() => onView(section)}
          onEdit={() => onEdit(section)}
          onPublish={() => onPublish(section)}
          onUnpublish={() => onUnpublish(section)}
          onDuplicate={() => onDuplicate(section)}
          onToggleFeature={() => onToggleFeature(section)}
          onToggleLock={() => onToggleLock(section)}
          onRestore={() => onRestore(section)}
          onDelete={() => onDelete(section)}
          onMoveUp={onMoveUp ? () => onMoveUp(section) : undefined}
          onMoveDown={onMoveDown ? () => onMoveDown(section) : undefined}
        />
      </AppTableCell>
    </AppTableRow>
  );
});

function SectionsTable(props: SectionsTableProps) {
  const { sections, ...actions } = props;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <AppTable>
          <AppTableHeader>
            <AppTableRow>
              <AppTableHead className="w-16">الترتيب</AppTableHead>
              <AppTableHead>العنوان</AppTableHead>
              <AppTableHead>الدروس</AppTableHead>
              <AppTableHead>المدة</AppTableHead>
              <AppTableHead>الحالة</AppTableHead>
              <AppTableHead>مقفل</AppTableHead>
              <AppTableHead>تاريخ الإنشاء</AppTableHead>
              <AppTableHead className="w-10" />
            </AppTableRow>
          </AppTableHeader>
          <AppTableBody>
            {sections.map((section) => (
              <SectionsTableRow key={section.id} section={section} {...actions} />
            ))}
          </AppTableBody>
        </AppTable>
      </div>
    </div>
  );
}

export { SectionsTable };
