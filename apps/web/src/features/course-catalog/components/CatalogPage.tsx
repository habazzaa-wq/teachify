"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { formatNumber } from "@/lib/format";
import { useCatalogCourses, useCatalogStages } from "../hooks";
import type { CatalogFilters } from "../types";
import { PRIMARY } from "../constants";
import { CatalogHero } from "./CatalogHero";
import { CatalogFiltersPanel } from "./CatalogFiltersPanel";
import { CatalogFiltersSheet } from "./CatalogFiltersSheet";
import { CatalogStageStrip } from "./CatalogStageStrip";
import { CatalogCourseGrid } from "./CatalogCourseGrid";

export function CatalogPage({
  initialFilters = {},
  initialPage = 1,
}: {
  initialFilters?: CatalogFilters;
  initialPage?: number;
}) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const { data: stagesData } = useCatalogStages();

  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [searchDraft, setSearchDraft] = useState(initialFilters.search ?? "");
  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [page, setPage] = useState(initialPage);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Debounce the search term before it hits the API.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const next = searchDraft.trim();
      setSearch((prev) => {
        if (prev === next) {
          return prev;
        }
        setPage(1);
        return next;
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchDraft]);

  const appliedFilters = useMemo<CatalogFilters>(
    () => ({ ...filters, search: search || undefined }),
    [filters, search],
  );

  const { data, isLoading, isFetching } = useCatalogCourses(appliedFilters, page);

  const handleChange = useCallback((patch: Partial<CatalogFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilters({});
    setSearchDraft("");
    setSearch("");
    setPage(1);
  }, []);

  const handleSelectStage = useCallback(
    (stageId: string | undefined) => {
      setFilters((prev) => ({ ...prev, stageId }));
      setPage(1);
    },
    [],
  );

  const activeCount =
    (appliedFilters.search ? 1 : 0) +
    (appliedFilters.stageId ? 1 : 0) +
    (appliedFilters.subjectId ? 1 : 0) +
    (appliedFilters.teacherId ? 1 : 0) +
    (appliedFilters.pricing && appliedFilters.pricing !== "all" ? 1 : 0);

  const stages = stagesData ?? [];
  const aggregates = data?.aggregates;
  const subjects = aggregates?.subjects ?? [];
  const teachers = aggregates?.teachers ?? [];

  return (
    <div dir="rtl" className="relative min-h-screen" style={{ background: isDark ? "#0b0a10" : "#f6f2ea" }}>
      <CatalogHero aggregates={aggregates} isLoading={isLoading} />

      <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        {/* stages quick filter */}
        <CatalogStageStrip
          stages={stages}
          activeStageId={appliedFilters.stageId}
          onSelect={handleSelectStage}
        />

        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
          {/* ── Desktop sidebar ── */}
          <aside className="hidden lg:block">
            <div
              className="sticky top-20 overflow-hidden rounded-3xl"
              style={{
                background: isDark ? "#16141e" : "#fff",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                boxShadow: isDark
                  ? "0 1px 2px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)"
                  : "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(120,90,60,0.06)",
              }}
            >
              <div
                className="flex items-center gap-2 border-b px-5 py-4"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
              >
                <SlidersHorizontal className="h-4 w-4" style={{ color: PRIMARY }} />
                <h2 className="text-sm font-extrabold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
                  الفلاتر
                </h2>
              </div>
              <CatalogFiltersPanel
                searchDraft={searchDraft}
                onSearchDraftChange={setSearchDraft}
                onSearchSubmit={() => undefined}
                filters={filters}
                onChange={handleChange}
                onReset={handleReset}
                stages={stages}
                subjects={subjects}
                teachers={teachers}
              />
            </div>
          </aside>

          {/* ── Main column ── */}
          <div>
            {/* mobile toolbar */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}cc)`,
                  boxShadow: `0 4px 16px ${PRIMARY}40`,
                }}
              >
                <SlidersHorizontal className="h-4 w-4" />
                الفلترة
                {activeCount > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[11px] font-bold tabular-nums">
                    {activeCount}
                  </span>
                )}
              </button>

              {data && (
                <p className="text-xs font-semibold" style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}>
                  {formatNumber(data.total)} دورة
                </p>
              )}

              {isFetching && (
                <span className="ms-auto inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: PRIMARY }}>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  جارٍ التحديث
                </span>
              )}
            </div>

            <CatalogCourseGrid
              courses={data?.data}
              isLoading={isLoading}
              total={data?.total ?? 0}
              currentPage={page}
              lastPage={data?.lastPage ?? 1}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* mobile bottom sheet */}
      <CatalogFiltersSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearchSubmit={() => setSheetOpen(false)}
        filters={filters}
        onChange={handleChange}
        onReset={handleReset}
        stages={stages}
        subjects={subjects}
        teachers={teachers}
      />
    </div>
  );
}
