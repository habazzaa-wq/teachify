"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Lock,
  Eye,
  MoreHorizontal,
  Pencil,
  Copy,
  Send,
  Archive,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  GripVertical,
} from "lucide-react";
import { KnowledgeContentItem } from "./KnowledgeContentItem";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  PermissionGuard,
} from "@/components/ui";
import type { CourseModuleSection } from "@/features/course-content/types";
import type { ContentItem } from "@/features/course-content/types";
import { cn } from "@/lib/cn";

interface KnowledgeSectionProps {
  section: CourseModuleSection;
  isSelected: boolean;
  selectedItemId?: string | null;
  onSelectSection: (section: CourseModuleSection) => void;
  onSelectItem: (item: ContentItem) => void;
  onAddContent?: (sectionId: string) => void;
  onEditSection?: (section: CourseModuleSection) => void;
  onDuplicateSection?: (section: CourseModuleSection) => void;
  onPublishSection?: (section: CourseModuleSection) => void;
  onArchiveSection?: (section: CourseModuleSection) => void;
  onDeleteSection?: (section: CourseModuleSection) => void;
}

function KnowledgeSection({
  section,
  isSelected,
  selectedItemId,
  onSelectSection,
  onSelectItem,
  onAddContent,
  onEditSection,
  onDuplicateSection,
  onPublishSection,
  onArchiveSection,
  onDeleteSection,
}: KnowledgeSectionProps) {
  const [expanded, setExpanded] = useState(isSelected);
  const toggleExpanded = useCallback(() => setExpanded((o) => !o), []);

  const handleSectionClick = useCallback(() => {
    onSelectSection(section);
    setExpanded(true);
  }, [onSelectSection, section]);

  const items = section.items ?? [];

  return (
    <div className="group/section">
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer",
          isSelected
            ? "bg-primary/[0.06] text-primary"
            : "hover:bg-muted/20 text-muted-foreground/70 hover:text-foreground/80",
        )}
      >
        {/* DRAG HANDLE */}
        <button
          className="shrink-0 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/5 hover:text-muted-foreground/40 cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover/section:opacity-100"
          aria-label="سحب لإعادة الترتيب"
          tabIndex={-1}
        >
          <GripVertical className="h-2.5 w-2.5" />
        </button>

        {/* EXPAND */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
          className="shrink-0 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/20 hover:text-muted-foreground/60 transition-colors"
          aria-label={expanded ? "طي" : "توسيع"}
          aria-expanded={expanded}
        >
          <ChevronDown
            className={cn(
              "h-2.5 w-2.5 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>

        {/* TITLE */}
        <div className="min-w-0 flex-1" onClick={handleSectionClick}>
          <span className="text-[11px] font-medium truncate block leading-tight">{section.title}</span>
          <span className="text-[9px] text-muted-foreground/50">{items.length} محتوى</span>
        </div>

        {/* ICONS */}
        <div className="flex items-center gap-0.5 shrink-0">
          {section.freePreview && <Eye className="h-2.5 w-2.5 text-emerald-500/60" />}
          {section.locked && <Lock className="h-2.5 w-2.5 text-muted-foreground/40" />}
          <span className="me-1">
            {section.status === "published" ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground/15" />
            )}
          </span>
        </div>

        {/* CONTEXT MENU */}
        <PermissionGuard permission="sections.update">
          <AppDropdownMenu>
            <AppDropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/10 hover:text-foreground hover:bg-muted/30 transition-all opacity-0 group-hover/section:opacity-100"
                aria-label="خيارات"
              >
                <MoreHorizontal className="h-2.5 w-2.5" />
              </button>
            </AppDropdownMenuTrigger>
            <AppDropdownMenuContent align="end" className="w-36">
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditSection?.(section); }}>
                <Pencil className="h-3.5 w-3.5 ms-2" />
                تعديل
              </AppDropdownMenuItem>
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicateSection?.(section); }}>
                <Copy className="h-3.5 w-3.5 ms-2" />
                نسخ
              </AppDropdownMenuItem>
              {section.status !== "published" && (
                <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onPublishSection?.(section); }}>
                  <Send className="h-3.5 w-3.5 ms-2" />
                  نشر
                </AppDropdownMenuItem>
              )}
              <AppDropdownMenuSeparator />
              <AppDropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onArchiveSection?.(section); }}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="h-3.5 w-3.5 ms-2" />
                أرشفة
              </AppDropdownMenuItem>
              <AppDropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDeleteSection?.(section); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 ms-2" />
                حذف
              </AppDropdownMenuItem>
            </AppDropdownMenuContent>
          </AppDropdownMenu>
        </PermissionGuard>
      </div>

      {/* ITEMS LIST */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 py-0.5 ms-3 border-s-2 border-border/15">
              {items.map((item) => (
                <KnowledgeContentItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItemId === item.id}
                  onSelect={onSelectItem}
                />
              ))}

              {/* ADD CONTENT BUTTON */}
              <PermissionGuard permission="lessons.create">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddContent?.(section.id); }}
                  className="flex items-center gap-1 w-full px-2.5 py-1 rounded-lg text-[9px] text-muted-foreground/20 hover:text-muted-foreground/50 hover:bg-muted/20 transition-all"
                >
                  <Plus className="h-2.5 w-2.5" />
                  إضافة محتوى
                </button>
              </PermissionGuard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { KnowledgeSection };
