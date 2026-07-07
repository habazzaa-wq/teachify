"use client";

import { useState } from "react";
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
}

interface FolderTreeItemProps {
  folder: MediaFolder;
  selectedId?: number | "root" | null;
  onSelect?: (folderId: number | "root" | null) => void;
  depth?: number;
}

function FolderTreeItem({
  folder,
  selectedId,
  onSelect,
  depth = 0,
}: FolderTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent",
          isSelected && "bg-accent font-medium text-accent-foreground",
        )}
        style={{ paddingRight: 8 + depth * 16 }}
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
}: FolderTreeProps) {
  return (
    <div className="space-y-0.5">
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
