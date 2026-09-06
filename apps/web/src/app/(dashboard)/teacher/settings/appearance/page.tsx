"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, RotateCcw, Palette } from "lucide-react";
import {
  AppPage, AppPageHeader, AppDivider, AppButton,
  AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent,
} from "@/components/ui";
import { useDashboardThemeStore } from "@/stores/dashboard-theme.store";
import { generateThemeColors } from "@/lib/color";
import { cn } from "@/lib/cn";

const PRESET_COLORS = [
  { primary: "#4F46E5", secondary: "#F1F5F9", label: "كحلي" },
  { primary: "#059669", secondary: "#F0FDF4", label: "أخضر" },
  { primary: "#DC2626", secondary: "#FEF2F2", label: "أحمر" },
  { primary: "#D97706", secondary: "#FFFBEB", label: "ذهبي" },
  { primary: "#7C3AED", secondary: "#F5F3FF", label: "بنفسجي" },
  { primary: "#0891B2", secondary: "#ECFEFF", label: "فيروزي" },
  { primary: "#E11D48", secondary: "#FFF1F2", label: "وردي" },
  { primary: "#2563EB", secondary: "#EFF6FF", label: "أزرق" },
];

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={label}
          />
          <div
            className="h-10 w-10 rounded-lg border-2 border-border shadow-sm cursor-pointer"
            style={{ backgroundColor: value }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          className="flex h-10 w-28 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          dir="ltr"
        />
      </div>
    </div>
  );
}

function AppearancePage() {
  const { primaryColor, secondaryColor, isActive, setColors, resetColors } = useDashboardThemeStore();

  const [primary, setPrimary] = useState(primaryColor);
  const [secondary, setSecondary] = useState(secondaryColor);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrimary(primaryColor);
    setSecondary(secondaryColor);
  }, [primaryColor, secondaryColor]);

  const handleSave = useCallback(() => {
    setColors(primary, secondary);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [primary, secondary, setColors]);

  const handleReset = useCallback(() => {
    resetColors();
    setPrimary("#4F46E5");
    setSecondary("#F1F5F9");
  }, [resetColors]);

  const handlePreset = useCallback((p: string, s: string) => {
    setPrimary(p);
    setSecondary(s);
  }, []);

  const preview = generateThemeColors(primary, secondary, false);

  return (
    <AppPage maxWidth="lg">
      <AppPageHeader
        title="مظهر لوحة التحكم"
        description="اختر الألوان الأساسية والثانوية لشكل لوحة التحكم"
      />
      <AppDivider className="mb-8" />

      <div className="space-y-8">
        {/* Color Pickers */}
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>الألوان المخصصة</AppCardTitle>
            <AppCardDescription>
              اختر لونين أساسي وثانوي لتلوين لوحة التحكم بالكامل
            </AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="space-y-6">
            <ColorPicker
              label="اللون الأساسي"
              value={primary}
              onChange={setPrimary}
            />
            <ColorPicker
              label="اللون الثانوي"
              value={secondary}
              onChange={setSecondary}
            />
          </AppCardContent>
        </AppCard>

        {/* Presets */}
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>باقات ألوان جاهزة</AppCardTitle>
            <AppCardDescription>اختر من الباقات الجاهزة للبدء السريع</AppCardDescription>
          </AppCardHeader>
          <AppCardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset.primary, preset.secondary)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all hover:shadow-md",
                    primary === preset.primary && secondary === preset.secondary
                      ? "border-studio-accent ring-2 ring-studio-accent/30"
                      : "border-transparent hover:border-border",
                  )}
                >
                  <div className="flex gap-1.5">
                    <div
                      className="h-8 w-8 rounded-lg shadow-sm"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="h-8 w-8 rounded-lg shadow-sm"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <span className="text-xs font-medium">{preset.label}</span>
                </button>
              ))}
            </div>
          </AppCardContent>
        </AppCard>

        {/* Live Preview */}
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>معاينة حية</AppCardTitle>
            <AppCardDescription>شكل لوحة التحكم بعد التطبيق</AppCardDescription>
          </AppCardHeader>
          <AppCardContent>
            <div className="overflow-hidden rounded-xl border border-studio-border">
              {/* Preview header */}
              <div
                className="flex h-12 items-center gap-2 border-b px-4"
                style={{ backgroundColor: preview["--tenant-header"], borderColor: preview["--tenant-border"] }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-md"
                    style={{ backgroundColor: preview["--studio-accent"] }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: preview["--tenant-fg"] }}
                  >
                    الأكاديمية
                  </span>
                </div>
                <div className="flex-1" />
                <div className="flex gap-1.5">
                  <div className="h-6 w-6 rounded-full" style={{ backgroundColor: preview["--studio-soft"] }} />
                  <div className="h-6 w-6 rounded-full" style={{ backgroundColor: preview["--studio-accent"] }} />
                </div>
              </div>

              <div className="flex" style={{ backgroundColor: preview["--studio-bg"] }}>
                {/* Preview sidebar */}
                <div
                  className="flex w-20 flex-col gap-2 p-3"
                  style={{ backgroundColor: preview["--studio-glass-sidebar"] }}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-2 rounded"
                      style={{ backgroundColor: i === 1 ? preview["--studio-accent"] : preview["--studio-soft"] }}
                    />
                  ))}
                </div>

                {/* Preview content */}
                <div className="flex-1 space-y-3 p-4">
                  <div
                    className="h-3 w-1/2 rounded"
                    style={{ backgroundColor: preview["--tenant-fg"] }}
                  />
                  <div
                    className="grid grid-cols-3 gap-3"
                  >
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-lg p-4"
                        style={{ backgroundColor: preview["--studio-surface"], borderColor: preview["--studio-border"], borderWidth: 1 }}
                      >
                        <div
                          className="mb-2 h-3 w-1/2 rounded"
                          style={{ backgroundColor: preview["--studio-muted"] }}
                        />
                        <div
                          className="h-2 w-3/4 rounded"
                          style={{ backgroundColor: preview["--studio-muted"] }}
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    className="h-10 w-24 rounded-lg"
                    style={{ backgroundColor: preview["--studio-accent"] }}
                  />
                </div>
              </div>
            </div>
          </AppCardContent>
        </AppCard>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          <AppButton variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 ml-1" /> إعادة تعيين
          </AppButton>
          <AppButton onClick={handleSave} loading={saved}>
            <Save className="h-4 w-4 ml-1" /> {saved ? "تم الحفظ" : "حفظ التغييرات"}
          </AppButton>
        </div>
      </div>
    </AppPage>
  );
}

export default AppearancePage;
