"use client";

import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppDialogFooter,
  AppDialogClose,
  AppButton,
} from "@/components/ui";
import { AlertTriangle } from "lucide-react";

interface ModuleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  moduleTitle?: string;
  deleting?: boolean;
}

export function ModuleDeleteDialog({ open, onOpenChange, onConfirm, moduleTitle, deleting }: ModuleDeleteDialogProps) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AppDialogTitle>حذف الوحدة</AppDialogTitle>
              <AppDialogDescription>
                هل أنت متأكد من حذف الوحدة "{moduleTitle}"؟ سيتم حذف جميع الأقسام والدروس المرتبطة بها.
              </AppDialogDescription>
            </div>
          </div>
        </AppDialogHeader>
        <AppDialogFooter>
          <AppDialogClose asChild>
            <AppButton variant="outline">إلغاء</AppButton>
          </AppDialogClose>
          <AppButton onClick={onConfirm} loading={deleting} className="bg-destructive hover:bg-destructive/90">
            حذف
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}
