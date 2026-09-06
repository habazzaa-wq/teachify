"use client";

import {
  AppDialog,
  AppDialogContent,
  AppDialogDescription,
  AppDialogHeader,
  AppDialogTitle,
} from "@/components/ui/AppDialog";
import { AppButton } from "@/components/ui/AppButton";
import { asInstallIosSteps } from "@/components/pwa/install-instructions";

export interface InstallInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whether the browser is iOS Safari (no native install prompt). */
  isIos: boolean;
  /** Tenant brand accent used for the step-number chips. */
  accentColor: string;
}

/**
 * Manual "Add to Home Screen" instructions shown when the browser exposes no
 * native install prompt (notably iOS Safari). Written generically enough to
 * apply to iOS Safari and any other browser; a generic fallback line covers
 * browsers we do not enumerate specifically.
 */
export function InstallInstructionsDialog({
  open,
  onOpenChange,
  isIos,
  accentColor,
}: InstallInstructionsDialogProps) {
  const steps = asInstallIosSteps(isIos);

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-sm">
        <AppDialogHeader>
          <AppDialogTitle className="text-center text-base">
            إضافة المنصة إلى الشاشة الرئيسية
          </AppDialogTitle>
          <AppDialogDescription className="text-center text-xs leading-relaxed">
            {isIos
              ? "من متصفح Safari، اتبع الخطوات التالية ليظهر التطبيق على جهازك كأيقونة مستقلة."
              : "إذا لم يظهر زر التثبيت في متصفحك، استخدم خيار التثبيت أو «إضافة إلى الشاشة الرئيسية» المتاح في متصفحك."}
          </AppDialogDescription>
        </AppDialogHeader>

        <ol className="my-1 flex flex-col gap-2">
          {steps.map((step, index) => (
            <li
              key={index}
              className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 p-2.5"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {index + 1}
              </span>
              <span className="text-[13px] leading-relaxed text-foreground/85">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div className="rounded-lg border border-dashed border-border bg-background/60 p-2.5 text-center text-[11px] leading-relaxed text-muted-foreground">
          {isIos
            ? "بعد الإضافة، ستجد أيقونة المنصة على شاشتك الرئيسية ويمكن فتحها مباشرة من الجهاز."
            : "في المتصفحات الأخرى قد يختلف الموضع قليلاً، ابحث عن خيار «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» في قائمة المتصفح."}
        </div>

        <AppButton onClick={() => onOpenChange(false)} className="w-full">
          فهمت
        </AppButton>
      </AppDialogContent>
    </AppDialog>
  );
}