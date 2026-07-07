"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Save } from "lucide-react";
import {
  AppButton,
  AppInput,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppDrawer,
  AppTextarea,
  AppSwitch,
  Label,
  Skeleton,
} from "@/components/ui";
import { CREATE_RISK_LEVEL_OPTIONS } from "../constants";
import { useTenantPermission } from "../hooks";
import type { UpdateTenantPermissionPayload, RiskLevel } from "../types";

interface TenantPermissionEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionId: string | null;
  onSave?: (id: string, data: UpdateTenantPermissionPayload) => void;
  saving?: boolean;
}

function TenantPermissionEditDrawer({
  open,
  onOpenChange,
  permissionId,
  onSave,
  saving,
}: TenantPermissionEditDrawerProps) {
  const { data: permission, isLoading } = useTenantPermission(permissionId);
  const [formData, setFormData] = useState<UpdateTenantPermissionPayload>({});

  useEffect(() => {
    if (permission) {
      setFormData({
        nameAr: permission.nameAr,
        nameEn: permission.nameEn,
        description: permission.description,
        riskLevel: permission.riskLevel,
        isHidden: permission.isHidden,
        notes: permission.notes,
      });
    }
  }, [permission]);

  const updateField = useCallback(<K extends keyof UpdateTenantPermissionPayload>(key: K, value: UpdateTenantPermissionPayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave || !permissionId) return;
    onSave(permissionId, formData);
  }, [onSave, permissionId, formData]);

  const isValid = formData.nameAr && formData.nameEn && formData.description;

  const nonAllRiskLevelOptions = CREATE_RISK_LEVEL_OPTIONS;

  if (isLoading) {
    return (
      <AppDrawer open={open} onOpenChange={onOpenChange} side="end" className="w-full sm:max-w-[600px] lg:max-w-[700px]">
        <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
          <header className="flex items-center justify-between border-b px-6 py-4 shrink-0">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </header>
          <div className="flex-1 p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </AppDrawer>
    );
  }

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[600px] lg:max-w-[700px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="تعديل الصلاحية">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              تعديل الصلاحية
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="shrink-0 border-b bg-muted/20 px-6 py-2 flex items-center gap-2">
          <code className="text-xs font-mono text-muted-foreground" dir="ltr">
            {permission?.key}
          </code>
          <span className="text-xs text-muted-foreground">—</span>
          <span className="text-xs text-muted-foreground">
            {permission?.nameAr}
          </span>
        </div>

        <div
          className="flex-1 overflow-y-auto min-h-0 bg-muted/10"
          style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin' }}
        >
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                معلومات الصلاحية
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-nameAr">الاسم بالعربية</Label>
                  <AppInput
                    id="edit-nameAr"
                    value={formData.nameAr ?? ""}
                    onChange={(e) => updateField("nameAr", e.target.value)}
                    placeholder="مثال: عرض المستخدمين"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nameEn">الاسم بالإنجليزية</Label>
                  <AppInput
                    id="edit-nameEn"
                    value={formData.nameEn ?? ""}
                    onChange={(e) => updateField("nameEn", e.target.value)}
                    placeholder="مثال: View Users"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-description">الوصف</Label>
                  <AppTextarea
                    id="edit-description"
                    value={formData.description ?? ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="وصف مختصر للصلاحية..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-riskLevel">مستوى المخاطرة</Label>
                  <AppSelect
                    value={formData.riskLevel ?? ""}
                    onValueChange={(val) => updateField("riskLevel", val as RiskLevel)}
                  >
                    <AppSelectTrigger id="edit-riskLevel" className="h-9">
                      <AppSelectValue placeholder="اختر المستوى" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {nonAllRiskLevelOptions.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                الإعدادات
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">صلاحية مخفية</p>
                    <p className="text-xs text-muted-foreground">إخفاء الصلاحية من واجهة المستخدمين العاديين</p>
                  </div>
                  <AppSwitch
                    checked={formData.isHidden ?? false}
                    onCheckedChange={(val) => updateField("isHidden", val)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">ملاحظات داخلية</Label>
              <AppTextarea
                id="edit-notes"
                value={formData.notes ?? ""}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="ملاحظات إضافية عن الصلاحية..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            {permission?.updatedAt ? `آخر تحديث: ${new Date(permission.updatedAt).toLocaleDateString("ar")}` : ""}
          </div>
          <div className="flex items-center gap-3">
            <AppButton variant="ghost" onClick={handleClose} className="text-sm">
              إلغاء
            </AppButton>
            {onSave && (
              <AppButton size="default" onClick={handleSave} loading={saving} disabled={!isValid} className="text-sm min-w-[100px]">
                <Save className="h-4 w-4" />
                حفظ
              </AppButton>
            )}
          </div>
        </footer>
      </div>
    </AppDrawer>
  );
}

export { TenantPermissionEditDrawer };
