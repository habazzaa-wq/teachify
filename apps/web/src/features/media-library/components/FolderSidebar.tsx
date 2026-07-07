"use client";

import { useMemo } from "react";
import { useFolderTree } from "../hooks";
import { FolderTree } from "./FolderTree";
import { StorageWidget } from "./StorageWidget";
import { cn } from "@/lib/cn";

interface FolderSidebarProps {
  selectedFolderId?: number | "root" | null;
  onSelectFolder?: (folderId: number | "root" | null) => void;
  onCreateFolder?: () => void;
  collapsed?: boolean;
}

function FolderSidebar({
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  collapsed,
}: FolderSidebarProps) {
  const { data: folders = [], isLoading } = useFolderTree();

  if (collapsed) return null;

  return (
    <div className={cn("flex w-60 flex-col border-s bg-card")}>
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          المجلدات
        </h3>
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <FolderTree
            folders={folders}
            selectedId={selectedFolderId}
            onSelect={onSelectFolder}
            onCreateFolder={onCreateFolder}
          />
        )}
      </div>
      <div className="border-t p-3">
        <StorageWidget />
      </div>
    </div>
  );
}

export { FolderSidebar };
