"use client";

import { useState, useMemo } from "react";
import { GitBranch, AlertTriangle } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppDialogFooter,
  AppButton,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  Label,
} from "@/components/ui";
import type { MatrixRole, CloneMode, MatrixData } from "../types";

interface CloneRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: MatrixRole[];
  currentRoleId: string | null;
  matrix: MatrixData;
  onConfirm: (sourceRoleId: string, destinationRoleId: string, mode: CloneMode) => void;
  loading?: boolean;
}

function CloneRoleDialog({
  open,
  onOpenChange,
  roles,
  currentRoleId,
  matrix,
  onConfirm,
  loading,
}: CloneRoleDialogProps) {
  const [sourceRoleId, setSourceRoleId] = useState("");
  const [destinationRoleId, setDestinationRoleId] = useState("");
  const [mode, setMode] = useState<CloneMode>("replace");

  const availableSources = useMemo(
    () => roles.filter((r) => r.id !== currentRoleId),
    [roles, currentRoleId],
  );

  const availableDestinations = useMemo(
    () => roles.filter((r) => r.id !== sourceRoleId),
    [roles, sourceRoleId],
  );

  const preview = useMemo(() => {
    if (!sourceRoleId || !destinationRoleId) return null;
    const sourcePerms = matrix[sourceRoleId] ?? {};
    const destPerms = matrix[destinationRoleId] ?? {};
    const sourceEnabled = Object.keys(sourcePerms).filter((k) => sourcePerms[k]).length;
    const destEnabled = Object.keys(destPerms).filter((k) => destPerms[k]).length;
    const newPerms = mode === "replace"
      ? sourceEnabled
      : Object.keys({ ...destPerms, ...sourcePerms }).filter(
          (k) => sourcePerms[k] || destPerms[k],
        ).length;
    const added = sourceEnabled - (mode === "merge" ? Object.keys(sourcePerms).filter((k) => sourcePerms[k] && !destPerms[k]).length : sourceEnabled);

    return { sourceEnabled, destEnabled, newPerms, added };
  }, [sourceRoleId, destinationRoleId, mode, matrix]);

  const reset = () => {
    setSourceRoleId("");
    setDestinationRoleId("");
    setMode("replace");
  };

  const handleConfirm = () => {
    if (sourceRoleId && destinationRoleId) {
      onConfirm(sourceRoleId, destinationRoleId, mode);
      reset();
    }
  };

  const sourceRole = roles.find((r) => r.id === sourceRoleId);
  const destRole = roles.find((r) => r.id === destinationRoleId);

  return (
    <AppDialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset();
        onOpenChange(val);
      }}
    >
      <AppDialogContent className="sm:max-w-lg">
        <AppDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GitBranch className="h-6 w-6" />
          </div>
          <AppDialogTitle className="text-center">
            استنساخ الصلاحيات من دور
          </AppDialogTitle>
          <AppDialogDescription className="text-center">
            نسخ الصلاحيات من دور مصدر إلى دور وجهة
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>دور المصدر</Label>
            <AppSelect value={sourceRoleId} onValueChange={setSourceRoleId}>
              <AppSelectTrigger>
                <AppSelectValue placeholder="اختر دور المصدر" />
              </AppSelectTrigger>
              <AppSelectContent>
                {availableSources.map((role) => (
                  <AppSelectItem key={role.id} value={role.id}>
                    {role.nameAr}
                  </AppSelectItem>
                ))}
              </AppSelectContent>
            </AppSelect>
          </div>

          <div className="space-y-2">
            <Label>دور الوجهة</Label>
            <AppSelect
              value={destinationRoleId}
              onValueChange={setDestinationRoleId}
            >
              <AppSelectTrigger>
                <AppSelectValue placeholder="اختر دور الوجهة" />
              </AppSelectTrigger>
              <AppSelectContent>
                {availableDestinations.map((role) => (
                  <AppSelectItem key={role.id} value={role.id}>
                    {role.nameAr}
                  </AppSelectItem>
                ))}
              </AppSelectContent>
            </AppSelect>
          </div>

          <div className="space-y-2">
            <Label>نوع النسخ</Label>
            <AppSelect
              value={mode}
              onValueChange={(val) => setMode(val as CloneMode)}
            >
              <AppSelectTrigger>
                <AppSelectValue />
              </AppSelectTrigger>
              <AppSelectContent>
                <AppSelectItem value="replace">
                  استبدال - استبدال صلاحيات الوجهة بالكامل
                </AppSelectItem>
                <AppSelectItem value="merge">
                  دمج - دمج صلاحيات المصدر مع الوجهة
                </AppSelectItem>
              </AppSelectContent>
            </AppSelect>
          </div>

          {preview && sourceRole && destRole && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">معاينة التغييرات</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">المصدر</p>
                  <p className="font-medium">{sourceRole.nameAr}</p>
                  <p className="text-xs text-muted-foreground">
                    {preview.sourceEnabled} صلاحية مفعلة
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">الوجهة</p>
                  <p className="font-medium">{destRole.nameAr}</p>
                  <p className="text-xs text-muted-foreground">
                    {preview.destEnabled} صلاحية مفعلة
                  </p>
                </div>
              </div>
              <div className="border-t pt-2 mt-2">
                <p className="text-sm">
                  النتيجة:{` `}
                  <span className="font-semibold">{preview.newPerms}</span>
                  {` `}صلاحية مفعلة
                  {mode === "merge" && preview.added > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {" "}(+{preview.added} جديدة)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {mode === "replace" && destinationRoleId && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <p className="text-xs text-destructive">
                سيتم استبدال جميع صلاحيات دور الوجهة الحالية بصلاحيات دور المصدر.
                لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
          )}
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
            onClick={handleConfirm}
            disabled={!sourceRoleId || !destinationRoleId}
            loading={loading}
            className="flex-1"
          >
            تأكيد النسخ
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export { CloneRoleDialog };
