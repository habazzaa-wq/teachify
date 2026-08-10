"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { AppButton } from "@/components/ui/AppButton";
import {
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
} from "@/components/ui/AppSelect";
import type { StageItem } from "@/features/homepage/educational-stages/types";
import type { CatalogFilters, CatalogPricingFilter, CatalogSort, CatalogSubject, CatalogTeacher } from "../types";
import { PRICING_OPTIONS, PRIMARY, SORT_OPTIONS } from "../constants";

interface CatalogFiltersPanelProps {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  filters: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onReset: () => void;
  stages: StageItem[];
  subjects: CatalogSubject[];
  teachers: CatalogTeacher[];
  showSubmit?: boolean;
}

export function CatalogFiltersPanel({
  searchDraft,
  onSearchDraftChange,
  onSearchSubmit,
  filters,
  onChange,
  onReset,
  stages,
  subjects,
  teachers,
  showSubmit = false,
}: CatalogFiltersPanelProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const activeCount =
    (filters.search ? 1 : 0) +
    (filters.stageId ? 1 : 0) +
    (filters.subjectId ? 1 : 0) +
    (filters.teacherId ? 1 : 0) +
    (filters.pricing && filters.pricing !== "all" ? 1 : 0);

  const panelLabel = isDark ? "#8a8290" : "#7a7168";
  const selectBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";

  return (
    <div dir="rtl" className="flex flex-col gap-5 p-5">
      {/* search */}
      <div>
        <p className="mb-2 text-sm font-bold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
          البحث في الدورات
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: panelLabel }} />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => onSearchDraftChange(e.target.value)}
              placeholder="اسم الدورة، المدرّس..."
              className="h-10 w-full rounded-xl pe-9 ps-9 text-sm outline-none transition-all focus:ring-2"
              style={{
                background: selectBg,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                color: isDark ? "#F0ECE6" : "#1a1510",
                ["--tw-ring-color" as string]: PRIMARY,
              }}
            />
            {searchDraft && (
              <button
                type="button"
                onClick={() => onSearchDraftChange("")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors hover:opacity-70"
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4" style={{ color: panelLabel }} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* stage */}
      <div>
        <p className="mb-2 text-sm font-bold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
          المرحلة الدراسية
        </p>
        <AppSelect
          value={filters.stageId ?? "all"}
          onValueChange={(value) => onChange({ stageId: value === "all" ? undefined : value })}
        >
          <AppSelectTrigger style={{ background: selectBg }}>
            <AppSelectValue placeholder="كل المراحل" />
          </AppSelectTrigger>
          <AppSelectContent>
            <AppSelectItem value="all">كل المراحل</AppSelectItem>
            {stages.map((stage) => (
              <AppSelectItem key={stage.id} value={String(stage.id)}>
                {stage.name}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>
      </div>

      {/* subject */}
      <div>
        <p className="mb-2 text-sm font-bold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
          المادة الدراسية
        </p>
        <AppSelect
          value={filters.subjectId ?? "all"}
          onValueChange={(value) => onChange({ subjectId: value === "all" ? undefined : value })}
        >
          <AppSelectTrigger style={{ background: selectBg }}>
            <AppSelectValue placeholder="كل المواد" />
          </AppSelectTrigger>
          <AppSelectContent>
            <AppSelectItem value="all">كل المواد</AppSelectItem>
            {subjects.map((subject) => (
              <AppSelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>
      </div>

      {/* teacher */}
      <div>
        <p className="mb-2 text-sm font-bold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
          المدرّس
        </p>
        <AppSelect
          value={filters.teacherId ?? "all"}
          onValueChange={(value) => onChange({ teacherId: value === "all" ? undefined : value })}
        >
          <AppSelectTrigger style={{ background: selectBg }}>
            <AppSelectValue placeholder="كل المدرّسين" />
          </AppSelectTrigger>
          <AppSelectContent>
            <AppSelectItem value="all">كل المدرّسين</AppSelectItem>
            {teachers.map((teacher) => (
              <AppSelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>
      </div>

      {/* pricing */}
      <div>
        <p className="mb-2 text-sm font-bold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
          السعر
        </p>
        <div className="grid grid-cols-3 gap-1 rounded-xl p-1" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
          {PRICING_OPTIONS.map(({ value, label }) => {
            const active = (filters.pricing ?? "all") === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ pricing: value as CatalogPricingFilter })}
                className="rounded-lg px-2 py-1.5 text-xs font-bold transition-all duration-200"
                style={{
                  background: active ? PRIMARY : "transparent",
                  color: active ? "#fff" : isDark ? "#8a8290" : "#7a7168",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* sort */}
      <div>
        <p className="mb-2 text-sm font-bold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
          الترتيب
        </p>
        <AppSelect
          value={filters.sort ?? "newest"}
          onValueChange={(value) => onChange({ sort: value as CatalogSort })}
        >
          <AppSelectTrigger style={{ background: selectBg }}>
            <AppSelectValue placeholder="الأحدث" />
          </AppSelectTrigger>
          <AppSelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <AppSelectItem key={value} value={value}>
                {label}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>
      </div>

      {/* reset */}
      <div className="flex items-center gap-3">
        <AppButton
          type="button"
          variant="outline"
          className="flex-1"
          disabled={activeCount === 0}
          onClick={onReset}
        >
          <X className="h-4 w-4" />
          إعادة تعيين
          {activeCount > 0 && (
            <span className="rounded-full px-1.5 text-[11px] font-bold" style={{ background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}>
              {activeCount}
            </span>
          )}
        </AppButton>

        {showSubmit && (
          <AppButton type="button" className="flex-1" onClick={onSearchSubmit}>
            <SlidersHorizontal className="h-4 w-4" />
            عرض النتائج
          </AppButton>
        )}
      </div>
    </div>
  );
}
