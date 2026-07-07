"use client";

import { Search, RefreshCw, ArrowUpDown, ChevronDown, ChevronUp, FolderOpen, FolderClosed } from "lucide-react";
import { AppButton, AppInput, AppSelect, AppSelectTrigger, AppSelectValue, AppSelectContent, AppSelectItem, AppSelectGroup, AppSelectLabel, AppSelectSeparator } from "@/components/ui";
import { STATUS_OPTIONS, FEATURED_OPTIONS, PARENT_OPTIONS, HAS_COURSES_OPTIONS, SORT_OPTIONS } from "../constants";
import type { CategoryStatus } from "../types";

interface CategoriesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: CategoryStatus | "all";
  onStatusChange: (value: CategoryStatus | "all") => void;
  featuredFilter: boolean | "all";
  onFeaturedChange: (value: boolean | "all") => void;
  parentFilter: number | "all" | "none" | "has";
  onParentChange: (value: number | "all" | "none" | "has") => void;
  hasCoursesFilter: boolean | "all";
  onHasCoursesChange: (value: boolean | "all") => void;
  sort: string;
  onSortChange: (value: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

function CategoriesToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  featuredFilter,
  onFeaturedChange,
  parentFilter,
  onParentChange,
  hasCoursesFilter,
  onHasCoursesChange,
  sort,
  onSortChange,
  onRefresh,
  refreshing,
}: CategoriesToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="بحث بالاسم أو الوصف..."
          className="ps-9 h-9"
        />
      </div>

      <AppSelect
        value={statusFilter}
        onValueChange={(val) => onStatusChange(val as CategoryStatus | "all")}
      >
        <AppSelectTrigger className="h-9 w-[120px]">
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

      <AppSelect
        value={String(featuredFilter)}
        onValueChange={(val) => onFeaturedChange(val === "true" ? true : val === "false" ? false : val as boolean | "all")}
      >
        <AppSelectTrigger className="h-9 w-[120px]">
          <AppSelectValue placeholder="مميز" />
        </AppSelectTrigger>
        <AppSelectContent>
          {FEATURED_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={String(parentFilter)}
        onValueChange={(val) => onParentChange(val === "none" || val === "has" || val === "all" ? val : Number(val))}
      >
        <AppSelectTrigger className="h-9 w-[150px]">
          <AppSelectValue placeholder="التصنيف الأب" />
        </AppSelectTrigger>
        <AppSelectContent>
          <AppSelectGroup>
            <AppSelectLabel>الكل</AppSelectLabel>
            <AppSelectItem key="all" value="all">جميع التصنيفات</AppSelectItem>
          </AppSelectGroup>
          <AppSelectSeparator />
          <AppSelectGroup>
            <AppSelectLabel>العلاقة</AppSelectLabel>
            <AppSelectItem key="none" value="none">تصنيفات رئيسية فقط</AppSelectItem>
            <AppSelectItem key="has" value="has">تصنيفات فرعية فقط</AppSelectItem>
          </AppSelectGroup>
          <AppSelectSeparator />
          <AppSelectGroup>
            <AppSelectLabel>تصنيفات محددة</AppSelectLabel>
            {/* Specific parent categories would be populated dynamically */}
          </AppSelectGroup>
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={String(hasCoursesFilter)}
        onValueChange={(val) => onHasCoursesChange(val === "true" ? true : val === "false" ? false : val as boolean | "all")}
      >
        <AppSelectTrigger className="h-9 w-[120px]">
          <AppSelectValue placeholder="دورات" />
        </AppSelectTrigger>
        <AppSelectContent>
          {HAS_COURSES_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect value={sort} onValueChange={onSortChange}>
        <AppSelectTrigger className="h-9 w-[120px]">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <AppSelectValue placeholder="ترتيب" />
        </AppSelectTrigger>
        <AppSelectContent>
          {SORT_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppButton variant="outline" size="sm" className="h-9" onClick={onRefresh} loading={refreshing}>
        <RefreshCw className="h-4 w-4" />
        تحديث
      </AppButton>
    </div>
  );
}

export { CategoriesToolbar };