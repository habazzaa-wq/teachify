"use client";

import { useMemo } from "react";
import {
  AppInput,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppSwitch,
  AppCard,
  AppCardContent,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { usePlans } from "@/features/platform-plans";
import { BILLING_STATUS_OPTIONS } from "../../constants";
import type { BillingStatus } from "../../types";

interface WizardPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  storage: number;
  users: number;
  trialDays: number;
}

interface CreateSubscriptionTabProps {
  data: {
    planId: string;
    trialDays: number;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    billingStatus: BillingStatus;
  };
  errors: Record<string, string>;
  onChange: (key: string, value: string | number | boolean) => void;
}

function CreateSubscriptionTab({ data, errors, onChange }: CreateSubscriptionTabProps) {
  const plansQuery = usePlans({ status: "active" });

  const plans: WizardPlan[] = useMemo(() => {
    if (!plansQuery.data?.data) return [];
    return plansQuery.data.data.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.monthlyPrice,
      currency: p.currency,
      storage: p.limits.storage ?? 0,
      users: (p.limits.students ?? 0) + (p.limits.instructors ?? 0) + (p.limits.admins ?? 0),
      trialDays: p.trialDays,
    }));
  }, [plansQuery.data]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === data.planId),
    [data.planId, plans],
  );

  const billingOptions = useMemo(
    () => BILLING_STATUS_OPTIONS.filter((o) => o.value !== "all"),
    [],
  );

  if (plansQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">جاري تحميل الباقات...</p>
      </div>
    );
  }

  if (plansQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-destructive">حدث خطأ أثناء تحميل الباقات</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CreditCard className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">لا توجد باقات نشطة. قم بإنشاء باقة أولاً من صفحة الباقات.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          الخطة الحالية <span className="text-destructive">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onChange("planId", plan.id)}
              className={cn(
                "flex flex-col items-start rounded-lg border p-4 text-start transition-all duration-200",
                data.planId === plan.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md"
                  : "border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm",
              )}
            >
              <div className="flex w-full items-center justify-between mb-2">
                <CreditCard className={cn(
                  "h-5 w-5",
                  data.planId === plan.id ? "text-primary" : "text-muted-foreground",
                )} />
                {data.planId === plan.id && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground animate-in zoom-in duration-200">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{plan.price} {plan.currency}/شهرياً</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{plan.storage}GB تخزين · {plan.users} مستخدم</p>
            </button>
          ))}
        </div>
        {errors.planId && (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.planId}</p>
        )}
      </div>

      {selectedPlan && (
        <AppCard>
          <AppCardContent className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">أيام التجربة</label>
                <AppInput
                  type="number"
                  min={0}
                  max={365}
                  value={data.trialDays}
                  onChange={(e) => onChange("trialDays", parseInt(e.target.value) || 0)}
                />
                {errors.trialDays && (
                  <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.trialDays}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  تاريخ البداية <span className="text-destructive">*</span>
                </label>
                <AppInput
                  type="date"
                  value={data.startDate}
                  onChange={(e) => onChange("startDate", e.target.value)}
                />
                {errors.startDate && (
                  <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  تاريخ النهاية <span className="text-destructive">*</span>
                </label>
                <AppInput
                  type="date"
                  value={data.endDate}
                  onChange={(e) => onChange("endDate", e.target.value)}
                />
                {errors.endDate && (
                  <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.endDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">حالة الفوترة</label>
                <AppSelect value={data.billingStatus} onValueChange={(val) => onChange("billingStatus", val)}>
                  <AppSelectTrigger>
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {billingOptions.map((opt) => (
                      <AppSelectItem key={opt.value} value={opt.value}>{opt.label}</AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-lg border p-3">
              <AppSwitch
                checked={data.autoRenew}
                onCheckedChange={(v) => onChange("autoRenew", v)}
                id="autoRenew"
              />
              <label htmlFor="autoRenew" className="text-sm font-medium cursor-pointer">
                التجديد التلقائي
              </label>
            </div>
          </AppCardContent>
        </AppCard>
      )}

      {selectedPlan && (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="text-sm font-semibold mb-3">تفاصيل الخطة</h4>
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <div className="flex justify-between rounded bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">السعر</span>
              <span className="font-medium">{selectedPlan.price} {selectedPlan.currency}/شهرياً</span>
            </div>
            <div className="flex justify-between rounded bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">التخزين</span>
              <span className="font-medium">{selectedPlan.storage} GB</span>
            </div>
            <div className="flex justify-between rounded bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">المستخدمين</span>
              <span className="font-medium">{selectedPlan.users}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { CreateSubscriptionTab };
