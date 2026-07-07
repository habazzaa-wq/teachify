"use client";

import { useState } from "react";
import { FolderOpen, ChevronLeft } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppButton,
} from "@/components/ui";
import { useFolderTree } from "../hooks";
import type { MediaFolder } from "../types";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (folderId: number | null) => void;
  loading?: boolean;
}

function MoveDialog({ open, onOpenChange, onMove, loading }: MoveDialogProps) {
  const { data: folders = [] } = useFolderTree();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const renderFolders = (items: MediaFolder[], depth = 0) => {
    return items.map((folder) => (
      <div key={folder.id}>
        <button
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent ${
            selectedId === folder.id ? "bg-accent font-medium" : ""
          }`}
          style={{ paddingRight: 12 + depth * 20 }}
          onClick={() => setSelectedId(folder.id)}
        >
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{folder.name}</span>
          {folder.children && folder.children.length > 0 && (
            <ChevronLeft className="me-auto h-3 w-3 text-muted-foreground" />
          )}
        </button>
        {folder.children && folder.children.length > 0 && (
          <div>{renderFolders(folder.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <AppDialogTitle>نقل إلى مجلد</AppDialogTitle>
        </AppDialogHeader>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent ${
              selectedId === null ? "bg-accent font-medium" : ""
            }`}
            onClick={() => setSelectedId(null)}
          >
            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>الملفات الرئيسية</span>
          </button>
          {renderFolders(folders)}
        </div>

        <div className="flex justify-end gap-3">
          <AppButton variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </AppButton>
          <AppButton onClick={() => onMove(selectedId)} loading={loading}>
            نقل
          </AppButton>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}

export { MoveDialog };
