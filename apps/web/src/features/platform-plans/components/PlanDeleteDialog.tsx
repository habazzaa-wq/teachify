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

interface PlanDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  onConfirm: () => void;
  loading?: boolean;
  bulk?: boolean;
  bulkCount?: number;
}

function PlanDeleteDialog({
  open,
  onOpenChange,
  planName,
  onConfirm,
  loading,
  bulk,
  bulkCount,
}: PlanDeleteDialogProps) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-md">
        <AppDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AppDialogTitle className="text-center">{bulk ? "حذف الباقات المحددة" : "حذف الباقة"}</AppDialogTitle>
          <AppDialogDescription className="text-center">
            {bulk ? (
              <>هل أنت متأكد من حذف <span className="font-semibold text-foreground">{bulkCount}</span> باقة؟</>
            ) : (
              <>هل أنت متأكد من حذف الباقة <span className="font-semibold text-foreground">{planName}</span>؟</>
            )}
            <br />
            هذا الإجراء لا يمكن التراجع عنه.
          </AppDialogDescription>
        </AppDialogHeader>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {bulk
              ? "سيؤدي حذف هذه الباقات إلى إزالتها نهائياً من النظام. لن يتمكن المستخدمون المرتبطون بهذه الباقات من الوصول إلى مميزاتها."
              : "سيؤدي حذف هذه الباقة إلى إزالتها نهائياً من النظام. لن يتمكن المستخدمون المرتبطون بهذه الباقة من الوصول إلى مميزاتها."}
          </p>
        </div>
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
            {bulk ? `نعم، حذف (${bulkCount})` : "نعم، حذف الباقة"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export { PlanDeleteDialog };
