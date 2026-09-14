"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppInput } from "@/components/ui";
import type {
  DashboardPeriodPreset,
  DashboardQueryParams,
} from "../types";

export const PERIOD_PRESETS: {
  value: DashboardPeriodPreset;
  label: string;
}[] = [
  { value: "today", label: "اليوم" },
  { value: "7d", label: "آخر 7 أيام" },
  { value: "30d", label: "آخر 30 يوم" },
  { value: "90d", label: "آخر 90 يوم" },
  { value: "180d", label: "آخر 6 أشهر" },
  { value: "12m", label: "آخر 12 شهر" },
  { value: "all", label: "كل الفترة" },
];

interface DashboardPeriodFilterProps {
  value: DashboardQueryParams;
  onChange: (params: DashboardQueryParams) => void;
  disabled?: boolean;
}

function isCustom(params: DashboardQueryParams): boolean {
  return Boolean(params.from || params.to);
}

export function DashboardPeriodFilter({
  value,
  onChange,
  disabled,
}: DashboardPeriodFilterProps) {
  const [customFrom, setCustomFrom] = useState(value.from ?? "");
  const [customTo, setCustomTo] = useState(value.to ?? "");

  const custom = useMemo(() => isCustom(value), [value]);

  const selectPreset = (period: DashboardPeriodPreset) => {
    setCustomFrom("");
    setCustomTo("");
    onChange({ period });
  };

  const applyCustom = () => {
    onChange({
      from: customFrom || undefined,
      to: customTo || undefined,
    });
  };

  const clearCustom = () => {
    setCustomFrom("");
    setCustomTo("");
    onChange({ period: "all" });
  };

  return (
    <section
      aria-label="فلترة التقارير حسب الفترة"
      className="rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarRange className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">الفترة الزمنية للتقرير</h2>
            <p className="text-xs text-muted-foreground">
              اختر نطاقًا زمنيًا لكل الأرقام والرسوم البيانية
            </p>
          </div>
        </div>
        {custom && (
          <button
            type="button"
            onClick={clearCustom}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3" />
            مسح النطاق المخصص
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_PRESETS.map((preset) => {
          const active = !custom && value.period === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              disabled={disabled}
              onClick={() => selectPreset(preset.value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {active && <Check className="me-1 inline h-3 w-3" />}
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border/50 pt-4">
        <label className="space-y-1.5">
          <span className="text-xs text-muted-foreground">من</span>
          <AppInput
            type="date"
            value={customFrom}
            disabled={disabled}
            onChange={(event) => setCustomFrom(event.target.value)}
            className="h-9 w-40"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-muted-foreground">إلى</span>
          <AppInput
            type="date"
            value={customTo}
            disabled={disabled}
            onChange={(event) => setCustomTo(event.target.value)}
            className="h-9 w-40"
          />
        </label>
        <button
          type="button"
          disabled={disabled || (!customFrom && !customTo)}
          onClick={applyCustom}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CalendarRange className="h-3.5 w-3.5" />
          تطبيق النطاق
        </button>
      </div>
    </section>
  );
}