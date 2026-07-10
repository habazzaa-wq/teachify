"use client";

import { useState, useCallback, useRef } from "react";
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { AppButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MediaFolder } from "../types";

interface FolderTreeProps {
  folders: MediaFolder[];
  selectedId?: number | "root" | null;
  onSelect?: (folderId: number | "root" | null) => void;
  onCreateFolder?: () => void;
  onMoveFolder?: (id: number, parentId: number | null) => void;
}

interface FolderTreeItemProps {
  folder: MediaFolder;
  selectedId?: number | "root" | null;
  onSelect?: (folderId: number | "root" | null) => void;
  onMoveFolder?: (id: number, parentId: number | null) => void;
  depth?: number;
}

function FolderTreeItem({
  folder,
  selectedId,
  onSelect,
  onMoveFolder,
  depth = 0,
}: FolderTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const dragIdRef = useRef<number | null>(null);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedId === folder.id;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      dragIdRef.current = folder.id;
      e.dataTransfer.setData("text/folder-id", String(folder.id));
      e.dataTransfer.effectAllowed = "move";
    },
    [folder.id],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (dragIdRef.current === folder.id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsDropTarget(true);
    },
    [folder.id],
  );

  const handleDragLeave = useCallback(() => setIsDropTarget(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDropTarget(false);
      const id = Number(e.dataTransfer.getData("text/folder-id"));
      if (id && id !== folder.id) {
        onMoveFolder?.(id, folder.id);
      }
      dragIdRef.current = null;
    },
    [folder.id, onMoveFolder],
  );

  return (
    <div>
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent",
          isSelected && "bg-accent font-medium text-accent-foreground",
          isDropTarget && "ring-2 ring-primary ring-offset-1",
        )}
        style={{ paddingRight: 8 + depth * 16 }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          onSelect?.(folder.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        {isSelected ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{folder.name}</span>
      </button>
      {hasChildren && expanded && folder.children && (
        <div>
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onMoveFolder={onMoveFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderTree({
  folders,
  selectedId,
  onSelect,
  onCreateFolder,
  onMoveFolder,
}: FolderTreeProps) {
  const [isRootDrop, setIsRootDrop] = useState(false);

  return (
    <div
      className={cn("space-y-0.5", isRootDrop && "rounded-lg ring-2 ring-primary/40")}
      onDragOver={(e) => {
        e.preventDefault();
        setIsRootDrop(true);
      }}
      onDragLeave={() => setIsRootDrop(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsRootDrop(false);
        const id = Number(e.dataTransfer.getData("text/folder-id"));
        if (id) onMoveFolder?.(id, null);
      }}
    >
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent",
          selectedId === "root" && "bg-accent font-medium text-accent-foreground",
        )}
        onClick={() => onSelect?.("root")}
      >
        <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate">جميع الملفات</span>
      </button>
      {folders.map((folder) => (
        <FolderTreeItem
          key={folder.id}
          folder={folder}
          selectedId={selectedId}
          onSelect={onSelect}
          onMoveFolder={onMoveFolder}
        />
      ))}
      {onCreateFolder && (
        <AppButton
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start gap-2 px-2 text-xs text-muted-foreground"
          onClick={onCreateFolder}
        >
          <Plus className="h-3.5 w-3.5" />
          مجلد جديد
        </AppButton>
      )}
    </div>
  );
}

export { FolderTree };
