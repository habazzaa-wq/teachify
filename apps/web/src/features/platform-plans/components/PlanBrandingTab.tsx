"use client";

import { Check } from "lucide-react";
import { AppSwitch, Label, AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { PLAN_COLORS, PLAN_GRADIENTS, PLAN_ICONS } from "../constants";
import type { PlanBranding } from "../types";
import { renderPlanIcon } from "./PlanPreviewTab";

interface PlanBrandingTabProps {
  branding: Partial<PlanBranding>;
  onChange: (branding: Partial<PlanBranding>) => void;
}

function PlanBrandingTab({ branding, onChange }: PlanBrandingTabProps) {
  const update = (field: keyof PlanBranding, value: unknown) => {
    onChange({ ...branding, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Color Picker */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">اللون</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            {PLAN_COLORS.map((c) => {
              const isSelected = branding.color === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => update("color", c.value)}
                  className={cn(
                    "relative h-11 w-11 rounded-xl border-2 transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected
                      ? "border-foreground scale-110 shadow-lg"
                      : "border-transparent hover:scale-105 hover:shadow-md",
                  )}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.label}
                  title={c.label}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white drop-shadow-md" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </AppCardContent>
      </AppCard>

      {/* Gradient Picker */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">التدرج اللوني</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_GRADIENTS.map((g) => {
              const isSelected = branding.gradient === g.value;
              return (
                <button
                  key={g.value}
                  onClick={() => update("gradient", g.value)}
                  className={cn(
                    "relative h-14 rounded-xl border-2 transition-all duration-200 bg-gradient-to-r overflow-hidden",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected
                      ? "border-foreground ring-2 ring-ring ring-offset-2 shadow-lg"
                      : "border-transparent hover:opacity-90 hover:shadow-md",
                    g.value,
                  )}
                  aria-label={g.label}
                  title={g.label}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                      <Check className="h-5 w-5 text-white drop-shadow-md" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </AppCardContent>
      </AppCard>

      {/* Icon Picker */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">الأيقونة</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            {PLAN_ICONS.map((ic) => {
              const isSelected = branding.icon === ic.value;
              return (
                <button
                  key={ic.value}
                  onClick={() => update("icon", ic.value)}
                  className={cn(
                    "relative flex h-14 w-14 items-center justify-center rounded-xl border-2 transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected
                      ? "border-foreground bg-primary/10 text-primary ring-2 ring-ring ring-offset-2 scale-110 shadow-lg"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted hover:shadow-md hover:scale-105",
                  )}
                  aria-label={ic.label}
                  title={ic.label}
                >
                  {renderPlanIcon(ic.value, "h-6 w-6")}
                </button>
              );
            })}
          </div>
        </AppCardContent>
      </AppCard>

      {/* Ribbon Toggles */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">الأشرطة</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">شريط موصى به</Label>
              <p className="text-xs text-muted-foreground">إظهار شريط «موصى به» على الباقة</p>
            </div>
            <AppSwitch
              checked={branding.recommendedRibbon ?? false}
              onCheckedChange={(val) => update("recommendedRibbon", val)}
              aria-label="تفعيل شريط موصى به"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">شريط الأكثر شهرة</Label>
              <p className="text-xs text-muted-foreground">إظهار شريط «الأكثر شهرة» على الباقة</p>
            </div>
            <AppSwitch
              checked={branding.popularRibbon ?? false}
              onCheckedChange={(val) => update("popularRibbon", val)}
              aria-label="تفعيل شريط الأكثر شهرة"
            />
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

export { PlanBrandingTab };
