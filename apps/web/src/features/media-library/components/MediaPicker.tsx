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

import { useState, useCallback, useMemo } from "react";
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
import type { ViewMode, MediaType, MediaStatus } from "../types";

interface MediaPickerResult {
  id: number;
  ids: number[];
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

  const { data, isLoading, isError, refetch } = useMediaAssets({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sort,
    types: allowedTypes,
    per_page: 50,
  });

  const assets = useMemo(() => data?.data ?? [], [data]);
  const handleSelect = useCallback(
    (id: number, selected: boolean) => {
      if (mode === "single") {
        const asset = assets.find((a) => a.id === id);
        if (asset) onSelect({ id, ids: [id] });
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
      if (ids[0] !== undefined) onSelect({ id: ids[0], ids });
    }
  }, [selectedIds, onSelect]);

  return (
    <AppDialog open={open} onOpenChange={onClose}>
      <AppDialogContent className="max-w-5xl" style={{ maxHeight: "90vh" }}>
        <AppDialogHeader>
          <AppDialogTitle>اختيار ملف وسائط</AppDialogTitle>
        </AppDialogHeader>

        <div className="flex-1 overflow-y-auto">
          <MediaToolbar
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onUpload={() => {}}
            onCreateFolder={() => {}}
          />

          <div className="mt-4">
            {isError ? (
              <MediaErrorState onRetry={() => refetch()} />
            ) : isLoading ? (
              <MediaLoadingState />
            ) : assets.length === 0 ? (
              <MediaEmptyState />
            ) : (
              <MediaGrid
                assets={assets}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onAssetClick={(asset) => {
                  if (mode === "single") onSelect({ id: asset.id, ids: [asset.id] });
                  else handleSelect(asset.id, !selectedIds.has(asset.id));
                }}
                selectable={mode === "multi"}
              />
            )}
          </div>
        </div>

        {mode === "multi" && (
          <div className="flex items-center justify-between border-t pt-4">
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
