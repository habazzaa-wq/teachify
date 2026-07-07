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
import type { Lesson } from "../types";

interface LessonDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  onConfirm?: () => void;
  deleting?: boolean;
}

function LessonDeleteDialog({
  open,
  onOpenChange,
  lesson,
  onConfirm,
  deleting,
}: LessonDeleteDialogProps) {
  if (!lesson) return null;

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-md">
        <AppDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AppDialogTitle className="text-center">
            حذف الدرس
          </AppDialogTitle>
          <AppDialogDescription className="text-center">
            هل أنت متأكد من حذف الدرس <span className="font-semibold text-foreground">{lesson.title}</span>؟
            <br />
            هذا الإجراء لا يمكن التراجع عنه.
          </AppDialogDescription>
        </AppDialogHeader>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            سيؤدي حذف هذا الدرس إلى إزالة جميع المحتويات المرتبطة به.
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
            نعم، حذف الدرس
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export { LessonDeleteDialog };
