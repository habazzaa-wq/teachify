"use client";

import { memo } from "react";
import { AlertTriangle, Send } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogDescription,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogTitle,
} from "@/components/ui/AppDialog";
import { AppButton } from "@/components/ui/AppButton";
import { CTA_GRADIENT } from "@/features/public-course/brand";

interface ExamSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredCount: number;
  total: number;
  isOfficial: boolean;
  submitting: boolean;
  onConfirm: () => void;
}

function ExamSubmitDialogInner({
  open,
  onOpenChange,
  answeredCount,
  total,
  isOfficial,
  submitting,
  onConfirm,
}: ExamSubmitDialogProps) {
  const unanswered = total - answeredCount;

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-md gap-0 overflow-hidden !rounded-3xl !border-[rgb(var(--brand-primary-rgb)/0.2)] p-0 sm:max-w-md">
        <div className="flex items-start gap-3 border-b border-border/40 bg-muted/20 px-6 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/25">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <AppDialogHeader>
            <AppDialogTitle className="text-lg font-extrabold text-foreground">
              تأكيد تسليم الامتحان
            </AppDialogTitle>
            <AppDialogDescription className="text-sm font-semibold text-foreground/70">
              بعد التسليم لا يمكنك تعديل إجاباتك.
            </AppDialogDescription>
          </AppDialogHeader>
        </div>

        <div className="space-y-3 px-6 py-5">
          <SummaryRow label="الأسئلة المُجابة" value={`${answeredCount} من ${total}`} />
          <SummaryRow
            label="الأسئلة بدون إجابة"
            value={unanswered === 0 ? "لا يوجد" : String(unanswered)}
            danger={unanswered > 0}
          />
          <p className="flex items-center gap-2 pt-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {isOfficial
              ? "هذه محاولتك الرسمية وتُحسب نتيجتها في سجلك النهائي."
              : "هذه محاولة تدريبية ولن تُحسب نتيجتها في سجلك الرسمي."}
          </p>
        </div>

        <AppDialogFooter className="gap-2 border-t border-border/40 bg-muted/20 px-6 py-4">
          <AppButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="flex-1 text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            مواصلة الحل
          </AppButton>
          <AppButton
            onClick={onConfirm}
            loading={submitting}
            className="flex-1 border-0 text-white shadow-lg shadow-[rgb(var(--brand-primary-rgb)/0.3)]"
            style={{ background: CTA_GRADIENT }}
          >
            <Send className="h-4 w-4" />
            تأكيد التسليم
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

function SummaryRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-3 ring-1 ring-border/40">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span
        className={
          danger
            ? "text-sm font-extrabold text-red-500"
            : "text-sm font-extrabold tabular-nums text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

const ExamSubmitDialog = memo(ExamSubmitDialogInner);

export { ExamSubmitDialog };
