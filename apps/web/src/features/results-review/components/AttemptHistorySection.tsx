"use client";

import { memo } from "react";
import { History, GraduationCap, Repeat, ChevronLeft, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui";
import type { AttemptHistoryItem } from "../types";
import { formatDurationLabel, formatPercent } from "../utils";

interface AttemptHistorySectionProps {
  items: AttemptHistoryItem[];
  currentAttemptId: string;
  examTitle: string;
  loading: boolean;
}

function AttemptHistorySectionInner({
  items,
  currentAttemptId,
  examTitle,
  loading,
}: AttemptHistorySectionProps) {
  const router = useRouter();

  function openAttempt(attemptId: string) {
    if (attemptId === currentAttemptId) return;
    router.push(`/exam-results/${attemptId}`);
  }

  return (
    <section className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <History className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-foreground">سجل المحاولات</h2>
          <p className="text-xs font-semibold text-muted-foreground">{examTitle}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2 rounded-2xl border border-border/40 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))
          : items.map((item) => {
              const isCurrent = item.attemptId === currentAttemptId;
              const percentage = formatPercent(item.percentage);

              return (
                <button
                  key={item.attemptId}
                  type="button"
                  onClick={() => openAttempt(item.attemptId)}
                  disabled={isCurrent}
                  className={cn(
                    "group w-full rounded-2xl border p-4 text-start transition-all duration-200",
                    isCurrent
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/40 bg-background/40 hover:border-primary/30 hover:bg-background/70",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          item.passed
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.passed ? <Trophy className="h-4.5 w-4.5" /> : <GraduationCap className="h-4.5 w-4.5" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-foreground">
                          المحاولة {item.attemptNumber}
                          {isCurrent && (
                            <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              الحالية
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-muted-foreground">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                              item.isPractice
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            {item.isPractice ? (
                              <>
                                <Repeat className="h-3 w-3" /> تدريبية
                              </>
                            ) : (
                              <>
                                <GraduationCap className="h-3 w-3" /> رسمية
                              </>
                            )}
                          </span>
                          {item.durationSeconds !== null && (
                            <span>{formatDurationLabel(item.durationSeconds)}</span>
                          )}
                          {item.submittedAt && (
                            <span className="text-muted-foreground/70">{item.submittedAt}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-end">
                        <p className="text-lg font-black tabular-nums text-foreground">
                          {percentage}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] font-bold",
                            item.passed ? "text-emerald-600" : "text-red-500",
                          )}
                        >
                          {item.passed ? "ناجح" : "غير ناجح"}
                        </p>
                      </div>
                      {!isCurrent && (
                        <ChevronLeft className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
      </div>
    </section>
  );
}

const AttemptHistorySection = memo(AttemptHistorySectionInner);

export { AttemptHistorySection };
