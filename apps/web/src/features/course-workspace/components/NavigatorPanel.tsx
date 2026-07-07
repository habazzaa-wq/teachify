"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { BookOpen, Plus, Search, X } from "lucide-react";
import { PermissionGuard, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useWorkspaceStore } from "../store";
import { ContentRow, LectureRow, SectionRow } from "./NavigatorNodes";
import type { Course } from "@/features/courses/types";
import type { ContentItem, NodeMenuItem, StudioLecture, StudioSection } from "../types";

type FlatNode =
  | { kind: "course"; key: string }
  | { kind: "lecture"; key: string; lecture: StudioLecture }
  | { kind: "section"; key: string; lecture: StudioLecture; section: StudioSection }
  | { kind: "content"; key: string; lecture: StudioLecture; section: StudioSection; item: ContentItem };

interface NavigatorPanelProps {
  course: Course | null | undefined;
  loading: boolean;
  tree: StudioLecture[];
  onAddLecture: () => void;
  onAddSection: (lectureId: string) => void;
  onAddContent: (sectionId: string) => void;
  lectureMenu: (lecture: StudioLecture) => NodeMenuItem[];
  sectionMenu: (section: StudioSection, lecture: StudioLecture) => NodeMenuItem[];
  contentMenu: (item: ContentItem, section: StudioSection, lecture: StudioLecture) => NodeMenuItem[];
}

function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Course Explorer — VS Code style tree over Course → Lectures → Sections → Content.
 * Full roving-tabindex keyboard navigation with ARIA tree semantics.
 */
const NavigatorPanel = memo(function NavigatorPanel({
  course,
  loading,
  tree,
  onAddLecture,
  onAddSection,
  onAddContent,
  lectureMenu,
  sectionMenu,
  contentMenu,
}: NavigatorPanelProps) {
  const {
    selectedType,
    selectedId,
    select,
    expandedLectures,
    expandedSections,
    toggleLecture,
    toggleSection,
    expandLectures,
    expandSections,
  } = useWorkspaceStore();

  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isRtl = useMemo(
    () => typeof document !== "undefined" && document.documentElement.dir !== "ltr",
    [],
  );

  const searching = query.trim().length > 0;

  const flat = useMemo<FlatNode[]>(() => {
    const nodes: FlatNode[] = [{ kind: "course", key: "course" }];
    for (const lecture of tree) {
      const sectionNodes: FlatNode[] = [];
      for (const section of lecture.sections) {
        const itemNodes: FlatNode[] = [];
        for (const item of section.items) {
          if (!searching || matches(item.title, query)) {
            itemNodes.push({ kind: "content", key: `c-${item.id}`, lecture, section, item });
          }
        }
        const sectionMatch = !searching || matches(section.title, query) || itemNodes.length > 0;
        if (sectionMatch) {
          sectionNodes.push({ kind: "section", key: `s-${section.id}`, lecture, section });
          const open = searching || expandedSections.includes(section.id);
          if (open) sectionNodes.push(...itemNodes);
        }
      }
      const lectureMatch = !searching || matches(lecture.title, query) || sectionNodes.length > 0;
      if (lectureMatch) {
        nodes.push({ kind: "lecture", key: `l-${lecture.id}`, lecture });
        const open = searching || expandedLectures.includes(lecture.id);
        if (open) nodes.push(...sectionNodes);
      }
    }
    return nodes;
  }, [tree, query, searching, expandedLectures, expandedSections]);

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, flat.length);
    if (focusIndex >= flat.length) setFocusIndex(Math.max(0, flat.length - 1));
  }, [flat.length, focusIndex]);

  const focusRow = useCallback((index: number) => {
    setFocusIndex(index);
    rowRefs.current[index]?.focus();
  }, []);

  const selectNode = useCallback(
    (node: FlatNode) => {
      if (node.kind === "course") select("course", course?.id ?? null);
      else if (node.kind === "lecture") select("lecture", node.lecture.id);
      else if (node.kind === "section") select("section", node.section.id);
      else select("content", node.item.id);
    },
    [select, course?.id],
  );

  const expandNode = useCallback(
    (node: FlatNode, expand: boolean) => {
      if (node.kind === "lecture") {
        const open = expandedLectures.includes(node.lecture.id);
        if (open !== expand) toggleLecture(node.lecture.id);
      } else if (node.kind === "section") {
        const open = expandedSections.includes(node.section.id);
        if (open !== expand) toggleSection(node.section.id);
      }
    },
    [expandedLectures, expandedSections, toggleLecture, toggleSection],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const node = flat[focusIndex];
      if (!node) return;
      const expandKey = isRtl ? "ArrowLeft" : "ArrowRight";
      const collapseKey = isRtl ? "ArrowRight" : "ArrowLeft";

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          focusRow(Math.min(flat.length - 1, focusIndex + 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          focusRow(Math.max(0, focusIndex - 1));
          break;
        case "Home":
          e.preventDefault();
          focusRow(0);
          break;
        case "End":
          e.preventDefault();
          focusRow(flat.length - 1);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          selectNode(node);
          break;
        case expandKey:
          e.preventDefault();
          expandNode(node, true);
          break;
        case collapseKey:
          e.preventDefault();
          expandNode(node, false);
          break;
        default:
          break;
      }
    },
    [flat, focusIndex, focusRow, selectNode, expandNode, isRtl],
  );

  const handleExpandAll = useCallback(() => {
    expandLectures(tree.map((l) => l.id));
    expandSections(tree.flatMap((l) => l.sections.map((s) => s.id)));
  }, [tree, expandLectures, expandSections]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b border-border/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            مستكشف الدورة
          </h2>
          <PermissionGuard permission="modules.create">
            <button
              type="button"
              onClick={onAddLecture}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-3 w-3" />
              محاضرة
            </button>
          </PermissionGuard>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث في المحتوى..."
            className="h-8 w-full rounded-lg border border-border/50 bg-background ps-8 pe-7 text-xs placeholder:text-muted-foreground/40 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label="بحث في محتوى الدورة"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
              aria-label="مسح البحث"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div
        role="tree"
        aria-label="محتوى الدورة"
        onKeyDown={handleKeyDown}
        className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2"
      >
        {loading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <LayoutGroup>
            <AnimatePresence initial={false}>
              {flat.map((node, index) => {
                const tabIndex = index === focusIndex ? 0 : -1;
                const setRef = (el: HTMLDivElement | null) => {
                  rowRefs.current[index] = el;
                };
                if (node.kind === "course") {
                  const active = selectedType === "course";
                  return (
                    <div
                      key={node.key}
                      ref={setRef}
                      role="treeitem"
                      aria-level={1}
                      aria-selected={active}
                      aria-label={`الدورة: ${course?.title ?? ""}`}
                      tabIndex={tabIndex}
                      onClick={() => selectNode(node)}
                      className={cn(
                        "group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
                      )}
                    >
                      <span className="rounded-md bg-primary/10 p-1 text-primary">
                        <BookOpen className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-bold">
                        {course?.title ?? "..."}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">نظرة عامة</span>
                    </div>
                  );
                }
                if (node.kind === "lecture") {
                  return (
                    <LectureRow
                      key={node.key}
                      ref={setRef}
                      lecture={node.lecture}
                      active={selectedType === "lecture" && selectedId === node.lecture.id}
                      expanded={searching || expandedLectures.includes(node.lecture.id)}
                      tabIndex={tabIndex}
                      onToggle={() => toggleLecture(node.lecture.id)}
                      onSelect={() => selectNode(node)}
                      onAddSection={() => onAddSection(node.lecture.id)}
                      menuItems={lectureMenu(node.lecture)}
                    />
                  );
                }
                if (node.kind === "section") {
                  return (
                    <SectionRow
                      key={node.key}
                      ref={setRef}
                      section={node.section}
                      active={selectedType === "section" && selectedId === node.section.id}
                      expanded={searching || expandedSections.includes(node.section.id)}
                      tabIndex={tabIndex}
                      onToggle={() => toggleSection(node.section.id)}
                      onSelect={() => selectNode(node)}
                      onAddContent={() => onAddContent(node.section.id)}
                      menuItems={sectionMenu(node.section, node.lecture)}
                    />
                  );
                }
                return (
                  <ContentRow
                    key={node.key}
                    ref={setRef}
                    item={node.item}
                    active={selectedType === "content" && selectedId === node.item.id}
                    tabIndex={tabIndex}
                    onSelect={() => selectNode(node)}
                    menuItems={contentMenu(node.item, node.section, node.lecture)}
                  />
                );
              })}
            </AnimatePresence>
          </LayoutGroup>
        )}

        {!loading && tree.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground/60">
            لا توجد محاضرات بعد
          </p>
        )}
        {!loading && searching && flat.length <= 1 && tree.length > 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground/60">
            لا نتائج مطابقة لبحثك
          </p>
        )}
      </div>

      {!loading && tree.length > 0 && (
        <div className="shrink-0 border-t border-border/40 p-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="w-full rounded-lg py-1.5 text-[11px] text-muted-foreground/60 transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            توسيع الكل
          </button>
        </div>
      )}
    </div>
  );
});

export { NavigatorPanel };
