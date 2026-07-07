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
import { STATUS_OPTIONS, ROLE_ICON_OPTIONS, ROLE_COLOR_OPTIONS } from "../constants";
import { useTenantRole } from "../hooks";
import type { UpdateTenantRolePayload, RoleStatus } from "../types";

interface TenantRoleEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string | null;
  onSave?: (id: string, data: UpdateTenantRolePayload) => void;
  saving?: boolean;
}

function TenantRoleEditDrawer({
  open,
  onOpenChange,
  roleId,
  onSave,
  saving,
}: TenantRoleEditDrawerProps) {
  const { data: role, isLoading } = useTenantRole(roleId);
  const [formData, setFormData] = useState<UpdateTenantRolePayload>({});

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        nameAr: role.nameAr,
        description: role.description,
        icon: role.icon,
        color: role.color,
        status: role.status,
        isSystem: role.isSystem,
        isDefault: role.isDefault,
        priority: role.priority,
        notes: role.notes,
      });
    }
  }, [role]);

  const updateField = useCallback(<K extends keyof UpdateTenantRolePayload>(key: K, value: UpdateTenantRolePayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave || !roleId) return;
    onSave(roleId, formData);
  }, [onSave, roleId, formData]);

  const isValid = formData.name && formData.nameAr && formData.description;

  const nonAllStatusOptions = STATUS_OPTIONS.filter((opt) => opt.value !== "all");

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
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="تعديل الدور">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              تعديل الدور
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
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: formData.color }} />
          <span className="text-xs text-muted-foreground">
            {role?.nameAr} — {role?.name}
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
                عام
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">اسم الدور</Label>
                  <AppInput
                    id="edit-name"
                    value={formData.name ?? ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="مثال: Content Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nameAr">الاسم بالعربية</Label>
                  <AppInput
                    id="edit-nameAr"
                    value={formData.nameAr ?? ""}
                    onChange={(e) => updateField("nameAr", e.target.value)}
                    placeholder="مثال: مدير محتوى"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-description">الوصف</Label>
                  <AppTextarea
                    id="edit-description"
                    value={formData.description ?? ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="وصف مختصر للدور..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-icon">الأيقونة</Label>
                  <AppSelect
                    value={formData.icon ?? ""}
                    onValueChange={(val) => updateField("icon", val)}
                  >
                    <AppSelectTrigger id="edit-icon" className="h-9">
                      <AppSelectValue placeholder="اختر الأيقونة" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {ROLE_ICON_OPTIONS.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-color">اللون</Label>
                  <AppSelect
                    value={formData.color ?? ""}
                    onValueChange={(val) => updateField("color", val)}
                  >
                    <AppSelectTrigger id="edit-color" className="h-9">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: formData.color }} />
                        <AppSelectValue placeholder="اختر اللون" />
                      </div>
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {ROLE_COLOR_OPTIONS.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: opt.value }} />
                            {opt.label}
                          </div>
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">الحالة</Label>
                  <AppSelect
                    value={formData.status ?? ""}
                    onValueChange={(val) => updateField("status", val as RoleStatus)}
                  >
                    <AppSelectTrigger id="edit-status" className="h-9">
                      <AppSelectValue placeholder="اختر الحالة" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {nonAllStatusOptions.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">الأولوية</Label>
                  <AppInput
                    id="edit-priority"
                    type="number"
                    min={0}
                    max={9999}
                    value={formData.priority?.toString() ?? "50"}
                    onChange={(e) => updateField("priority", parseInt(e.target.value) || 0)}
                    placeholder="50"
                  />
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
                    <p className="text-sm font-medium">دور النظام</p>
                    <p className="text-xs text-muted-foreground">تحديد ما إذا كان هذا دوراً نظامياً أساسياً</p>
                  </div>
                  <AppSwitch
                    checked={formData.isSystem ?? false}
                    onCheckedChange={(val) => updateField("isSystem", val)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">الدور الافتراضي</p>
                    <p className="text-xs text-muted-foreground">تعيين هذا كدور افتراضي للمستخدمين الجدد</p>
                  </div>
                  <AppSwitch
                    checked={formData.isDefault ?? false}
                    onCheckedChange={(val) => updateField("isDefault", val)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">ملاحظات</Label>
              <AppTextarea
                id="edit-notes"
                value={formData.notes ?? ""}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="ملاحظات إضافية عن الدور..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            {role?.updatedAt ? `آخر تحديث: ${new Date(role.updatedAt).toLocaleDateString("ar")}` : ""}
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

export { TenantRoleEditDrawer };
