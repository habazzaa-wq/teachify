"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Archive, Trash2, RotateCcw, FolderInput, X } from "lucide-react";
import {
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  PermissionGuard,
} from "@/components/ui";
import { StudioButton } from "@/components/studio";
import { useCategoryTree } from "@/features/exam-bank/hooks";
import { cn } from "@/lib/cn";
import { studioAnimationVariants } from "@/components/studio";

interface QuestionBulkBarProps {
  count: number;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onMoveCategory: (categoryId: string) => void;
  onClear: () => void;
}

export function QuestionBulkBar({
  count,
  onDuplicate,
  onArchive,
  onDelete,
  onRestore,
  onMoveCategory,
  onClear,
}: QuestionBulkBarProps) {
  const [showMove, setShowMove] = useState(false);
  const { data: categories = [] } = useCategoryTree();

  return (
    <motion.div
      {...studioAnimationVariants.slideUp}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-studio-border bg-studio-surface px-4 py-3 shadow-floating backdrop-blur"
      role="region"
      aria-label="إجراءات مجمعة للأسئلة"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-studio-accent-soft px-3 py-1.5 text-sm font-medium text-studio-accent">
          تم تحديد {count} {count === 1 ? "سؤال" : "سؤال"}
        </span>

        {!showMove && (
          <div className="flex flex-wrap items-center gap-2">
            <PermissionGuard permission="questions.create">
              <StudioButton variant="secondary" size="sm" onClick={onDuplicate}>
                <Copy className="h-3.5 w-3.5" />
                نسخ
              </StudioButton>
            </PermissionGuard>
            <PermissionGuard permission="questions.archive">
              <StudioButton variant="secondary" size="sm" onClick={onArchive}>
                <Archive className="h-3.5 w-3.5" />
                أرشفة
              </StudioButton>
            </PermissionGuard>
            <PermissionGuard permission="questions.restore">
              <StudioButton variant="secondary" size="sm" onClick={onRestore}>
                <RotateCcw className="h-3.5 w-3.5" />
                استرجاع
              </StudioButton>
            </PermissionGuard>
            <PermissionGuard permission="questions.update">
              <StudioButton variant="secondary" size="sm" onClick={() => setShowMove(true)}>
                <FolderInput className="h-3.5 w-3.5" />
                نقل
              </StudioButton>
            </PermissionGuard>
            <PermissionGuard permission="questions.delete">
              <StudioButton variant="danger" size="sm" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                حذف
              </StudioButton>
            </PermissionGuard>
          </div>
        )}

        {showMove && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-studio-fg-muted">نقل إلى:</span>
            <AppSelect
              value=""
              onValueChange={(v) => {
                if (v) onMoveCategory(v);
                setShowMove(false);
              }}
            >
              <AppSelectTrigger className="w-[200px]">
                <AppSelectValue placeholder="اختر التصنيف" />
              </AppSelectTrigger>
              <AppSelectContent>
                {categories.map((cat) => (
                  <AppSelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </AppSelectItem>
                ))}
              </AppSelectContent>
            </AppSelect>
            <StudioButton variant="ghost" size="sm" onClick={() => setShowMove(false)}>
              إلغاء
            </StudioButton>
          </div>
        )}

        <StudioButton
          variant="ghost"
          size="sm"
          onClick={onClear}
          className={cn("ms-auto")}
        >
          <X className="h-3.5 w-3.5" />
          إلغاء التحديد
        </StudioButton>
      </div>
    </motion.div>
  );
}
