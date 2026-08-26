"use client";

/**
 * MediaPicker — Reusable component for the Course Builder to select media assets.
 *
 * Architecture:
 * - Single Select mode: returns { id: number } via onSelect callback
 * - Multi Select mode: returns { ids: number[] } via onSelect callback
 *
 * Usage from Course Builder:
 *   <MediaPicker
 *     mode="single"
 *     onSelect={(result) => handleAssetSelected(result)}
 *     onClose={() => setPickerOpen(false)}
 *   />
 *
 * This component is NOT yet wired into Course Builder.
 * It only exposes the interface that Course Builder will consume.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppButton,
} from "@/components/ui";
import { useMediaAssets } from "../hooks";
import { MediaGrid } from "./MediaGrid";
import { MediaToolbar } from "./MediaToolbar";
import { MediaEmptyState } from "./MediaEmptyState";
import { MediaLoadingState } from "./MediaLoadingState";
import { MediaErrorState } from "./MediaErrorState";
import { MediaPagination } from "./workspace/MediaPagination";
import type { ViewMode, MediaType, MediaStatus } from "../types";

interface MediaPickerResult {
  id: number;
  ids: number[];
  title?: string | null;
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (result: MediaPickerResult) => void;
  mode?: "single" | "multi";
  allowedTypes?: MediaType[];
}

function MediaPicker({
  open,
  onClose,
  onSelect,
  mode = "single",
  allowedTypes,
}: MediaPickerProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MediaStatus | "all">("all");
  const [sort, setSort] = useState("created_at");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(24);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Any filter change should return the user to the first page. We reset the
  // page inside the handlers (not an effect) to avoid cascading re-renders.
  const gotoFirstPage = useCallback(() => setPage(1), []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      gotoFirstPage();
    },
    [gotoFirstPage],
  );
  const handleTypeChange = useCallback(
    (value: MediaType | "all") => {
      setTypeFilter(value);
      gotoFirstPage();
    },
    [gotoFirstPage],
  );
  const handleStatusChange = useCallback(
    (value: MediaStatus | "all") => {
      setStatusFilter(value);
      gotoFirstPage();
    },
    [gotoFirstPage],
  );
  const handleSortChange = useCallback(
    (value: string) => {
      setSort(value);
      gotoFirstPage();
    },
    [gotoFirstPage],
  );
  const handlePerPageChange = useCallback(
    (value: number) => {
      setPerPage(value);
      gotoFirstPage();
    },
    [gotoFirstPage],
  );

  // Scroll the results back to the top whenever the page or page size changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [page, perPage]);

  const { data, isLoading, isError, refetch, isFetching } = useMediaAssets({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sort,
    types: allowedTypes,
    page,
    per_page: perPage,
  });

  const assets = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta ?? {};
  const total = Number(meta.total ?? 0);
  const lastPage = Number(meta.last_page ?? 1);
  const currentPage = Number(meta.current_page ?? page);

  const handleSelect = useCallback(
    (id: number, selected: boolean) => {
      if (mode === "single") {
        const asset = assets.find((a) => a.id === id);
        if (asset) onSelect({ id, ids: [id], title: asset.title ?? asset.originalName });
        return;
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) next.add(id);
        else next.delete(id);
        return next;
      });
    },
    [mode, assets, onSelect],
  );

  const handleConfirm = useCallback(() => {
    if (selectedIds.size > 0) {
      const ids = [...selectedIds];
      const first = assets.find((a) => a.id === ids[0]);
      if (ids[0] !== undefined) onSelect({ id: ids[0], ids, title: first?.title ?? first?.originalName });
    }
  }, [selectedIds, assets, onSelect]);

  const showGridLoading = isLoading;

  return (
    <AppDialog open={open} onOpenChange={onClose}>
      <AppDialogContent
        className="max-w-5xl"
        style={{
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <AppDialogHeader className="border-b px-5 py-4">
          <AppDialogTitle>اختيار ملف وسائط</AppDialogTitle>
        </AppDialogHeader>

        {/* Scrollable results area */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 md:px-6">
          <MediaToolbar
            search={search}
            onSearchChange={handleSearchChange}
            typeFilter={typeFilter}
            onTypeChange={handleTypeChange}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            sort={sort}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onUpload={() => {}}
            onCreateFolder={() => {}}
            totalAssets={total}
          />

          <div className="relative mt-4">
            {isFetching && !showGridLoading && (
              <div className="absolute inset-x-0 -top-2 z-10 flex justify-center">
                <span className="rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm ring-1 ring-border">
                  جارٍ التحميل…
                </span>
              </div>
            )}

            {isError ? (
              <MediaErrorState onRetry={() => refetch()} />
            ) : showGridLoading ? (
              <MediaLoadingState />
            ) : assets.length === 0 ? (
              <MediaEmptyState />
            ) : (
              <MediaGrid
                assets={assets}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onAssetClick={(asset) => {
                  if (mode === "single") onSelect({ id: asset.id, ids: [asset.id], title: asset.title ?? asset.originalName });
                  else handleSelect(asset.id, !selectedIds.has(asset.id));
                }}
                selectable={mode === "multi"}
              />
            )}
          </div>
        </div>

        {/* Pagination footer — lets the user browse the whole library */}
        {!showGridLoading && !isError && total > 0 && (
          <MediaPagination
            currentPage={currentPage}
            lastPage={lastPage}
            total={total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={handlePerPageChange}
            isLoading={isFetching}
            pageSizeOptions={[24, 36, 48, 72, 96]}
          />
        )}

        {mode === "multi" && (
          <div className="flex items-center justify-between border-t bg-background px-5 py-4">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} {selectedIds.size === 1 ? "محدد" : "محددين"}
            </span>
            <div className="flex gap-3">
              <AppButton variant="outline" onClick={onClose}>إلغاء</AppButton>
              <AppButton onClick={handleConfirm} disabled={selectedIds.size === 0}>
                تأكيد الاختيار
              </AppButton>
            </div>
          </div>
        )}
      </AppDialogContent>
    </AppDialog>
  );
}

/**
 * useMediaPicker — Hook to control MediaPicker visibility.
 *
 * Usage:
 *   const picker = useMediaPicker();
 *   return (
 *     <>
 *       <button onClick={picker.open}>Select Asset</button>
 *       <MediaPicker {...picker.props} onSelect={handleSelect} />
 *     </>
 *   );
 */
function useMediaPicker() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    props: {
      open: isOpen,
      onClose: () => setIsOpen(false),
    } as const,
  };
}

export { MediaPicker, useMediaPicker };
export type { MediaPickerProps, MediaPickerResult };
