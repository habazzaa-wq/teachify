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
import { CREATE_MODULE_OPTIONS, CREATE_ACTION_OPTIONS, CREATE_RISK_LEVEL_OPTIONS } from "../constants";
import { generatePermissionKey } from "../mock";
import type { CreateTenantPermissionPayload, PermissionModule, PermissionAction, RiskLevel } from "../types";

interface TenantPermissionCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CreateTenantPermissionPayload) => void;
  saving?: boolean;
}

function TenantPermissionCreateDrawer({
  open,
  onOpenChange,
  onSave,
  saving,
}: TenantPermissionCreateDrawerProps) {
  const [formData, setFormData] = useState<CreateTenantPermissionPayload>({
    key: "",
    nameAr: "",
    nameEn: "",
    module: "dashboard",
    action: "view",
    description: "",
    riskLevel: "low",
    isSystem: false,
    isHidden: false,
    notes: "",
  });

  const updateField = useCallback(<K extends keyof CreateTenantPermissionPayload>(key: K, value: CreateTenantPermissionPayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleModuleChange = useCallback((value: string) => {
    const module = value as PermissionModule;
    const key = generatePermissionKey(module, formData.action);
    setFormData((prev) => ({ ...prev, module, key }));
  }, [formData.action]);

  const handleActionChange = useCallback((value: string) => {
    const action = value as PermissionAction;
    const key = generatePermissionKey(formData.module, action);
    setFormData((prev) => ({ ...prev, action, key }));
  }, [formData.module]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave(formData);
  }, [onSave, formData]);

  const isValid = formData.key && formData.nameAr && formData.nameEn && formData.description;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[600px] lg:max-w-[700px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="إضافة صلاحية جديدة">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              إضافة صلاحية جديدة
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
                تعريف الصلاحية
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-module">الوحدة</Label>
                  <AppSelect
                    value={formData.module}
                    onValueChange={handleModuleChange}
                  >
                    <AppSelectTrigger id="create-module" className="h-9">
                      <AppSelectValue placeholder="اختر الوحدة" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {CREATE_MODULE_OPTIONS.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-action">الإجراء</Label>
                  <AppSelect
                    value={formData.action}
                    onValueChange={handleActionChange}
                  >
                    <AppSelectTrigger id="create-action" className="h-9">
                      <AppSelectValue placeholder="اختر الإجراء" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {CREATE_ACTION_OPTIONS.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="create-key">مفتاح الصلاحية</Label>
                  <AppInput
                    id="create-key"
                    value={formData.key}
                    onChange={(e) => updateField("key", e.target.value)}
                    placeholder="مثال: users.view"
                    className="font-mono text-sm"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">التنسيق: وحدة.إجراء (يتم إنشاؤه تلقائياً)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-nameAr">الاسم بالعربية</Label>
                  <AppInput
                    id="create-nameAr"
                    value={formData.nameAr}
                    onChange={(e) => updateField("nameAr", e.target.value)}
                    placeholder="مثال: عرض المستخدمين"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-nameEn">الاسم بالإنجليزية</Label>
                  <AppInput
                    id="create-nameEn"
                    value={formData.nameEn}
                    onChange={(e) => updateField("nameEn", e.target.value)}
                    placeholder="مثال: View Users"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="create-description">الوصف</Label>
                  <AppTextarea
                    id="create-description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="وصف مختصر للصلاحية..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-riskLevel">مستوى المخاطرة</Label>
                  <AppSelect
                    value={formData.riskLevel}
                    onValueChange={(val) => updateField("riskLevel", val as RiskLevel)}
                  >
                    <AppSelectTrigger id="create-riskLevel" className="h-9">
                      <AppSelectValue placeholder="اختر المستوى" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {CREATE_RISK_LEVEL_OPTIONS.map((opt) => (
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
                    <p className="text-sm font-medium">صلاحية نظام</p>
                    <p className="text-xs text-muted-foreground">تحديد ما إذا كانت هذه صلاحية نظامية أساسية</p>
                  </div>
                  <AppSwitch
                    checked={formData.isSystem}
                    onCheckedChange={(val) => updateField("isSystem", val)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">صلاحية مخفية</p>
                    <p className="text-xs text-muted-foreground">إخفاء الصلاحية من واجهة المستخدمين العاديين</p>
                  </div>
                  <AppSwitch
                    checked={formData.isHidden}
                    onCheckedChange={(val) => updateField("isHidden", val)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-notes">ملاحظات داخلية</Label>
              <AppTextarea
                id="create-notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="ملاحظات إضافية عن الصلاحية..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            سيتم إنشاء الصلاحية بدون تعيين لأي دور
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

export { TenantPermissionCreateDrawer };
