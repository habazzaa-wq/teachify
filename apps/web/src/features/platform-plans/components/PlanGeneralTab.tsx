"use client";

import { AppInput, AppTextarea, AppSwitch, AppSelect, AppSelectTrigger, AppSelectValue, AppSelectContent, AppSelectItem, Label, AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/ui";
import { PlanFormField } from "./PlanFormField";
import { PLAN_BADGE_CONFIG, CURRENCY_OPTIONS } from "../constants";
import type { PremiumPlan, PlanBadge } from "../types";

interface PlanGeneralTabProps {
  data: Partial<PremiumPlan>;
  onChange: (data: Partial<PremiumPlan>) => void;
  errors?: Record<string, string>;
}

function PlanGeneralTab({ data, onChange, errors }: PlanGeneralTabProps) {
  const update = (field: string, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Plan Info */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">1</span>
            معلومات الباقة
          </AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <PlanFormField label="اسم الباقة" error={errors?.name}>
              <AppInput
                value={data.name ?? ""}
                onChange={(e) => update("name", e.target.value)}
                placeholder="مثال: احترافية"
              />
            </PlanFormField>
            <PlanFormField label="الرابط المختصر (Slug)" error={errors?.slug}>
              <AppInput
                value={data.slug ?? ""}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="مثال: professional"
                dir="ltr"
              />
            </PlanFormField>
          </div>
          <PlanFormField label="الوصف" error={errors?.description}>
            <AppTextarea
              value={data.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="وصف مختصر للباقة..."
              rows={3}
            />
          </PlanFormField>
        </AppCardContent>
      </AppCard>

      {/* Badge & Pricing */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">2</span>
            الشارة والتسعير
          </AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PlanFormField label="الشارة">
              <AppSelect
                value={data.badge ?? "none"}
                onValueChange={(val) => update("badge", val === "none" ? null : val)}
              >
                <AppSelectTrigger>
                  <AppSelectValue placeholder="اختيار شارة" />
                </AppSelectTrigger>
                <AppSelectContent>
                  <AppSelectItem value="none">بدون شارة</AppSelectItem>
                  {(Object.entries(PLAN_BADGE_CONFIG) as [PlanBadge, typeof PLAN_BADGE_CONFIG[PlanBadge]][]).map(
                    ([key, config]) => (
                      <AppSelectItem key={key} value={key}>
                        {config.label}
                      </AppSelectItem>
                    ),
                  )}
                </AppSelectContent>
              </AppSelect>
            </PlanFormField>
            <PlanFormField label="العملة">
              <AppSelect
                value={data.currency ?? "SAR"}
                onValueChange={(val) => update("currency", val)}
              >
                <AppSelectTrigger>
                  <AppSelectValue />
                </AppSelectTrigger>
                <AppSelectContent>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <AppSelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </PlanFormField>
            <PlanFormField label="ترتيب العرض" error={errors?.displayOrder}>
              <AppInput
                type="number"
                min={0}
                value={data.displayOrder ?? ""}
                onChange={(e) => update("displayOrder", parseInt(e.target.value) || 0)}
                placeholder="1"
              />
            </PlanFormField>
            <PlanFormField label="السعر الشهري" error={errors?.monthlyPrice}>
              <AppInput
                type="number"
                min={0}
                value={data.monthlyPrice ?? ""}
                onChange={(e) => update("monthlyPrice", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </PlanFormField>
            <PlanFormField label="السعر السنوي" error={errors?.yearlyPrice}>
              <AppInput
                type="number"
                min={0}
                value={data.yearlyPrice ?? ""}
                onChange={(e) => update("yearlyPrice", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </PlanFormField>
          </div>
        </AppCardContent>
      </AppCard>

      {/* Settings */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">3</span>
            الإعدادات
          </AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">الباقة التجريبية</Label>
                <p className="text-xs text-muted-foreground">تفعيل الفترة التجريبية</p>
              </div>
              <AppSwitch
                checked={data.trialEnabled ?? false}
                onCheckedChange={(val) => update("trialEnabled", val)}
                aria-label="تفعيل الباقة التجريبية"
              />
            </div>
            <PlanFormField
              label="عدد أيام التجربة"
              className={!data.trialEnabled ? "opacity-50 pointer-events-none" : ""}
            >
              <AppInput
                type="number"
                min={0}
                value={data.trialDays ?? ""}
                onChange={(e) => update("trialDays", parseInt(e.target.value) || 0)}
                disabled={!data.trialEnabled}
                placeholder="14"
              />
            </PlanFormField>
            <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">باقة موصى بها</Label>
                <p className="text-xs text-muted-foreground">إظهار الباقة كباقة موصى بها</p>
              </div>
              <AppSwitch
                checked={data.recommended ?? false}
                onCheckedChange={(val) => update("recommended", val)}
                aria-label="تفعيل الباقة الموصى بها"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">ظاهر</Label>
                <p className="text-xs text-muted-foreground">إظهار الباقة في واجهة المستخدم</p>
              </div>
              <AppSwitch
                checked={data.visible ?? true}
                onCheckedChange={(val) => update("visible", val)}
                aria-label="إظهار الباقة"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">نشط</Label>
                <p className="text-xs text-muted-foreground">تفعيل الباقة للاستخدام</p>
              </div>
              <AppSwitch
                checked={data.status === "active"}
                onCheckedChange={(val) => update("status", val ? "active" : "draft")}
                aria-label="تفعيل الباقة"
              />
            </div>
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

export { PlanGeneralTab };
