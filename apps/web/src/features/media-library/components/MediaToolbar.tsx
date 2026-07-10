"use client";

import { Search, Upload, Plus, Grid3X3, List, ChevronLeft } from "lucide-react";
import {
  AppButton,
  AppInput,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
} from "@/components/ui";
import { TYPE_OPTIONS, STATUS_OPTIONS, SORT_OPTIONS } from "../constants";
import type { ViewMode, MediaType, MediaStatus } from "../types";

interface Breadcrumb {
  id: number;
  name: string;
}

interface MediaToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: MediaType | "all";
  onTypeChange: (value: MediaType | "all") => void;
  statusFilter: MediaStatus | "all";
  onStatusChange: (value: MediaStatus | "all") => void;
  sort: string;
  onSortChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUpload: () => void;
  onCreateFolder: () => void;
  totalAssets?: number;
  breadcrumbs?: Breadcrumb[];
  onBreadcrumbClick?: (id: number | null) => void;
}

function MediaToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onUpload,
  onCreateFolder,
  totalAssets,
  breadcrumbs,
  onBreadcrumbClick,
}: MediaToolbarProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 -mt-4 bg-background px-4 pb-3 pt-4 shadow-sm md:-mx-6 md:px-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3 flex items-center gap-1 text-sm">
          <button
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onBreadcrumbClick?.(null)}
          >
            المكتبة
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <ChevronLeft className="h-3 w-3 text-muted-foreground/50" />
              <button
                className={
                  i === breadcrumbs.length - 1
                    ? "font-medium text-foreground"
                    : "text-muted-foreground transition-colors hover:text-foreground"
                }
                onClick={() => onBreadcrumbClick?.(crumb.id)}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search & actions row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <AppInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث في الوسائط..."
            className="ps-10 pe-9"
          />
        </div>

        <AppSelect value={typeFilter} onValueChange={onTypeChange}>
          <AppSelectTrigger className="w-32">
            <AppSelectValue placeholder="النوع" />
          </AppSelectTrigger>
          <AppSelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>

        <AppSelect value={statusFilter} onValueChange={onStatusChange}>
          <AppSelectTrigger className="w-32">
            <AppSelectValue placeholder="الحالة" />
          </AppSelectTrigger>
          <AppSelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>

        <AppSelect value={sort} onValueChange={onSortChange}>
          <AppSelectTrigger className="w-36">
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

        <div className="flex items-center rounded-lg border">
          <AppButton
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none rounded-r-lg"
            onClick={() => onViewModeChange("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </AppButton>
          <AppButton
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none rounded-l-lg"
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </AppButton>
        </div>

        <div className="flex items-center gap-2">
          <AppButton variant="outline" size="sm" onClick={onCreateFolder} className="gap-2">
            <Plus className="h-4 w-4" />
            مجلد
          </AppButton>
          <AppButton size="sm" onClick={onUpload} className="gap-2">
            <Upload className="h-4 w-4" />
            رفع
          </AppButton>
        </div>
      </div>

      {/* Summary */}
      {totalAssets !== undefined && (
        <div className="mt-2 text-xs text-muted-foreground">
          {totalAssets} {totalAssets === 1 ? "ملف" : "ملف"}
        </div>
      )}
    </div>
  );
}

export { MediaToolbar };
