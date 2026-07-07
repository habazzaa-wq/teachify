"use client";

import { useState, useCallback } from "react";
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
} from "@/components/ui";
import { STATUS_OPTIONS, ROLE_ICON_OPTIONS, ROLE_COLOR_OPTIONS } from "../constants";
import type { CreateTenantRolePayload, RoleStatus } from "../types";

interface TenantRoleCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CreateTenantRolePayload) => void;
  saving?: boolean;
}

function TenantRoleCreateDrawer({
  open,
  onOpenChange,
  onSave,
  saving,
}: TenantRoleCreateDrawerProps) {
  const [formData, setFormData] = useState<CreateTenantRolePayload>({
    name: "",
    nameAr: "",
    description: "",
    icon: "Shield",
    color: "#6366f1",
    status: "active",
    isSystem: false,
    isDefault: false,
    priority: 50,
    notes: "",
  });

  const updateField = useCallback(<K extends keyof CreateTenantRolePayload>(key: K, value: CreateTenantRolePayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave(formData);
  }, [onSave, formData]);

  const isValid = formData.name && formData.nameAr && formData.description;

  const nonAllStatusOptions = STATUS_OPTIONS.filter((opt) => opt.value !== "all");

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[600px] lg:max-w-[700px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="إضافة دور جديد">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              إضافة دور جديد
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
                  <Label htmlFor="create-name">اسم الدور</Label>
                  <AppInput
                    id="create-name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="مثال: Content Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-nameAr">الاسم بالعربية</Label>
                  <AppInput
                    id="create-nameAr"
                    value={formData.nameAr}
                    onChange={(e) => updateField("nameAr", e.target.value)}
                    placeholder="مثال: مدير محتوى"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="create-description">الوصف</Label>
                  <AppTextarea
                    id="create-description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="وصف مختصر للدور..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-icon">الأيقونة</Label>
                  <AppSelect
                    value={formData.icon}
                    onValueChange={(val) => updateField("icon", val)}
                  >
                    <AppSelectTrigger id="create-icon" className="h-9">
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
                  <Label htmlFor="create-color">اللون</Label>
                  <AppSelect
                    value={formData.color}
                    onValueChange={(val) => updateField("color", val)}
                  >
                    <AppSelectTrigger id="create-color" className="h-9">
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
                  <Label htmlFor="create-status">الحالة</Label>
                  <AppSelect
                    value={formData.status}
                    onValueChange={(val) => updateField("status", val as RoleStatus)}
                  >
                    <AppSelectTrigger id="create-status" className="h-9">
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
                  <Label htmlFor="create-priority">الأولوية</Label>
                  <AppInput
                    id="create-priority"
                    type="number"
                    min={0}
                    max={9999}
                    value={formData.priority.toString()}
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
                    checked={formData.isSystem}
                    onCheckedChange={(val) => updateField("isSystem", val)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">الدور الافتراضي</p>
                    <p className="text-xs text-muted-foreground">تعيين هذا كدور افتراضي للمستخدمين الجدد</p>
                  </div>
                  <AppSwitch
                    checked={formData.isDefault}
                    onCheckedChange={(val) => updateField("isDefault", val)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-notes">ملاحظات</Label>
              <AppTextarea
                id="create-notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="ملاحظات إضافية عن الدور..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            سيتم إنشاء الدور بدون صلاحيات
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

export { TenantRoleCreateDrawer };
