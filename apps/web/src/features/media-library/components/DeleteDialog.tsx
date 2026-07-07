"use client";

import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppButton,
} from "@/components/ui";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  itemCount?: number;
  loading?: boolean;
}

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  itemCount = 1,
  loading,
}: DeleteDialogProps) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <AppDialogTitle>تأكيد الحذف</AppDialogTitle>
          <AppDialogDescription>
            {itemCount > 1
              ? `هل أنت متأكد من حذف ${itemCount} عنصر؟ لا يمكن التراجع عن هذا الإجراء.`
              : `هل أنت متأكد من حذف "${title ?? "هذا العنصر"}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          </AppDialogDescription>
        </AppDialogHeader>
        <div className="flex justify-end gap-3">
          <AppButton variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </AppButton>
          <AppButton variant="destructive" onClick={onConfirm} loading={loading}>
            حذف
          </AppButton>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}

export { DeleteDialog };
