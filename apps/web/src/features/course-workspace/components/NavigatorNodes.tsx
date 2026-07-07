"use client";

import { forwardRef, memo } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  Clock,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  AppDropdownMenuTrigger,
  PermissionGuard,
} from "@/components/ui";
import { CONTENT_TYPE_CONFIG } from "@/features/course-content/constants";
import { estimateDuration, estimateDurationMinutes } from "@/features/course-content/utils";
import { cn } from "@/lib/cn";
import type { ContentItem, NodeMenuItem, StudioLecture, StudioSection } from "../types";

const STATUS_DOT: Record<string, string> = {
  draft: "bg-warning",
  published: "bg-success",
  archived: "bg-muted-foreground/50",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

function NodeMenu({ items, label }: { items: NodeMenuItem[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="rounded-md p-1 text-muted-foreground/50 opacity-0 transition-all hover:bg-muted/60 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 group-focus-within:opacity-100"
          aria-label={`خيارات ${label}`}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="min-w-44">
        {items.map((item, index) => {
          const Icon = item.icon;
          const entry = (
            <AppDropdownMenuItem
              key={item.key}
              onSelect={() => item.onSelect()}
              className={cn(item.destructive && "text-destructive focus:text-destructive")}
            >
              <Icon className="me-2 h-3.5 w-3.5" />
              {item.label}
            </AppDropdownMenuItem>
          );
          const guarded = item.permission ? (
            <PermissionGuard key={item.key} permission={item.permission}>
              {entry}
            </PermissionGuard>
          ) : (
            entry
          );
          return (
            <span key={item.key} className="contents">
              {item.destructive && index > 0 && <AppDropdownMenuSeparator />}
              {guarded}
            </span>
          );
        })}
      </AppDropdownMenuContent>
    </AppDropdownMenu>
  );
}

interface RowShellProps {
  depth: number;
  active: boolean;
  tabIndex: number;
  ariaLevel: number;
  ariaExpanded?: boolean;
  label: string;
  onSelect: () => void;
  children: React.ReactNode;
}

const RowShell = forwardRef<HTMLDivElement, RowShellProps>(function RowShell(
  { depth, active, tabIndex, ariaLevel, ariaExpanded, label, onSelect, children },
  ref,
) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
    >
      <div
        ref={ref}
        role="treeitem"
        aria-level={ariaLevel}
        aria-selected={active}
        aria-expanded={ariaExpanded}
        aria-label={label}
        tabIndex={tabIndex}
        onClick={onSelect}
        className={cn(
          "group flex w-full cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pe-1.5 text-start transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "bg-primary/10 text-primary" : "text-foreground/90 hover:bg-muted/50",
        )}
        style={{ paddingInlineStart: `${8 + depth * 14}px` }}
      >
        {children}
      </div>
    </motion.div>
  );
});

interface LectureRowProps {
  lecture: StudioLecture;
  active: boolean;
  expanded: boolean;
  tabIndex: number;
  onToggle: () => void;
  onSelect: () => void;
  onAddSection: () => void;
  menuItems: NodeMenuItem[];
}

export const LectureRow = memo(
  forwardRef<HTMLDivElement, LectureRowProps>(function LectureRow(
    { lecture, active, expanded, tabIndex, onToggle, onSelect, onAddSection, menuItems },
    ref,
  ) {
    const contentCount = lecture.sections.reduce((sum, s) => sum + s.items.length, 0);
    return (
      <RowShell
        ref={ref}
        depth={0}
        active={active}
        tabIndex={tabIndex}
        ariaLevel={1}
        ariaExpanded={expanded}
        label={`محاضرة: ${lecture.title}`}
        onSelect={onSelect}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={expanded ? "طي المحاضرة" : "توسيع المحاضرة"}
          tabIndex={-1}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-0 ltr:rotate-180" />
          )}
        </button>
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[lecture.status])}
          title={STATUS_LABEL[lecture.status]}
        />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">{lecture.title}</span>
        {lecture.durationMinutes ? (
          <span className="flex items-center gap-0.5 text-[10px] tabular-nums text-muted-foreground/50">
            <Clock className="h-2.5 w-2.5" />
            {estimateDurationMinutes(lecture.durationMinutes)}
          </span>
        ) : null}
        <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground/70">
          {lecture.sectionsCount}·{contentCount}
        </span>
        <PermissionGuard permission="sections.create">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddSection();
            }}
            className="rounded-md p-1 text-muted-foreground/50 opacity-0 transition-all hover:bg-muted/60 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 group-focus-within:opacity-100"
            aria-label="إضافة قسم"
            tabIndex={-1}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </PermissionGuard>
        <NodeMenu items={menuItems} label={lecture.title} />
      </RowShell>
    );
  }),
);

interface SectionRowProps {
  section: StudioSection;
  active: boolean;
  expanded: boolean;
  tabIndex: number;
  onToggle: () => void;
  onSelect: () => void;
  onAddContent: () => void;
  menuItems: NodeMenuItem[];
}

export const SectionRow = memo(
  forwardRef<HTMLDivElement, SectionRowProps>(function SectionRow(
    { section, active, expanded, tabIndex, onToggle, onSelect, onAddContent, menuItems },
    ref,
  ) {
    return (
      <RowShell
        ref={ref}
        depth={1}
        active={active}
        tabIndex={tabIndex}
        ariaLevel={2}
        ariaExpanded={expanded}
        label={`قسم: ${section.title}`}
        onSelect={onSelect}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={expanded ? "طي القسم" : "توسيع القسم"}
          tabIndex={-1}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3 rtl:rotate-0 ltr:rotate-180" />
          )}
        </button>
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[section.status])}
          title={STATUS_LABEL[section.status]}
        />
        <span className="min-w-0 flex-1 truncate text-xs">{section.title}</span>
        {section.freePreview && (
          <Eye className="h-3 w-3 shrink-0 text-success/80" aria-label="معاينة مجانية" />
        )}
        {section.locked && (
          <Lock className="h-3 w-3 shrink-0 text-warning/80" aria-label="مقفل" />
        )}
        {section.durationMinutes ? (
          <span className="flex items-center gap-0.5 text-[10px] tabular-nums text-muted-foreground/50">
            <Clock className="h-2.5 w-2.5" />
            {estimateDurationMinutes(section.durationMinutes)}
          </span>
        ) : null}
        <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground/70">
          {section.items.length}
        </span>
        <PermissionGuard permission="lessons.create">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddContent();
            }}
            className="rounded-md p-1 text-muted-foreground/50 opacity-0 transition-all hover:bg-muted/60 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 group-focus-within:opacity-100"
            aria-label="إضافة محتوى"
            tabIndex={-1}
          >
            <Plus className="h-3 w-3" />
          </button>
        </PermissionGuard>
        <NodeMenu items={menuItems} label={section.title} />
      </RowShell>
    );
  }),
);

interface ContentRowProps {
  item: ContentItem;
  active: boolean;
  tabIndex: number;
  onSelect: () => void;
  menuItems: NodeMenuItem[];
}

export const ContentRow = memo(
  forwardRef<HTMLDivElement, ContentRowProps>(function ContentRow(
    { item, active, tabIndex, onSelect, menuItems },
    ref,
  ) {
    const config = CONTENT_TYPE_CONFIG[item.type];
    const Icon = config.icon;
    const VisibilityIcon =
      item.visibility === "public" ? Globe2 : item.visibility === "preview" ? Eye : EyeOff;
    return (
      <RowShell
        ref={ref}
        depth={2}
        active={active}
        tabIndex={tabIndex}
        ariaLevel={3}
        label={`${config.label}: ${item.title}`}
        onSelect={onSelect}
      >
        <span className={cn("rounded-md p-1", config.bg, config.color)}>
          <Icon className="h-3 w-3" />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs">{item.title}</span>
        <VisibilityIcon className="h-3 w-3 shrink-0 text-muted-foreground/40" />
        {item.duration ? (
          <span className="text-[10px] tabular-nums text-muted-foreground/50">
            {estimateDuration(item.duration)}
          </span>
        ) : null}
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[item.status])} title={STATUS_LABEL[item.status]} />
        <NodeMenu items={menuItems} label={item.title} />
      </RowShell>
    );
  }),
);
