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

interface CategoryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  onConfirm: () => void;
  loading?: boolean;
  type?: "soft" | "force";
}

function CategoryDeleteDialog({
  open,
  onOpenChange,
  categoryName,
  onConfirm,
  loading,
  type = "soft",
}: CategoryDeleteDialogProps) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-md">
        <AppDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AppDialogTitle className="text-center">
            {type === "soft" ? "حذف التصنيف" : "حذف التصنيف نهائياً"}
          </AppDialogTitle>
          <AppDialogDescription className="text-center">
            هل أنت متأكد من {type === "soft" ? "حذف" : "الحذف النهائي لـ"} التصنيف{" "}
            <span className="font-semibold text-foreground">{categoryName}</span>؟
            <br />
            {type === "soft" ? "يمكنك استعادة التصنيف لاحقاً." : "هذا الإجراء لا يمكن التراجع عنه."}
          </AppDialogDescription>
        </AppDialogHeader>
        {type === "force" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">
              سيؤدي الحذف النهائي إلى إزالة التصنيف وجميع بياناته بشكل دائم من النظام.
            </p>
          </div>
        )}
        <AppDialogFooter className="gap-2">
          <AppButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            إلغاء
          </AppButton>
          <AppButton
            variant="destructive"
            loading={loading}
            onClick={onConfirm}
            className="flex-1"
          >
            {type === "soft" ? "نعم، حذف التصنيف" : "نعم، حذف نهائي"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export { CategoryDeleteDialog };