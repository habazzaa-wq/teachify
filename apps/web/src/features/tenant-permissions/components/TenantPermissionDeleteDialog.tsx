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

interface TenantPermissionDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionKey: string;
  onConfirm: () => void;
  loading?: boolean;
  bulk?: boolean;
  bulkCount?: number;
}

function TenantPermissionDeleteDialog({
  open,
  onOpenChange,
  permissionKey,
  onConfirm,
  loading,
  bulk,
  bulkCount,
}: TenantPermissionDeleteDialogProps) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-md">
        <AppDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AppDialogTitle className="text-center">
            {bulk ? "حذف الصلاحيات المحددة" : "حذف الصلاحية"}
          </AppDialogTitle>
          <AppDialogDescription className="text-center">
            {bulk ? (
              <>هل أنت متأكد من حذف <span className="font-semibold text-foreground">{bulkCount}</span> صلاحية؟</>
            ) : (
              <>هل أنت متأكد من حذف الصلاحية <span className="font-semibold text-foreground">{permissionKey}</span>؟</>
            )}
            <br />
            هذا الإجراء لا يمكن التراجع عنه.
          </AppDialogDescription>
        </AppDialogHeader>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {bulk
              ? "سيؤدي حذف هذه الصلاحيات إلى إزالتها نهائياً من النظام. قد تتأثر الأدوار المرتبطة بهذه الصلاحيات."
              : "سيؤدي حذف هذه الصلاحية إلى إزالتها نهائياً من النظام. قد تتأثر الأدوار المرتبطة بهذه الصلاحية."}
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
            {bulk ? `نعم، حذف (${bulkCount})` : "نعم، حذف الصلاحية"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export { TenantPermissionDeleteDialog };
