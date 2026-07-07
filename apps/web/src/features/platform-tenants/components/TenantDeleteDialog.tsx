"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppDialogFooter,
  AppButton,
  AppInput,
} from "@/components/ui";

interface TenantDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  usersCount: number;
  coursesCount: number;
  videosCount: number;
  storage: number;
  onConfirm: () => void;
  loading?: boolean;
  bulk?: boolean;
  bulkCount?: number;
}

function TenantDeleteDialog({
  open,
  onOpenChange,
  tenantName,
  usersCount,
  coursesCount,
  videosCount,
  storage,
  onConfirm,
  loading,
  bulk,
  bulkCount,
}: TenantDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const canDelete = bulk || confirmText === tenantName;

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-lg">
        <AppDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AppDialogTitle className="text-center">{bulk ? "حذف المؤسسات المحددة" : "حذف المؤسسة"}</AppDialogTitle>
          <AppDialogDescription className="text-center">
            {bulk ? (
              <>هل أنت متأكد من حذف <span className="font-semibold text-foreground">{bulkCount}</span> مؤسسة؟</>
            ) : (
              <>هل أنت متأكد من حذف المؤسسة <span className="font-semibold text-foreground">{tenantName}</span>؟</>
            )}
            <br />
            هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة.
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="mb-3 text-sm font-semibold text-destructive">منطقة الخطر - ملخص المؤسسة:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between rounded bg-destructive/5 px-2 py-1">
              <span className="text-muted-foreground">المستخدمون</span>
              <span className="font-semibold tabular-nums">{usersCount}</span>
            </div>
            <div className="flex items-center justify-between rounded bg-destructive/5 px-2 py-1">
              <span className="text-muted-foreground">الدورات</span>
              <span className="font-semibold tabular-nums">{coursesCount}</span>
            </div>
            <div className="flex items-center justify-between rounded bg-destructive/5 px-2 py-1">
              <span className="text-muted-foreground">الفيديوهات</span>
              <span className="font-semibold tabular-nums">{videosCount}</span>
            </div>
            <div className="flex items-center justify-between rounded bg-destructive/5 px-2 py-1">
              <span className="text-muted-foreground">مساحة التخزين</span>
              <span className="font-semibold tabular-nums">{storage} GB</span>
            </div>
          </div>
        </div>

        {!bulk && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              اكتب <span className="font-bold text-foreground">{tenantName}</span> لتأكيد الحذف:
            </p>
            <AppInput
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={tenantName}
              className="border-destructive/30 focus-visible:border-destructive"
            />
          </div>
        )}

        <AppDialogFooter className="gap-2">
          <AppButton
            variant="outline"
            onClick={() => { setConfirmText(""); onOpenChange(false); }}
            disabled={loading}
            className="flex-1"
          >
            إلغاء
          </AppButton>
          <AppButton
            variant="destructive"
            loading={loading}
            disabled={!canDelete}
            onClick={() => { setConfirmText(""); onConfirm(); }}
            className="flex-1"
          >
            {bulk ? `نعم، حذف (${bulkCount})` : "نعم، حذف المؤسسة"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export { TenantDeleteDialog };
