"use client";

import { AppDialog, AppDialogContent } from "@/components/ui/AppDialog";
import { useUiStore } from "@/stores/ui.store";
import type { StageItem } from "@/features/homepage/educational-stages/types";
import type { CatalogFilters, CatalogSubject, CatalogTeacher } from "../types";
import { CatalogFiltersPanel } from "./CatalogFiltersPanel";

interface CatalogFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  filters: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onReset: () => void;
  stages: StageItem[];
  subjects: CatalogSubject[];
  teachers: CatalogTeacher[];
}

export function CatalogFiltersSheet({
  open,
  onOpenChange,
  searchDraft,
  onSearchDraftChange,
  onSearchSubmit,
  filters,
  onChange,
  onReset,
  stages,
  subjects,
  teachers,
}: CatalogFiltersSheetProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent
        className="fixed bottom-0 start-0 end-0 top-auto max-h-[85dvh] w-full translate-x-0 translate-y-0 rounded-t-3xl rounded-b-none p-0 sm:max-w-none data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full"
      >
        <div
          className="flex max-h-[85dvh] flex-col overflow-hidden"
          style={{
            background: isDark ? "#16141e" : "#fff",
          }}
        >
          {/* grab handle */}
          <div className="flex shrink-0 items-center justify-center pt-3">
            <span
              className="h-1.5 w-12 rounded-full"
              style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }}
            />
          </div>

          <div className="flex items-center justify-between px-5 pb-2 pt-3">
            <h2 className="text-base font-extrabold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
              تصفية النتائج
            </h2>
            <p className="text-xs font-medium" style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}>
              حدّد الفلاتر ثم عرض النتائج
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <CatalogFiltersPanel
              searchDraft={searchDraft}
              onSearchDraftChange={onSearchDraftChange}
              onSearchSubmit={onSearchSubmit}
              filters={filters}
              onChange={onChange}
              onReset={onReset}
              stages={stages}
              subjects={subjects}
              teachers={teachers}
              showSubmit
            />
          </div>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}
