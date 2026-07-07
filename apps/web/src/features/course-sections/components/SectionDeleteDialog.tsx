"use client";

import { AlertTriangle } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppDialogFooter,
  AppButton,
} from "@/components/ui";
import type { CourseSection } from "../types";

interface SectionDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: CourseSection | null;
  onConfirm?: () => void;
  deleting?: boolean;
}

function SectionDeleteDialog({
  open,
  onOpenChange,
  section,
  onConfirm,
  deleting,
}: SectionDeleteDialogProps) {
  if (!section) return null;

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-md">
        <AppDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AppDialogTitle className="text-center">
            حذف القسم
          </AppDialogTitle>
          <AppDialogDescription className="text-center">
            هل أنت متأكد من حذف القسم <span className="font-semibold text-foreground">{section.title}</span>؟
            <br />
            هذا الإجراء لا يمكن التراجع عنه.
          </AppDialogDescription>
        </AppDialogHeader>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            سيؤدي حذف هذا القسم إلى إزالة جميع الدروس المرتبطة به.
          </p>
        </div>
        <AppDialogFooter className="gap-2">
          <AppButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="flex-1"
          >
            إلغاء
          </AppButton>
          <AppButton
            variant="destructive"
            loading={deleting}
            onClick={onConfirm}
            className="flex-1"
          >
            نعم، حذف القسم
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export { SectionDeleteDialog };
