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

interface TenantUserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => void;
  loading?: boolean;
  bulk?: boolean;
  bulkCount?: number;
}

function TenantUserDeleteDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
  loading,
  bulk,
  bulkCount,
}: TenantUserDeleteDialogProps) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-md">
        <AppDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AppDialogTitle className="text-center">
            {bulk ? "حذف المستخدمين المحددين" : "حذف المستخدم"}
          </AppDialogTitle>
          <AppDialogDescription className="text-center">
            {bulk ? (
              <>هل أنت متأكد من حذف <span className="font-semibold text-foreground">{bulkCount}</span> مستخدم؟</>
            ) : (
              <>هل أنت متأكد من حذف المستخدم <span className="font-semibold text-foreground">{userName}</span>؟</>
            )}
            <br />
            هذا الإجراء لا يمكن التراجع عنه.
          </AppDialogDescription>
        </AppDialogHeader>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {bulk
              ? "سيؤدي حذف هؤلاء المستخدمين إلى إزالتهم نهائياً من النظام. لن يتمكنوا من الوصول إلى المنصة بعد الحذف."
              : "سيؤدي حذف هذا المستخدم إلى إزالته نهائياً من النظام. لن يتمكن من الوصول إلى المنصة بعد الحذف."}
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
            {bulk ? `نعم، حذف (${bulkCount})` : "نعم، حذف المستخدم"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export { TenantUserDeleteDialog };
