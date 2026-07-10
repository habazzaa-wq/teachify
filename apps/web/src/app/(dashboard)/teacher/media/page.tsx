"use client";

import { useState, useCallback, useMemo } from "react";
import { Pin, Star } from "lucide-react";
import {
  AppPage,
} from "@/components/ui";
import {
  useMediaAssets,
  useFolderBreadcrumbs,
  useRenameAsset,
  useMoveAsset,
  useToggleFavorite,
  useTogglePin,
  useArchiveAsset,
  useDeleteAsset,
  useDuplicateAsset,
  useBulkDelete,
  useBulkMove,
  useCreateFolder,
  useMoveFolder,
} from "@/features/media-library/hooks";
import { MediaToolbar } from "@/features/media-library/components/MediaToolbar";
import { MediaGrid } from "@/features/media-library/components/MediaGrid";
import { MediaEmptyState } from "@/features/media-library/components/MediaEmptyState";
import { MediaLoadingState } from "@/features/media-library/components/MediaLoadingState";
import { MediaErrorState } from "@/features/media-library/components/MediaErrorState";
import { MediaPreview } from "@/features/media-library/components/MediaPreview";
import { FolderSidebar } from "@/features/media-library/components/FolderSidebar";
import { UploadDrawer } from "@/features/media-library/components/UploadDrawer";
import { BulkActionBar } from "@/features/media-library/components/BulkActionBar";
import { RenameDialog } from "@/features/media-library/components/RenameDialog";
import { DeleteDialog } from "@/features/media-library/components/DeleteDialog";
import { MoveDialog } from "@/features/media-library/components/MoveDialog";
import { CreateFolderDialog } from "@/features/media-library/components/CreateFolderDialog";
import type { MediaAsset, ViewMode, MediaType, MediaStatus } from "@/features/media-library/types";

function MediaPage() {
  // Filters & view
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MediaStatus | "all">("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [sort, setSort] = useState("created_at");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Folder
  const [selectedFolderId, setSelectedFolderId] = useState<number | "root" | null>("root");
  const { data: breadcrumbs } = useFolderBreadcrumbs(
    typeof selectedFolderId === "number" ? selectedFolderId : null,
  );

  // Selection & preview
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  // Dialogs
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | "bulk" | null>(null);
  const [moveTarget, setMoveTarget] = useState<MediaAsset | "bulk" | null>(null);

  // Fetch assets
  const params = useMemo(() => ({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    pinned: pinnedOnly || undefined,
    sort,
    sort_dir: "desc" as const,
    folder_id: selectedFolderId === "root" ? undefined : (selectedFolderId ?? undefined),
    root: selectedFolderId === "root" ? true : undefined,
  }), [search, typeFilter, statusFilter, sort, selectedFolderId, pinnedOnly]);

  const { data, isLoading, isError, refetch } = useMediaAssets(params);
  const assets = data?.data ?? [];
  const totalAssets = Number(data?.meta?.total ?? 0);
  const hasFilters = search !== "" || typeFilter !== "all" || statusFilter !== "all";

  // Mutations
  const renameAsset = useRenameAsset();
  const moveAsset = useMoveAsset();
  const toggleFavorite = useToggleFavorite();
  const togglePin = useTogglePin();
  const archiveAsset = useArchiveAsset();
  const deleteAsset = useDeleteAsset();
  const duplicateAsset = useDuplicateAsset();
  const bulkDelete = useBulkDelete();
  const bulkMove = useBulkMove();
  const createFolder = useCreateFolder();
  const moveFolder = useMoveFolder();

  // Handlers
  const handleSelectFolder = useCallback((id: number | "root" | null) => {
    setSelectedFolderId(id);
    setSelectedIds(new Set());
  }, []);

  const handleAssetClick = useCallback((asset: MediaAsset) => {
    setPreviewAsset(asset);
  }, []);

  const handleRenameSave = useCallback(
    (title: string) => {
      if (!renameTarget) return;
      renameAsset.mutate(
        { id: renameTarget.id, title },
        { onSuccess: () => setRenameTarget(null) },
      );
    },
    [renameTarget, renameAsset],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget === "bulk") {
      bulkDelete.mutate([...selectedIds], {
        onSuccess: () => { setDeleteTarget(null); setSelectedIds(new Set()); },
      });
    } else if (deleteTarget) {
      deleteAsset.mutate(deleteTarget.id, {
        onSuccess: () => { setDeleteTarget(null); setPreviewAsset(null); },
      });
    }
  }, [deleteTarget, bulkDelete, deleteAsset, selectedIds]);

  const handleMoveConfirm = useCallback(
    (folderId: number | null) => {
      if (moveTarget === "bulk") {
        bulkMove.mutate(
          { ids: [...selectedIds], folderId },
          { onSuccess: () => { setMoveTarget(null); setSelectedIds(new Set()); } },
        );
      } else if (moveTarget) {
        moveAsset.mutate(
          { id: moveTarget.id, folderId },
          { onSuccess: () => setMoveTarget(null) },
        );
      }
    },
    [moveTarget, bulkMove, moveAsset, selectedIds],
  );

  const handleCreateFolderSave = useCallback(
    (name: string) => {
      createFolder.mutate(
        {
          name,
          parentId: typeof selectedFolderId === "number" ? selectedFolderId : null,
        },
        { onSuccess: () => setCreateFolderOpen(false) },
      );
    },
    [createFolder, selectedFolderId],
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeleteTarget("bulk");
  }, [selectedIds]);

  const handleBulkMove = useCallback(() => {
    if (selectedIds.size === 0) return;
    setMoveTarget("bulk");
  }, [selectedIds]);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return (
    <AppPage maxWidth="full">
      <div className="flex h-[calc(100vh-4rem)] gap-0">
        {/* Left Sidebar */}
        <FolderSidebar
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          onCreateFolder={() => setCreateFolderOpen(true)}
          onMoveFolder={(id, parentId) => moveFolder.mutate({ id, parentId })}
        />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
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
            onUpload={() => setUploadOpen(true)}
            onCreateFolder={() => setCreateFolderOpen(true)}
            totalAssets={totalAssets}
            breadcrumbs={breadcrumbs}
            onBreadcrumbClick={(id) => handleSelectFolder(id)}
          />

          {/* Quick filters */}
          <div className="flex items-center gap-2 px-1 pb-3 pt-1">
            <button
              type="button"
              onClick={() => setPinnedOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                pinnedOnly
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Pin className="h-3 w-3" />
              المثبتة
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter((v) => (v === "ready" ? "all" : "ready"))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                statusFilter === "ready"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Star className="h-3 w-3" />
              الجاهزة
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter((v) => (v === "processing" ? "all" : "processing"))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                statusFilter === "processing"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {statusFilter === "processing" ? "إظهار الكل" : "قيد المعالجة"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-6">
            {isError ? (
              <MediaErrorState onRetry={() => refetch()} />
            ) : isLoading ? (
              <MediaLoadingState />
            ) : assets.length === 0 ? (
              <MediaEmptyState
                hasFilters={hasFilters}
                onUpload={() => setUploadOpen(true)}
                onCreateFolder={() => setCreateFolderOpen(true)}
              />
            ) : (
              <MediaGrid
                assets={assets}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onAssetClick={handleAssetClick}
                onFavorite={(asset) => toggleFavorite.mutate(asset.id)}
                onPin={(asset) => togglePin.mutate(asset.id)}
                onRename={setRenameTarget}
                onMove={setMoveTarget}
                onDuplicate={(asset) => duplicateAsset.mutate(asset.id)}
                onArchive={(asset) => archiveAsset.mutate(asset.id)}
                onDelete={setDeleteTarget}
              />
            )}
          </div>
        </div>

        {/* Right Preview Panel */}
        {previewAsset && (
          <div className="hidden w-80 shrink-0 xl:block">
            <MediaPreview
              asset={previewAsset}
              onClose={() => setPreviewAsset(null)}
              onFavorite={(a) => toggleFavorite.mutate(a.id)}
              onArchive={(a) => archiveAsset.mutate(a.id)}
              onDelete={(a) => setDeleteTarget(a)}
            />
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={handleClearSelection}
        onDelete={handleBulkDelete}
        onMove={handleBulkMove}
        onTag={() => {}}
        onFavorite={() => {
          selectedIds.forEach((id) => toggleFavorite.mutate(id));
          setSelectedIds(new Set());
        }}
        onArchive={() => {
          selectedIds.forEach((id) => archiveAsset.mutate(id));
          setSelectedIds(new Set());
        }}
        onDownload={() => {}}
      />

      {/* Dialogs */}
      <UploadDrawer
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        folderId={typeof selectedFolderId === "number" ? selectedFolderId : null}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onSave={handleCreateFolderSave}
        saving={createFolder.isPending}
      />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={() => setRenameTarget(null)}
        onSave={handleRenameSave}
        currentTitle={renameTarget?.title ?? renameTarget?.originalName}
        saving={renameAsset.isPending}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget && deleteTarget !== "bulk" ? (deleteTarget.title ?? deleteTarget.originalName ?? undefined) : undefined}
        itemCount={deleteTarget === "bulk" ? selectedIds.size : 1}
        loading={bulkDelete.isPending || deleteAsset.isPending}
      />

      <MoveDialog
        open={!!moveTarget}
        onOpenChange={() => setMoveTarget(null)}
        onMove={handleMoveConfirm}
        loading={bulkMove.isPending || moveAsset.isPending}
      />
    </AppPage>
  );
}

export default MediaPage;
