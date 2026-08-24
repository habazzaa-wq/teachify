"use client";

import { useMemo, useCallback, memo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Upload, FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMediaWorkspaceStore } from "../../store";
import { useMediaAssets, useFolderBreadcrumbs, useToggleFavorite, useTogglePin, useArchiveAsset, useDuplicateAsset } from "../../hooks";
import { mediaLibraryService } from "../../services";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { MediaBreadcrumbs } from "./MediaBreadcrumbs";
import { DamMediaCard } from "./DamMediaCard";
import { BulkActionsBar } from "./BulkActionsBar";
import { MediaPagination } from "./MediaPagination";
import { StudioGenericError } from "@/components/studio";
import type { MediaAsset, MediaFilterParams } from "../../types";

interface AssetWorkspaceProps {
  onUpload: () => void;
  onCreateFolder: () => void;
  onRenameAsset: (asset: MediaAsset) => void;
  onMoveAsset: (asset: MediaAsset) => void;
  onDeleteAsset: (asset: MediaAsset) => void;
  onDownloadAsset: (asset: MediaAsset) => void;
  onBulkDelete: () => void;
  onBulkMove: () => void;
  onOpenFolders?: () => void;
}

function groupAssets(assets: MediaAsset[], groupBy: string): Map<string, MediaAsset[]> {
  if (groupBy === "none" || !assets.length) return new Map([["all", assets]]);

  const groups = new Map<string, MediaAsset[]>();

  for (const asset of assets) {
    let key = "أخرى";
    switch (groupBy) {
      case "type":
        key = MEDIA_TYPE_CONFIG_MAP[asset.type] ?? asset.type;
        break;
      case "date":
        try {
          const d = new Date(asset.createdAt);
          key = d.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
        } catch {
          key = "تاريخ غير معروف";
        }
        break;
      case "owner":
        key = asset.uploader?.name ?? "غير معروف";
        break;
      case "size":
        if (asset.size >= 1_073_741_824) key = "أكبر من 1 GB";
        else if (asset.size >= 104_857_600) key = "100 MB - 1 GB";
        else if (asset.size >= 10_485_760) key = "10 - 100 MB";
        else if (asset.size >= 1_048_576) key = "1 - 10 MB";
        else key = "أقل من 1 MB";
        break;
    }
    const arr = groups.get(key) ?? [];
    arr.push(asset);
    groups.set(key, arr);
  }

  return groups;
}

const MEDIA_TYPE_CONFIG_MAP: Record<string, string> = {
  video: "فيديو",
  image: "صور",
  audio: "صوت",
  document: "مستندات",
  pdf: "PDF",
  zip: "أرشيف",
  presentation: "عروض تقديمية",
  spreadsheet: "جداول بيانات",
  link: "روابط",
  file: "ملفات أخرى",
};

function AssetWorkspaceBase({
  onUpload,
  onCreateFolder,
  onRenameAsset,
  onMoveAsset,
  onDeleteAsset,
  onDownloadAsset,
  onBulkDelete,
  onBulkMove,
  onOpenFolders,
}: AssetWorkspaceProps) {
  const {
    selectedFolderId,
    viewMode,
    groupBy,
    sortField,
    sortDirection,
    selectedIds,
    selectAsset,
    selectAll,
    clearSelection,
    setInspectorAssetId,
    filters,
    currentPage,
    perPage,
    setCurrentPage,
    setPerPage,
  } = useMediaWorkspaceStore();

  const assetParams = useMemo((): MediaFilterParams => {
    const params: MediaFilterParams = {
      sort: sortField,
      sort_dir: sortDirection,
    };
    if (filters.search) params.search = filters.search;
    if (filters.type !== "all") params.type = filters.type;
    if (filters.status !== "all" && filters.status !== "archived") params.status = filters.status;
    if (filters.visibility !== "all") params.visibility = filters.visibility;
    if (filters.extension) params.extension = filters.extension;
    if (filters.favorites) params.favorites = true;
    if (filters.pinned) params.pinned = true;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;
    if (filters.uploaderId) params.uploader_id = filters.uploaderId;
    if (typeof selectedFolderId === "number") params.folder_id = selectedFolderId;
    if (selectedFolderId === "root") params.root = true;
    if (currentPage > 1) params.page = currentPage;
    if (perPage) params.per_page = perPage;
    return params;
  }, [selectedFolderId, sortField, sortDirection, filters, currentPage, perPage]);

  const { data, isLoading, isError, refetch } = useMediaAssets(assetParams);
  const assets = useMemo(() => data?.data ?? [], [data]);
  const totalAssets = Number(data?.meta?.total ?? 0);
  const paginationMeta = useMemo(() => {
    const meta = data?.meta ?? {};
    return {
      currentPage: Number(meta.current_page ?? currentPage),
      lastPage: Number(meta.last_page ?? 1),
      perPage: Number(meta.per_page ?? perPage),
      total: totalAssets,
    };
  }, [data, currentPage, perPage, totalAssets]);

  const { data: breadcrumbs } = useFolderBreadcrumbs(
    typeof selectedFolderId === "number" ? selectedFolderId : null,
  );

  const toggleFavorite = useToggleFavorite();
  const togglePin = useTogglePin();
  const archiveAsset = useArchiveAsset();
  const duplicateAsset = useDuplicateAsset();

  const handleAssetClick = useCallback((asset: MediaAsset) => {
    setInspectorAssetId(asset.id);
  }, [setInspectorAssetId]);

  const handleFavorite = useCallback((asset: MediaAsset) => {
    toggleFavorite.mutate(asset.id);
  }, [toggleFavorite]);

  const handlePin = useCallback((asset: MediaAsset) => {
    togglePin.mutate(asset.id);
  }, [togglePin]);

  const handleArchive = useCallback((asset: MediaAsset) => {
    archiveAsset.mutate(asset.id);
  }, [archiveAsset]);

  const handleDuplicate = useCallback((asset: MediaAsset) => {
    duplicateAsset.mutate(asset.id);
  }, [duplicateAsset]);

  const handleSelect = useCallback((id: number, _selected: boolean, e?: React.MouseEvent) => {
    const assetIds = assets.map((a) => a.id);
    selectAsset(id, assets.findIndex((a) => a.id === id), !!e?.shiftKey, !!e?.ctrlKey || !!e?.metaKey, assetIds);
  }, [assets, selectAsset]);

  const handleSelectAllToggle = useCallback(async (checked: boolean) => {
    if (!checked) {
      clearSelection();
      return;
    }
    if (totalAssets === 0) return;
    try {
      const allIds = await mediaLibraryService.listAllAssetIds(assetParams);
      selectAll(allIds);
    } catch {
      selectAll(assets.map((a) => a.id));
    }
  }, [assetParams, totalAssets, assets, selectAll, clearSelection]);

  const grouped = useMemo(() => groupAssets(assets, groupBy), [assets, groupBy]);

  // Reset to the first page whenever the active filters, folder, or sort order
  // change so the user never lands on a stale (now empty) page.
  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId, sortField, sortDirection, filters]);

  const breadcrumbItems = useMemo(() => {
    if (!breadcrumbs) return [];
    return breadcrumbs.map((b) => ({ id: b.id, name: b.name }));
  }, [breadcrumbs]);

  const handleNavigate = useCallback((id: number | "root" | null) => {
    useMediaWorkspaceStore.getState().setSelectedFolderId(id);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <WorkspaceToolbar
        totalAssets={totalAssets}
        selectedCount={selectedIds.size}
        onSelectAllToggle={handleSelectAllToggle}
        onUpload={onUpload}
        onCreateFolder={onCreateFolder}
        onRefresh={() => refetch()}
        onOpenFolders={onOpenFolders}
      />

      {/* Breadcrumbs */}
      {breadcrumbItems.length > 0 && (
        <div className="border-b px-4 py-1.5">
          <MediaBreadcrumbs items={breadcrumbItems} onNavigate={handleNavigate} />
        </div>
      )}

      {/* Asset grid/list */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3">
        {isError ? (
          <StudioGenericError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className={cn(
            viewMode === "grid" || viewMode === "large"
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              : viewMode === "compact"
                ? "flex flex-col gap-1"
                : "flex flex-col gap-1",
          )}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-muted/50">
                {viewMode === "grid" || viewMode === "large" ? (
                  <>
                    <div className={cn("bg-muted", viewMode === "large" ? "aspect-[16/10]" : "aspect-video")} />
                    <div className="space-y-2 p-3">
                      <div className="h-3 w-3/4 rounded bg-muted" />
                      <div className="h-2 w-1/2 rounded bg-muted" />
                    </div>
                  </>
                ) : viewMode === "compact" ? (
                  <div className="flex h-16 items-center gap-2 p-2">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
                    <div className="space-y-1">
                      <div className="h-2.5 w-24 rounded bg-muted" />
                      <div className="h-2 w-16 rounded bg-muted" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-2">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-32 rounded bg-muted" />
                      <div className="h-2 w-20 rounded bg-muted" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <FolderOpen className="h-8 w-8 text-accent/40" />
            </div>
            <h3 className="mb-1 text-sm font-medium">
              {filters.search || filters.type !== "all" || filters.favorites || filters.pinned
                ? "لا توجد نتائج"
                : "هذا المجلد فارغ"}
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              {filters.search || filters.type !== "all" || filters.favorites || filters.pinned
                ? "جرّب تغيير معايير البحث"
                : "ابدأ برفع ملفات أو إنشاء مجلد فرعي"}
            </p>
            {!filters.search && filters.type === "all" && (
              <div className="flex gap-2">
                <button
                  onClick={onUpload}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  <Upload className="h-3.5 w-3.5" />
                  رفع ملف
                </button>
                <button
                  onClick={onCreateFolder}
                  className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Plus className="h-3.5 w-3.5" />
                  مجلد
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {Array.from(grouped.entries()).map(([groupKey, groupAssets]) => (
              <div key={groupKey} className="mb-4">
                {groupBy !== "none" && (
                  <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">
                    {groupKey}
                    <span className="ms-1.5 text-muted-foreground/50">({groupAssets.length})</span>
                  </h3>
                )}
                <div className={cn(
                  viewMode === "grid" || viewMode === "large"
                    ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : viewMode === "compact"
                      ? "flex flex-col gap-1"
                      : "flex flex-col gap-1",
                )}>
                  <AnimatePresence mode="popLayout">
                    {groupAssets.map((asset) => (
                      <DamMediaCard
                        key={asset.id}
                        asset={asset}
                        viewMode={viewMode}
                        selected={selectedIds.has(asset.id)}
                        onSelect={handleSelect}
                        onClick={handleAssetClick}
                        onFavorite={handleFavorite}
                        onRename={onRenameAsset}
                        onMove={onMoveAsset}
                        onDownload={onDownloadAsset}
                        onDuplicate={handleDuplicate}
                        onArchive={handleArchive}
                        onPin={handlePin}
                        onDelete={onDeleteAsset}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination footer */}
      <MediaPagination
        currentPage={paginationMeta.currentPage}
        lastPage={paginationMeta.lastPage}
        total={paginationMeta.total}
        perPage={paginationMeta.perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
        isLoading={isLoading}
      />

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        onDelete={onBulkDelete}
        onMove={onBulkMove}
        onFavorite={() => {
          selectedIds.forEach((id) => toggleFavorite.mutate(id));
          clearSelection();
        }}
        onArchive={() => {
          selectedIds.forEach((id) => archiveAsset.mutate(id));
          clearSelection();
        }}
        onDownload={() => {
          selectedIds.forEach((id) => {
            const asset = assets.find((a) => a.id === id);
            if (asset?.cdnUrl) window.open(asset.cdnUrl, "_blank");
          });
          clearSelection();
        }}
        onPin={() => {
          selectedIds.forEach((id) => togglePin.mutate(id));
          clearSelection();
        }}
        onDuplicate={() => {
          selectedIds.forEach((id) => duplicateAsset.mutate(id));
          clearSelection();
        }}
      />
    </div>
  );
}

export const AssetWorkspace = memo(AssetWorkspaceBase);
