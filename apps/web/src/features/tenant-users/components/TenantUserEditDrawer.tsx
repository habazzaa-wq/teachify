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
  Label,
  AppAvatar,
  AppAvatarFallback,
  Skeleton,
} from "@/components/ui";
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS, STATUS_OPTIONS, LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from "../constants";
import { useTenantUser } from "../hooks";
import type { UpdateTenantUserPayload, DepartmentSlug, UserRoleSlug, UserStatus } from "../types";
import { initialsOf } from "@/lib/format";

interface TenantUserEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onSave?: (id: string, data: UpdateTenantUserPayload) => void;
  saving?: boolean;
}

function TenantUserEditDrawer({
  open,
  onOpenChange,
  userId,
  onSave,
  saving,
}: TenantUserEditDrawerProps) {
  const { data: user, isLoading } = useTenantUser(userId);
  const [formData, setFormData] = useState<UpdateTenantUserPayload>({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        department: user.department,
        jobTitle: user.jobTitle,
        roleSlug: user.role.slug,
        status: user.status,
        language: user.language,
        timezone: user.timezone,
        avatar: user.avatar,
        notes: user.notes,
      });
    }
  }, [user]);

  const updateField = useCallback(<K extends keyof UpdateTenantUserPayload>(key: K, value: UpdateTenantUserPayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave || !userId) return;
    onSave(userId, formData);
  }, [onSave, userId, formData]);

  const isValid = formData.fullName && formData.email && formData.jobTitle;

  const nonRoleOptions = ROLE_OPTIONS.filter((opt) => opt.value !== "all");

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
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="تعديل المستخدم">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              تعديل المستخدم
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
          <AppAvatar className="h-6 w-6">
            <AppAvatarFallback className="text-[10px]">{initialsOf(user?.fullName)}</AppAvatarFallback>
          </AppAvatar>
          <span className="text-xs text-muted-foreground">
            {user?.email}
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
                المعلومات الشخصية
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-fullname">الاسم الكامل</Label>
                  <AppInput
                    id="edit-fullname"
                    value={formData.fullName ?? ""}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                  <AppInput
                    id="edit-email"
                    type="email"
                    value={formData.email ?? ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">رقم الهاتف</Label>
                  <AppInput
                    id="edit-phone"
                    value={formData.phone ?? ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+966501234567"
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
                  <Label htmlFor="edit-department">القسم</Label>
                  <AppSelect
                    value={formData.department ?? ""}
                    onValueChange={(val) => updateField("department", val as DepartmentSlug)}
                  >
                    <AppSelectTrigger id="edit-department" className="h-9">
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
                  <Label htmlFor="edit-jobtitle">المسمى الوظيفي</Label>
                  <AppInput
                    id="edit-jobtitle"
                    value={formData.jobTitle ?? ""}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    placeholder="مثال: مدرب، محاسب، مطور"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">الدور</Label>
                  <AppSelect
                    value={formData.roleSlug ?? ""}
                    onValueChange={(val) => updateField("roleSlug", val as UserRoleSlug)}
                  >
                    <AppSelectTrigger id="edit-role" className="h-9">
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
                  <Label htmlFor="edit-status">الحالة</Label>
                  <AppSelect
                    value={formData.status ?? ""}
                    onValueChange={(val) => updateField("status", val as UserStatus)}
                  >
                    <AppSelectTrigger id="edit-status" className="h-9">
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
                  <Label htmlFor="edit-language">اللغة</Label>
                  <AppSelect
                    value={formData.language ?? ""}
                    onValueChange={(val) => updateField("language", val)}
                  >
                    <AppSelectTrigger id="edit-language" className="h-9">
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
                  <Label htmlFor="edit-timezone">المنطقة الزمنية</Label>
                  <AppSelect
                    value={formData.timezone ?? ""}
                    onValueChange={(val) => updateField("timezone", val)}
                  >
                    <AppSelectTrigger id="edit-timezone" className="h-9">
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
              <Label htmlFor="edit-notes">ملاحظات</Label>
              <AppTextarea
                id="edit-notes"
                value={formData.notes ?? ""}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="ملاحظات إضافية عن المستخدم..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            آخر تحديث: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString("ar") : "—"}
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

export { TenantUserEditDrawer };
