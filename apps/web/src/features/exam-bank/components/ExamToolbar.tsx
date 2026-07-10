"use client";

import { Search, Plus, LayoutGrid, List } from "lucide-react";
import {
  AppInput,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
} from "@/components/ui";
import { StudioButton } from "@/components/studio";
import { cn } from "@/lib/cn";
import {
  EXAM_STATUS_OPTIONS,
  VISIBILITY_OPTIONS,
  SORT_OPTIONS,
} from "@/features/exam-bank/constants";
import type { ExamStatus, ExamVisibility, ViewMode } from "@/features/exam-bank/types";

interface ExamToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ExamStatus | "all";
  onStatusChange: (value: ExamStatus | "all") => void;
  visibilityFilter: ExamVisibility | "all";
  onVisibilityChange: (value: ExamVisibility | "all") => void;
  sort: string;
  onSortChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreate: () => void;
  totalCount?: number;
}

export function ExamToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  visibilityFilter,
  onVisibilityChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onCreate,
  totalCount,
}: ExamToolbarProps) {
  return (
      <div className="sticky top-12 z-20 -mx-4 -mt-4 border-b border-studio-border bg-studio-bg/90 px-4 pb-3 pt-4 backdrop-blur md:-mx-6 md:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-fg-muted" />
          <AppInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث في الاختبارات..."
            className="ps-10 pe-9 bg-studio-surface"
          />
        </div>

        <AppSelect value={statusFilter} onValueChange={(v) => onStatusChange(v as ExamStatus | "all")}>
          <AppSelectTrigger className="w-36 bg-studio-surface">
            <AppSelectValue placeholder="الحالة" />
          </AppSelectTrigger>
          <AppSelectContent>
            {EXAM_STATUS_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>

        <AppSelect value={visibilityFilter} onValueChange={(v) => onVisibilityChange(v as ExamVisibility | "all")}>
          <AppSelectTrigger className="w-36 bg-studio-surface">
            <AppSelectValue placeholder="الرؤية" />
          </AppSelectTrigger>
          <AppSelectContent>
            {VISIBILITY_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>

        <AppSelect value={sort} onValueChange={onSortChange}>
          <AppSelectTrigger className="w-44 bg-studio-surface">
            <AppSelectValue placeholder="الترتيب" />
          </AppSelectTrigger>
          <AppSelectContent>
            {SORT_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>

        <div className="flex items-center rounded-lg border border-studio-border">
          <StudioButton
            variant={viewMode === "grid" ? "soft" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none rounded-e-lg"
            aria-label="عرض شبكي"
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </StudioButton>
          <StudioButton
            variant={viewMode === "list" ? "soft" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none rounded-s-lg"
            aria-label="عرض قائمة"
            aria-pressed={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </StudioButton>
        </div>

        <StudioButton variant="primary" onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          إنشاء اختبار
        </StudioButton>
      </div>

      {totalCount !== undefined ? (
        <div className="mt-2 text-xs text-studio-fg-muted">
          {totalCount} {totalCount === 1 ? "اختبار" : "اختبار"}
        </div>
      ) : null}
    </div>
  );
}

export default ExamToolbar;
