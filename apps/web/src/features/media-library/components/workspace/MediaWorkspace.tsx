"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  GripVertical,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useMediaWorkspaceStore } from "../../store";
import { useMediaQuery } from "@/features/community/hooks/useMediaQuery";
import { useRenameAsset, useMoveAsset, useDeleteAsset, useBulkDelete, useBulkMove, useToggleFavorite, useTogglePin, useArchiveAsset, useDuplicateAsset } from "../../hooks";
import { FolderExplorer } from "./FolderExplorer";
import { AssetWorkspace } from "./AssetWorkspace";
import { MediaInspector } from "./MediaInspector";
import { RenameDialog } from "../RenameDialog";
import { DeleteDialog } from "../DeleteDialog";
import { MoveDialog } from "../MoveDialog";
import { UploadDrawer } from "../UploadDrawer";
import type { MediaAsset } from "../../types";

interface MediaWorkspaceProps {
  className?: string;
}

function ResizablePanel({
  width,
  onWidthChange,
  minWidth = 200,
  maxWidth = 400,
  side,
  children,
}: {
  width: number;
  onWidthChange: (w: number) => void;
  minWidth?: number;
  maxWidth?: number;
  side: "left" | "right";
  children: React.ReactNode;
}) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    return () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    e.preventDefault();

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = side === "left" ? e.clientX - startX.current : startX.current - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width, onWidthChange, minWidth, maxWidth, side]);

  return (
    <div
      style={{ width: `${width}px` }}
      className="relative shrink-0"
    >
      <div className="h-full overflow-hidden">{children}</div>
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 z-20 hidden w-1 cursor-col-resize items-center justify-center lg:flex",
          "bg-border/50 opacity-0 transition-opacity hover:bg-accent hover:opacity-100",
          side === "left" ? "end-0" : "start-0",
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>
    </div>
  );
}

function MediaWorkspaceBase({ className }: MediaWorkspaceProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const {
    leftPanelOpen,
    leftPanelWidth,
    setLeftPanelWidth,
    setLeftPanelOpen,
    rightPanelOpen,
    rightPanelWidth,
    setRightPanelWidth,
    setRightPanelOpen,
    inspectorAssetId,
    setInspectorAssetId,
    selectedIds,
    clearSelection,
  } = useMediaWorkspaceStore();

  // On mobile the side panels become slide-over drawers. The folders drawer
  // uses its own state so it never covers the content by default.
  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [, setCreateFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | "bulk" | null>(null);
  const [moveTarget, setMoveTarget] = useState<MediaAsset | "bulk" | null>(null);

  const renameAsset = useRenameAsset();
  const moveAsset = useMoveAsset();
  const deleteAsset = useDeleteAsset();
  const bulkDelete = useBulkDelete();
  const bulkMove = useBulkMove();
  const toggleFavorite = useToggleFavorite();
  const togglePin = useTogglePin();
  const archiveAsset = useArchiveAsset();
  const duplicateAsset = useDuplicateAsset();

  const selectedFolderId = useMediaWorkspaceStore((s) => s.selectedFolderId);

  const handleRenameSave = useCallback((title: string) => {
    if (!renameTarget) return;
    renameAsset.mutate({ id: renameTarget.id, title }, { onSuccess: () => setRenameTarget(null) });
  }, [renameTarget, renameAsset]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget === "bulk") {
      bulkDelete.mutate([...selectedIds], {
        onSuccess: () => { setDeleteTarget(null); clearSelection(); },
        onError: () => { setDeleteTarget(null); },
      });
    } else if (deleteTarget) {
      deleteAsset.mutate(deleteTarget.id, {
        onSuccess: () => { setDeleteTarget(null); setInspectorAssetId(null); },
        onError: () => { setDeleteTarget(null); },
      });
    }
  }, [deleteTarget, bulkDelete, deleteAsset, selectedIds, clearSelection, setInspectorAssetId]);

  const handleMoveConfirm = useCallback((folderId: number | null) => {
    if (moveTarget === "bulk") {
      bulkMove.mutate({ ids: [...selectedIds], folderId }, {
        onSuccess: () => { setMoveTarget(null); clearSelection(); },
      });
    } else if (moveTarget) {
      moveAsset.mutate({ id: moveTarget.id, folderId }, { onSuccess: () => setMoveTarget(null) });
    }
  }, [moveTarget, bulkMove, moveAsset, selectedIds, clearSelection]);

  const handleFolderId = typeof selectedFolderId === "number" ? selectedFolderId : null;

  const toggleFolders = useCallback(() => {
    if (isDesktop) setLeftPanelOpen(!leftPanelOpen);
    else setMobileFoldersOpen((v) => !v);
  }, [isDesktop, leftPanelOpen, setLeftPanelOpen]);

  const toggleRight = useCallback(() => setRightPanelOpen(!rightPanelOpen), [setRightPanelOpen, rightPanelOpen]);

  return (
    <div className={cn("flex h-full overflow-hidden rounded-xl border bg-background", className)}>
      {/* Desktop left panel */}
      {isDesktop && leftPanelOpen && (
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: leftPanelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="shrink-0 overflow-hidden border-e"
          >
            <ResizablePanel
              width={leftPanelWidth}
              onWidthChange={setLeftPanelWidth}
              minWidth={200}
              maxWidth={400}
              side="left"
            >
              <FolderExplorer />
            </ResizablePanel>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Center panel */}
      <div className="relative flex-1 overflow-hidden">
        {/* Desktop panel toggle buttons */}
        <div className="absolute start-2 top-2 z-20 hidden flex-col gap-1 lg:flex">
          <button
            onClick={toggleFolders}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors",
              "bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-foreground",
            )}
            title={leftPanelOpen ? "إخفاء اللوحة اليسرى" : "إظهار اللوحة اليسرى"}
          >
            {leftPanelOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="absolute end-2 top-2 z-20 hidden flex-col gap-1 lg:flex">
          <button
            onClick={toggleRight}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors",
              "bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-foreground",
            )}
            title={rightPanelOpen ? "إخفاء لوحة التفاصيل" : "إظهار لوحة التفاصيل"}
          >
            {rightPanelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </button>
        </div>

        <AssetWorkspace
          onUpload={() => setUploadOpen(true)}
          onCreateFolder={() => setCreateFolderOpen(true)}
          onRenameAsset={setRenameTarget}
          onMoveAsset={setMoveTarget}
          onDeleteAsset={setDeleteTarget}
          onDownloadAsset={(asset) => { if (asset.cdnUrl) window.open(asset.cdnUrl, "_blank"); }}
          onBulkDelete={() => setDeleteTarget("bulk")}
          onBulkMove={() => setMoveTarget("bulk")}
          onOpenFolders={toggleFolders}
        />
      </div>

      {/* Desktop right panel */}
      {isDesktop && rightPanelOpen && (
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: rightPanelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="shrink-0 overflow-hidden border-s"
          >
            <ResizablePanel
              width={rightPanelWidth}
              onWidthChange={setRightPanelWidth}
              minWidth={280}
              maxWidth={500}
              side="right"
            >
              <MediaInspector
                assetId={inspectorAssetId}
                onClose={() => setInspectorAssetId(null)}
                onRename={setRenameTarget}
                onMove={setMoveTarget}
                onDelete={setDeleteTarget}
                onArchive={(asset) => archiveAsset.mutate(asset.id)}
                onDuplicate={(asset) => duplicateAsset.mutate(asset.id)}
                onDownload={(asset) => { if (asset.cdnUrl) window.open(asset.cdnUrl, "_blank"); }}
                onFavorite={(asset) => toggleFavorite.mutate(asset.id)}
                onPin={(asset) => togglePin.mutate(asset.id)}
              />
            </ResizablePanel>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Mobile/tablet folders drawer */}
      <AnimatePresence>
        {!isDesktop && mobileFoldersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileFoldersOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 end-0 z-50 flex w-[85%] max-w-[340px] flex-col bg-background shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="المجلدات"
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">المكتبة</span>
                <button
                  onClick={() => setMobileFoldersOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <FolderExplorer />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile/tablet inspector drawer */}
      <AnimatePresence>
        {!isDesktop && rightPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setRightPanelOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 start-0 z-50 flex w-[88%] max-w-[400px] flex-col bg-background shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="تفاصيل الملف"
            >
              <MediaInspector
                assetId={inspectorAssetId}
                onClose={() => setRightPanelOpen(false)}
                onRename={setRenameTarget}
                onMove={setMoveTarget}
                onDelete={setDeleteTarget}
                onArchive={(asset) => archiveAsset.mutate(asset.id)}
                onDuplicate={(asset) => duplicateAsset.mutate(asset.id)}
                onDownload={(asset) => { if (asset.cdnUrl) window.open(asset.cdnUrl, "_blank"); }}
                onFavorite={(asset) => toggleFavorite.mutate(asset.id)}
                onPin={(asset) => togglePin.mutate(asset.id)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <UploadDrawer
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        folderId={handleFolderId}
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
    </div>
  );
}

export const MediaWorkspace = memo(MediaWorkspaceBase);
