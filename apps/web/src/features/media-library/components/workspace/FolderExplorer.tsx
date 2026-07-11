"use client";

import { useState, useCallback, useMemo, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronDown,
  Folder,
  FolderOpen,
  Clock,
  Heart,
  Pin,
  Image,
  Video,
  Music,
  FileText,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useMediaWorkspaceStore } from "../../store";
import { useFolderTree, useMediaMetrics, useCreateFolder, useDeleteFolder, useRenameFolder, useMoveFolder } from "../../hooks";
import { SMART_FOLDERS } from "../../constants";
import { StorageWidget } from "../StorageWidget";
import { CreateFolderDialog } from "../CreateFolderDialog";
import { RenameDialog } from "../RenameDialog";
import { DeleteDialog } from "../DeleteDialog";
import type { MediaFolder } from "../../types";
import type { SmartFolderType } from "../../types";

const smartFolderIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Heart,
  Pin,
  Image,
  Video,
  Music,
  FileText,
  Archive,
};

interface FolderExplorerProps {
  className?: string;
}

function formatCount(n: number | undefined): string {
  if (n === undefined || n === null) return "";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function FolderTreeItem({
  folder,
  selectedId,
  onSelect,
  onRename,
  onDelete,
  onMove,
  depth = 0,
}: {
  folder: MediaFolder;
  selectedId: number | "root" | null;
  onSelect: (id: number | "root" | null) => void;
  onRename: (folder: MediaFolder) => void;
  onDelete: (folder: MediaFolder) => void;
  onMove: (id: number, parentId: number | null) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const dragIdRef = useRef<number | null>(null);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedId === folder.id;

  const handleDragStart = useCallback((e: React.DragEvent) => {
    dragIdRef.current = folder.id;
    e.dataTransfer.setData("text/folder-id", String(folder.id));
    e.dataTransfer.effectAllowed = "move";
  }, [folder.id]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (dragIdRef.current === folder.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDropTarget(true);
  }, [folder.id]);

  const handleDragLeave = useCallback(() => setIsDropTarget(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    const id = Number(e.dataTransfer.getData("text/folder-id"));
    if (id && id !== folder.id) onMove(id, folder.id);
    dragIdRef.current = null;
  }, [folder.id, onMove]);

  return (
    <div>
      <button
        className={cn(
          "group flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
          "hover:bg-accent/60",
          isSelected && "bg-accent font-medium text-accent-foreground",
          isDropTarget && "ring-1 ring-accent",
        )}
        style={{ paddingInlineStart: `${8 + depth * 16}px` }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          onSelect(folder.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {hasChildren ? (
          <motion.div
            animate={{ rotate: expanded ? 0 : -90 }}
            transition={{ duration: 0.15 }}
            className="shrink-0"
          >
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </motion.div>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {isSelected ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-accent" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate">{folder.name}</span>
        {(folder.assetCount !== undefined && folder.assetCount > 0) && (
          <span className="shrink-0 text-[10px] text-muted-foreground/60">
            {formatCount(folder.assetCount)}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {hasChildren && expanded && folder.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {folder.children.map((child) => (
              <FolderTreeItem
                key={child.id}
                folder={child}
                selectedId={selectedId}
                onSelect={onSelect}
                onRename={onRename}
                onDelete={onDelete}
                onMove={onMove}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FolderExplorer({ className }: FolderExplorerProps) {
  const {
    selectedFolderId,
    setSelectedFolderId,
    setSearch,
    setTypeFilter,
    setFavoritesFilter,
    setPinnedFilter,
  } = useMediaWorkspaceStore();

  const { data: folders = [], isLoading: foldersLoading } = useFolderTree();
  const { data: metrics } = useMediaMetrics();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const renameFolder = useRenameFolder();
  const moveFolder = useMoveFolder();

  const [folderSearch, setFolderSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<MediaFolder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaFolder | null>(null);

  const filteredFolders = useMemo(() => {
    if (!folderSearch) return folders;
    const q = folderSearch.toLowerCase();
    function filterTree(items: MediaFolder[]): MediaFolder[] {
      return items.filter((f) => {
        const nameMatch = f.name.toLowerCase().includes(q);
        const childMatch = f.children ? filterTree(f.children).length > 0 : false;
        return nameMatch || childMatch;
      }).map((f) => ({
        ...f,
        children: f.children ? filterTree(f.children) : undefined,
      }));
    }
    return filterTree(folders);
  }, [folders, folderSearch]);

  const handleSmartFolder = useCallback((id: SmartFolderType) => {
    setSelectedFolderId(id as unknown as number | "root" | null);
    switch (id) {
      case "recent":
        break;
      case "favorites":
        setSearch("");
        setTypeFilter("all");
        setPinnedFilter(false);
        setFavoritesFilter(true);
        break;
      case "pinned":
        setSearch("");
        setTypeFilter("all");
        setFavoritesFilter(false);
        setPinnedFilter(true);
        break;
      case "images":
        setSearch("");
        setFavoritesFilter(false);
        setPinnedFilter(false);
        setTypeFilter("image");
        break;
      case "videos":
        setSearch("");
        setFavoritesFilter(false);
        setPinnedFilter(false);
        setTypeFilter("video");
        break;
      case "audio":
        setSearch("");
        setFavoritesFilter(false);
        setPinnedFilter(false);
        setTypeFilter("audio");
        break;
      case "documents":
        setSearch("");
        setFavoritesFilter(false);
        setPinnedFilter(false);
        setTypeFilter("document");
        break;
      case "archives":
        setSearch("");
        setFavoritesFilter(false);
        setPinnedFilter(false);
        setTypeFilter("zip");
        break;
    }
  }, [setSelectedFolderId, setSearch, setTypeFilter, setFavoritesFilter, setPinnedFilter]);

  const isSmartFolder = typeof selectedFolderId === "string";

  return (
    <>
      <div className={cn("flex h-full flex-col", className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            المكتبة
          </h2>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="مجلد جديد"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Folder search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
              placeholder="بحث في المجلدات..."
              className="w-full rounded-lg border bg-muted/30 py-1.5 pe-7 ps-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Smart Folders */}
        <div className="px-2 pb-1">
          {SMART_FOLDERS.map((sf) => {
            const Icon = smartFolderIcons[sf.icon] ?? Folder;
            const isActive = selectedFolderId === sf.id;
            const count =
              sf.id === "favorites" ? metrics?.favorites :
              sf.id === "recent" ? metrics?.recentUploads :
              sf.id === "images" ? metrics?.images :
              sf.id === "videos" ? metrics?.videos :
              sf.id === "audio" ? metrics?.audio :
              sf.id === "documents" ? metrics?.documents :
              sf.id === "archives" ? undefined :
              undefined;

            return (
              <button
                key={sf.id}
                onClick={() => handleSmartFolder(sf.id as SmartFolderType)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  "hover:bg-accent/60",
                  isActive && "bg-accent font-medium text-accent-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-accent" : "text-muted-foreground")} />
                <span className="flex-1 truncate">{sf.label}</span>
                {count !== undefined && count > 0 && (
                  <span className="text-[10px] text-muted-foreground/60">{formatCount(count)}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-3 my-1 h-px bg-border" />

        {/* Folder Tree */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              المجلدات
            </span>
          </div>

          {foldersLoading ? (
            <div className="space-y-1 px-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-7 animate-pulse rounded-lg bg-muted/50" />
              ))}
            </div>
          ) : (
            <>
              {/* Root */}
              <button
                onClick={() => setSelectedFolderId("root")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  "hover:bg-accent/60",
                  selectedFolderId === "root" && !isSmartFolder && "bg-accent font-medium text-accent-foreground",
                )}
              >
                <FolderOpen className="h-4 w-4 text-accent" />
                <span className="flex-1 truncate">جميع الملفات</span>
                {metrics && (
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatCount(metrics.totalAssets)}
                  </span>
                )}
              </button>

              {filteredFolders.map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  selectedId={selectedFolderId}
                  onSelect={setSelectedFolderId}
                  onRename={setRenameTarget}
                  onDelete={setDeleteTarget}
                  onMove={(id, parentId) => moveFolder.mutate({ id, parentId })}
                />
              ))}
            </>
          )}
        </div>

        {/* Storage widget */}
        <div className="border-t p-3">
          <StorageWidget />
        </div>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={(name) => {
          const parentId = typeof selectedFolderId === "number" ? selectedFolderId : null;
          createFolder.mutate({ name, parentId }, { onSuccess: () => setCreateOpen(false) });
        }}
        saving={createFolder.isPending}
      />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={() => setRenameTarget(null)}
        onSave={(name) => {
          if (!renameTarget) return;
          renameFolder.mutate({ id: renameTarget.id, name }, { onSuccess: () => setRenameTarget(null) });
        }}
        currentTitle={renameTarget?.name}
        saving={renameFolder.isPending}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteFolder.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        title={deleteTarget?.name}
        loading={deleteFolder.isPending}
      />
    </>
  );
}

const FolderExplorerPanel = memo(FolderExplorer);
export { FolderExplorerPanel as FolderExplorer };
