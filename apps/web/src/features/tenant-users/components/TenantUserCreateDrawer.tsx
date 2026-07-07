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
  Label,
  AppAvatar,
  AppAvatarFallback,
} from "@/components/ui";
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS, STATUS_OPTIONS, LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from "../constants";
import type { CreateTenantUserPayload, DepartmentSlug, UserRoleSlug, UserStatus } from "../types";
import { initialsOf } from "@/lib/format";

interface TenantUserCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CreateTenantUserPayload) => void;
  saving?: boolean;
}

function TenantUserCreateDrawer({
  open,
  onOpenChange,
  onSave,
  saving,
}: TenantUserCreateDrawerProps) {
  const [formData, setFormData] = useState<CreateTenantUserPayload>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    department: "support",
    jobTitle: "",
    roleSlug: "custom",
    status: "active",
    language: "ar",
    timezone: "Asia/Riyadh",
    avatar: null,
    notes: "",
  });

  const updateField = useCallback(<K extends keyof CreateTenantUserPayload>(key: K, value: CreateTenantUserPayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave(formData);
  }, [onSave, formData]);

  const isValid = formData.fullName && formData.email && formData.password && formData.jobTitle;

  const nonRoleOptions = ROLE_OPTIONS.filter((opt) => opt.value !== "all");

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[600px] lg:max-w-[700px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="إضافة مستخدم جديد">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              إضافة مستخدم جديد
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
                المعلومات الشخصية
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <AppAvatar className="h-16 w-16">
                  <AppAvatarFallback className="text-lg">{initialsOf(formData.fullName) || "?"}</AppAvatarFallback>
                </AppAvatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">الصورة الشخصية</p>
                  <p className="text-xs text-muted-foreground">سيتم إضافة الصورة لاحقاً</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-fullname">الاسم الكامل</Label>
                  <AppInput
                    id="create-fullname"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">البريد الإلكتروني</Label>
                  <AppInput
                    id="create-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-phone">رقم الهاتف</Label>
                  <AppInput
                    id="create-phone"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+966501234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">كلمة المرور</Label>
                  <AppInput
                    id="create-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="أقل من 8 أحرف"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                المعلومات الوظيفية
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-department">القسم</Label>
                  <AppSelect
                    value={formData.department}
                    onValueChange={(val) => updateField("department", val as DepartmentSlug)}
                  >
                    <AppSelectTrigger id="create-department" className="h-9">
                      <AppSelectValue placeholder="اختر القسم" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {DEPARTMENT_OPTIONS.filter((d) => d.value !== "all").map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-jobtitle">المسمى الوظيفي</Label>
                  <AppInput
                    id="create-jobtitle"
                    value={formData.jobTitle}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    placeholder="مثال: مدرب، محاسب، مطور"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">الدور</Label>
                  <AppSelect
                    value={formData.roleSlug}
                    onValueChange={(val) => updateField("roleSlug", val as UserRoleSlug)}
                  >
                    <AppSelectTrigger id="create-role" className="h-9">
                      <AppSelectValue placeholder="اختر الدور" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {nonRoleOptions.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-status">الحالة</Label>
                  <AppSelect
                    value={formData.status}
                    onValueChange={(val) => updateField("status", val as UserStatus)}
                  >
                    <AppSelectTrigger id="create-status" className="h-9">
                      <AppSelectValue placeholder="اختر الحالة" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {STATUS_OPTIONS.filter((s) => s.value !== "all").map((opt) => (
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-language">اللغة</Label>
                  <AppSelect
                    value={formData.language}
                    onValueChange={(val) => updateField("language", val)}
                  >
                    <AppSelectTrigger id="create-language" className="h-9">
                      <AppSelectValue placeholder="اختر اللغة" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-timezone">المنطقة الزمنية</Label>
                  <AppSelect
                    value={formData.timezone}
                    onValueChange={(val) => updateField("timezone", val)}
                  >
                    <AppSelectTrigger id="create-timezone" className="h-9">
                      <AppSelectValue placeholder="اختر المنطقة الزمنية" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      {TIMEZONE_OPTIONS.map((opt) => (
                        <AppSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-notes">ملاحظات</Label>
              <AppTextarea
                id="create-notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="ملاحظات إضافية عن المستخدم..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            سيتم إرسال دعوة للمستخدم بعد الحفظ
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

export { TenantUserCreateDrawer };
