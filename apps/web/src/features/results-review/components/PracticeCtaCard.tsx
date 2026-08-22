"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Repeat, TrendingUp, TrendingDown, Minus, ArrowLeft, CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppButton } from "@/components/ui";
import { useStartPractice } from "../hooks";
import type { PracticeSource } from "../types";
import { formatPercent } from "../utils";

interface PracticeCtaCardProps {
  attemptId: string;
  canPractice: boolean;
  wrongCount: number;
  practiceSource: PracticeSource | null;
  currentPercentage: number | null;
}

function PracticeCtaCardInner({
  attemptId,
  canPractice,
  wrongCount,
  practiceSource,
  currentPercentage,
}: PracticeCtaCardProps) {
  const router = useRouter();
  const startPractice = useStartPractice();

  function handleStart() {
    startPractice.mutate(attemptId, {
      onSuccess: (session) => {
        router.push(`/exam-sessions/${session.attempt.id}`);
      },
    });
  }

  const delta =
    practiceSource && currentPercentage !== null && practiceSource.percentage !== null
      ? Math.round((currentPercentage - practiceSource.percentage) * 10) / 10
      : null;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-6",
        canPractice
          ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-primary/5"
          : "border-border/40 bg-card/60",
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              canPractice ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground",
            )}
          >
            <Repeat className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-foreground">تدرب على إجاباتك الخاطئة</h2>
            <p className="mt-1 max-w-md text-xs font-semibold leading-relaxed text-muted-foreground">
              {canPractice
                ? `أعد حل ${wrongCount} سؤالًا خاطئًا لتحسين نتيجتك. هذه المحاولة تدريبية ولا تحتسب ضمن محاولاتك الرسمية.`
                : "لا توجد أسئلة خاطئة في هذه المحاولة. يمكنك العودة إلى الاختبار الرسمي في أي وقت."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
          {practiceSource && delta !== null && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-4 py-3",
                delta > 0
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : delta < 0
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-border/50 bg-background/60",
              )}
            >
              <span className="text-xs font-bold text-muted-foreground">قارن مع السابق</span>
              <span className="text-sm font-black tabular-nums text-foreground">
                {formatPercent(practiceSource.percentage)}٪
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black tabular-nums",
                  delta > 0
                    ? "bg-emerald-500/15 text-emerald-600"
                    : delta < 0
                      ? "bg-red-500/15 text-red-500"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {delta > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : delta < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                {delta > 0 ? "+" : ""}
                {delta}٪
              </span>
            </div>
          )}

          {canPractice && (
            <AppButton
              size="lg"
              onClick={handleStart}
              loading={startPractice.isPending}
              disabled={wrongCount === 0}
              className="w-full rounded-2xl bg-[#BF6D58] px-6 text-sm font-extrabold text-white shadow-lg shadow-[#BF6D58]/30 hover:bg-[#B0604C] sm:w-auto"
            >
              ابدأ التدريب
              <ArrowLeft className="h-4 w-4" />
            </AppButton>
          )}
        </div>
      </div>

      {startPractice.isError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs font-semibold text-red-500">
          <CircleAlert className="h-4 w-4 shrink-0" />
          تعذّر بدء محاولة التدريب. حاول مرة أخرى لاحقًا.
        </div>
      )}
    </section>
  );
}

const PracticeCtaCard = memo(PracticeCtaCardInner);

export { PracticeCtaCard };
