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

interface DomainDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
  onConfirm: () => void;
  loading?: boolean;
  bulk?: boolean;
  bulkCount?: number;
}

function DomainDeleteDialog({
  open,
  onOpenChange,
  domainName,
  onConfirm,
  loading,
  bulk,
  bulkCount,
}: DomainDeleteDialogProps) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-md">
        <AppDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AppDialogTitle className="text-center">{bulk ? "حذف النطاقات المحددة" : "حذف النطاق"}</AppDialogTitle>
          <AppDialogDescription className="text-center">
            {bulk ? (
              <>هل أنت متأكد من حذف <span className="font-semibold text-foreground">{bulkCount}</span> نطاق؟</>
            ) : (
              <>هل أنت متأكد من حذف النطاق <span className="font-semibold text-foreground">{domainName}</span>؟</>
            )}
            <br />
            هذا الإجراء لا يمكن التراجع عنه.
          </AppDialogDescription>
        </AppDialogHeader>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {bulk
              ? "سيؤدي حذف هذه النطاقات إلى إزالتها نهائياً من النظام. لن تعمل الخدمات المرتبطة بهذه النطاقات بعد الحذف."
              : "سيؤدي حذف هذا النطاق إلى إزالته نهائياً من النظام. لن تعمل الخدمات المرتبطة بهذا النطاق بعد الحذف."}
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
            {bulk ? `نعم، حذف (${bulkCount})` : "نعم، حذف النطاق"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export { DomainDeleteDialog };
