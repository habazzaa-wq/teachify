"use client";

import { motion } from "framer-motion";
import { Copy, Archive, Trash2, Send, X } from "lucide-react";
import { StudioButton } from "@/components/studio";
import { studioAnimationVariants } from "@/components/studio";
import { PermissionGuard } from "@/components/ui";
import { cn } from "@/lib/cn";

interface ExamBulkBarProps {
  count: number;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onClear: () => void;
}

export function ExamBulkBar({
  count,
  onDuplicate,
  onArchive,
  onDelete,
  onPublish,
  onClear,
}: ExamBulkBarProps) {
  return (
    <motion.div
      {...studioAnimationVariants.slideUp}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4"
      role="region"
      aria-label="إجراءات مجمعة"
    >
      <div
        className={cn(
          "flex w-full max-w-3xl flex-wrap items-center gap-2 rounded-xl border border-studio-border",
          "bg-studio-surface px-4 py-3 shadow-lg shadow-studio-border/20",
        )}
      >
        <span className="text-sm font-medium text-studio-fg">
          تم تحديد {count} {count === 1 ? "اختبار" : "اختبار"}
        </span>

        <span className="mx-1 hidden h-5 w-px bg-studio-border sm:block" />

        <div className="flex flex-wrap items-center gap-2">
          <PermissionGuard permission="exams.publish">
            <StudioButton variant="soft" size="sm" onClick={onPublish} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              نشر
            </StudioButton>
          </PermissionGuard>
          <PermissionGuard permission="exams.create">
            <StudioButton variant="soft" size="sm" onClick={onDuplicate} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              نسخ
            </StudioButton>
          </PermissionGuard>
          <PermissionGuard permission="exams.archive">
            <StudioButton variant="soft" size="sm" onClick={onArchive} className="gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              أرشفة
            </StudioButton>
          </PermissionGuard>
          <PermissionGuard permission="exams.delete">
            <StudioButton variant="danger" size="sm" onClick={onDelete} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              حذف
            </StudioButton>
          </PermissionGuard>
        </div>

        <StudioButton
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="ms-auto gap-1.5"
          aria-label="إلغاء التحديد"
        >
          <X className="h-3.5 w-3.5" />
          إلغاء
        </StudioButton>
      </div>
    </motion.div>
  );
}

export default ExamBulkBar;
