"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useMediaWorkspaceStore } from "../../store";
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
          "absolute top-0 z-20 flex h-full w-1 cursor-col-resize items-center justify-center",
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

  return (
    <div className={cn("flex h-full overflow-hidden rounded-xl border bg-background", className)}>
      {/* Left Panel */}
      <AnimatePresence initial={false}>
        {leftPanelOpen && (
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
        )}
      </AnimatePresence>

      {/* Center Panel */}
      <div className="relative flex-1 overflow-hidden">
        {/* Panel toggle buttons */}
        <div className="absolute start-2 top-2 z-20 flex flex-col gap-1">
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors",
              "bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-foreground",
            )}
            title={leftPanelOpen ? "إخفاء اللوحة اليسرى" : "إظهار اللوحة اليسرى"}
          >
            {leftPanelOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="absolute end-2 top-2 z-20 flex flex-col gap-1">
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
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
        />
      </div>

      {/* Right Panel */}
      <AnimatePresence initial={false}>
        {rightPanelOpen && (
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
