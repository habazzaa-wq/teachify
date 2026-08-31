"use client";

import { Search, Grid3X3, List, Plus } from "lucide-react";
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
  QUESTION_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  QUESTION_STATUS_OPTIONS,
  VISIBILITY_OPTIONS,
  QUESTION_SORT_OPTIONS,
} from "@/features/exam-bank/constants";
import type {
  QuestionType,
  Difficulty,
  QuestionStatus,
  QuestionVisibility,
  ViewMode,
} from "@/features/exam-bank/types";

interface QuestionToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: QuestionType | "all";
  onTypeChange: (value: QuestionType | "all") => void;
  difficultyFilter: Difficulty | "all";
  onDifficultyChange: (value: Difficulty | "all") => void;
  statusFilter: QuestionStatus | "all";
  onStatusChange: (value: QuestionStatus | "all") => void;
  visibilityFilter: QuestionVisibility | "all";
  onVisibilityChange: (value: QuestionVisibility | "all") => void;
  sort: string;
  onSortChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreate: () => void;
  totalCount?: number;
}

export function QuestionToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  difficultyFilter,
  onDifficultyChange,
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
}: QuestionToolbarProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 -mt-4 border-b border-studio-border bg-studio-bg px-4 pb-3 pt-4 backdrop-blur md:-mx-6 md:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-fg-muted" />
          <AppInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث في بنك الأسئلة..."
            className="ps-10 pe-9 bg-studio-surface"
          />
        </div>

        <AppSelect value={typeFilter} onValueChange={(v) => onTypeChange(v as QuestionType | "all")}>
          <AppSelectTrigger className="w-[150px] bg-studio-surface">
            <AppSelectValue placeholder="النوع" />
          </AppSelectTrigger>
          <AppSelectContent>
            {QUESTION_TYPE_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>

        <AppSelect value={difficultyFilter} onValueChange={(v) => onDifficultyChange(v as Difficulty | "all")}>
          <AppSelectTrigger className="w-[130px] bg-studio-surface">
            <AppSelectValue placeholder="المستوى" />
          </AppSelectTrigger>
          <AppSelectContent>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>

        <AppSelect value={statusFilter} onValueChange={(v) => onStatusChange(v as QuestionStatus | "all")}>
          <AppSelectTrigger className="w-[130px] bg-studio-surface">
            <AppSelectValue placeholder="الحالة" />
          </AppSelectTrigger>
          <AppSelectContent>
            {QUESTION_STATUS_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>

        <AppSelect value={visibilityFilter} onValueChange={(v) => onVisibilityChange(v as QuestionVisibility | "all")}>
          <AppSelectTrigger className="w-[130px] bg-studio-surface">
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
          <AppSelectTrigger className="w-[150px] bg-studio-surface">
            <AppSelectValue placeholder="الترتيب" />
          </AppSelectTrigger>
          <AppSelectContent>
            {QUESTION_SORT_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>

        <div className="flex items-center rounded-lg border border-studio-border bg-studio-surface">
          <button
            type="button"
            aria-label="عرض شبكي"
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-e-lg transition-colors",
              viewMode === "grid"
                ? "bg-studio-accent-soft text-studio-accent"
                : "text-studio-fg-muted hover:text-studio-fg",
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="عرض قائمة"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-s-lg transition-colors",
              viewMode === "list"
                ? "bg-studio-accent-soft text-studio-accent"
                : "text-studio-fg-muted hover:text-studio-fg",
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        <StudioButton onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          إنشاء سؤال
        </StudioButton>
      </div>

      {totalCount !== undefined && (
        <div className="mt-2 text-xs text-studio-fg-muted">
          {totalCount} {totalCount === 1 ? "سؤال" : "سؤال"}
        </div>
      )}
    </div>
  );
}
