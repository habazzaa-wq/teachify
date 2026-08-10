"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Clock, Repeat, AlertTriangle, Play, Loader2 } from "lucide-react";
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
import { useStartExam } from "@/features/exam-session/hooks";
import { EXAM_WARNINGS } from "../constants";
import { formatExamDuration } from "../utils";
import type { ExamEntry } from "../types";

interface StartExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: ExamEntry;
  lessonId: string;
}

function StartExamDialogInner({
  open,
  onOpenChange,
  entry,
  lessonId,
}: StartExamDialogProps) {
  const router = useRouter();
  const startExam = useStartExam();
  const [error, setError] = useState<string | null>(null);

  const duration = formatExamDuration(entry.duration);
  const attempts = entry.remainingAttempts;

  function handleStart() {
    setError(null);
    startExam.mutate(lessonId, {
      onSuccess: (session) => {
        onOpenChange(false);
        router.push(`/exam-sessions/${session.attempt.id}`);
      },
      onError: (err) => {
        const message =
          (err as { message?: string } | null)?.message ??
          "تعذر بدء الامتحان. يرجى المحاولة مرة أخرى.";
        setError(message);
      },
    });
  }

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-md gap-0 overflow-hidden !rounded-3xl !border-[var(--brand-primary)] p-0 sm:max-w-md">
        {/* Accent header */}
        <div className="flex flex-col items-center gap-3 px-6 py-7 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--brand-primary)] bg-[var(--brand-primary)] shadow-lg shadow-[rgba(0,0,0,0.1)]">
            <ClipboardCheck className="h-8 w-8 text-[var(--brand-primary-contrast)]" strokeWidth={1.8} />
          </div>
          <AppDialogHeader>
            <AppDialogTitle className="text-xl font-extrabold text-foreground">
              بدء الامتحان
            </AppDialogTitle>
            <AppDialogDescription className="text-sm font-semibold text-foreground/70">
              {entry.examTitle}
            </AppDialogDescription>
          </AppDialogHeader>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-center gap-3 border-b border-border/40 px-6 py-4">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-xs font-bold text-foreground/80 ring-1 ring-border/50">
            <Clock className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            {duration}
          </span>
          {attempts !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-xs font-bold text-foreground/80 ring-1 ring-border/50">
              <Repeat className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              {attempts === 1
                ? "محاولة واحدة متبقية"
                : `${attempts} محاولات متبقية`}
            </span>
          )}
        </div>

        {/* Warnings */}
        <div className="space-y-2.5 px-6 py-5">
          <p className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            قبل البدء، يرجى مراعاة ما يلي:
          </p>
          <ul className="space-y-2">
            {EXAM_WARNINGS.map((warning) => (
              <li
                key={warning}
                className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                {warning}
              </li>
            ))}
          </ul>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 ring-1 ring-red-500/20">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <AppDialogFooter className="gap-2 border-t border-border/40 bg-muted/20 px-6 py-4">
          <AppButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={startExam.isPending}
            className="flex-1 text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            إلغاء
          </AppButton>
          <AppButton
            onClick={handleStart}
            loading={startExam.isPending}
            className="flex-1 border-0 text-white shadow-lg shadow-[rgba(0,0,0,0.3)]"
            style={{ background: CTA_GRADIENT }}
          >
            {startExam.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ البدء...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                بدء المحاولة
              </>
            )}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

const StartExamDialog = memo(StartExamDialogInner);

export { StartExamDialog };
export type { StartExamDialogProps };
