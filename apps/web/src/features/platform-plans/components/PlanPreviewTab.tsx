"use client";

import {
  Rocket,
  Star,
  Crown,
  Zap,
  Gem,
  Shield,
  Sparkles,
  Award,
  Check,
  Infinity,
} from "lucide-react";
import { AppBadge, AppButton, AppDivider } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PLAN_BADGE_CONFIG, FEATURE_GROUPS } from "../constants";
import type { PremiumPlan } from "../types";

export function renderPlanIcon(iconName: string, className?: string) {
  const icons: Record<string, React.ElementType> = {
    rocket: Rocket, star: Star, crown: Crown, zap: Zap,
    gem: Gem, shield: Shield, sparkles: Sparkles, award: Award,
  };
  const Icon = icons[iconName] || Rocket;
  return <Icon className={className} />;
}

interface PlanPreviewTabProps {
  data: Partial<PremiumPlan>;
}

function PlanPreviewTab({ data }: PlanPreviewTabProps) {
  const badgeConfig = data.badge ? PLAN_BADGE_CONFIG[data.badge] : null;
  const features = data.features;
  const limits = data.limits;
  const branding = data.branding;

  const enabledFeatures = features
    ? Object.entries(features)
        .filter(([, v]) => v)
        .map(([k]) => {
          for (const group of FEATURE_GROUPS) {
            const found = group.features.find((f) => f.key === k);
            if (found) return found.label;
          }
          return null;
        })
        .filter(Boolean)
    : [];

  return (
    <div className="flex justify-center py-8">
      <div
        className={cn(
          "relative w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-xl",
          "transition-all duration-300 hover:shadow-2xl",
        )}
      >
        {(branding?.recommendedRibbon || branding?.popularRibbon) && (
          <div className="absolute top-4 end-4 z-10 flex flex-col gap-1.5">
            {branding?.popularRibbon && (
              <span className="animate-in slide-in-from-top-2 fade-in rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-1 text-[10px] font-bold text-white shadow-lg">
                الأكثر شهرة
              </span>
            )}
            {branding?.recommendedRibbon && (
              <span className="animate-in slide-in-from-top-2 fade-in rounded-full bg-gradient-to-r from-primary to-primary/80 px-3.5 py-1 text-[10px] font-bold text-primary-foreground shadow-lg">
                موصى به
              </span>
            )}
          </div>
        )}

        {/* Gradient Header */}
        <div
          className={cn(
            "relative p-6 text-white",
            branding?.gradient || "bg-gradient-to-br from-indigo-500 to-purple-600",
          )}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
                {renderPlanIcon(branding?.icon ?? "rocket", "h-6 w-6")}
              </div>
              {badgeConfig && (
                <AppBadge variant={badgeConfig.variant} className="bg-white/20 text-white backdrop-blur-sm border-0">
                  {badgeConfig.label}
                </AppBadge>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">{data.name || "اسم الباقة"}</h3>
              {data.description && (
                <p className="text-sm text-white/80 line-clamp-2">{data.description}</p>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight">
                {data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : data.currency === "SAR" ? "ر.س" : data.currency === "AED" ? "د.إ" : "$"}
                {formatNumber(data.monthlyPrice ?? 0)}
              </span>
              <span className="text-sm text-white/70">/ شهرياً</span>
            </div>
            {(data.yearlyPrice ?? 0) > 0 && (
              <p className="text-xs text-white/60">
                {data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : data.currency === "SAR" ? "ر.س" : data.currency === "AED" ? "د.إ" : "$"}
                {formatNumber(data.yearlyPrice ?? 0)} سنوياً
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <AppButton
            className="w-full rounded-xl h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            size="lg"
            style={
              branding?.color
                ? { backgroundColor: branding.color, borderColor: branding.color }
                : undefined
            }
          >
            ابدأ الآن
          </AppButton>

          <AppDivider />

          {/* Features */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              المميزات
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {enabledFeatures.slice(0, 8).map((feat) => (
                <div key={feat as string} className="flex items-center gap-2.5 text-sm group">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 transition-colors group-hover:bg-success/20">
                    <Check className="h-3 w-3 text-success" />
                  </span>
                  <span className="text-foreground/80">{feat as string}</span>
                </div>
              ))}
              {enabledFeatures.length > 8 && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{enabledFeatures.length - 8} مميزات أخرى
                </p>
              )}
              {enabledFeatures.length === 0 && (
                <p className="text-xs text-muted-foreground">لا توجد مميزات محددة</p>
              )}
            </div>
          </div>

          {/* Limits */}
          {limits && (
            <>
              <AppDivider />
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  الحدود
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {limits.students !== undefined && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">الطلاب</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {limits.students === null ? <Infinity className="h-3.5 w-3.5 inline text-primary" /> : formatNumber(limits.students)}
                      </span>
                    </div>
                  )}
                  {limits.courses !== undefined && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">الدورات</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {limits.courses === null ? <Infinity className="h-3.5 w-3.5 inline text-primary" /> : formatNumber(limits.courses)}
                      </span>
                    </div>
                  )}
                  {limits.storage !== undefined && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">التخزين</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {limits.storage === null ? "∞" : `${limits.storage} GB`}
                      </span>
                    </div>
                  )}
                  {limits.bandwidth !== undefined && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">النطاق</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {limits.bandwidth === null ? "∞" : `${limits.bandwidth} GB`}
                      </span>
                    </div>
                  )}
                </div>
                {data.trialEnabled && (
                  <div className="mt-3 rounded-xl bg-success/5 border border-success/10 px-4 py-2.5 text-center">
                    <p className="text-xs text-success font-medium">
                      فترة تجريبية مجانية لمدة {data.trialDays} يوم
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { PlanPreviewTab };
