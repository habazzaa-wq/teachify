"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import type { ExamSessionQuestion } from "../types";
import { isAnswerEmpty } from "../utils";

interface ExamSessionSidebarProps {
  questions: ExamSessionQuestion[];
  answers: Record<string, ExamSessionQuestion["answer"]>;
  currentIndex: number;
  onNavigate: (index: number) => void;
}

function ExamSessionSidebarInner({
  questions,
  answers,
  currentIndex,
  onNavigate,
}: ExamSessionSidebarProps) {
  const answeredCount = questions.filter((question) => {
    const workspace = answers[question.examQuestionId];
    const value = workspace !== undefined ? workspace : question.answer;
    return !isAnswerEmpty(value, question.type);
  }).length;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-foreground">لوحة الأسئلة</h3>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold tabular-nums text-muted-foreground">
          {answeredCount} / {questions.length} مُجاب
        </span>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-5 lg:grid-cols-4">
        {questions.map((question, index) => {
          const workspace = answers[question.examQuestionId];
          const value = workspace !== undefined ? workspace : question.answer;
          const answered = !isAnswerEmpty(value, question.type);
          const isCurrent = index === currentIndex;

          return (
            <button
              key={question.examQuestionId}
              type="button"
              onClick={() => onNavigate(index)}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex h-10 items-center justify-center rounded-xl text-xs font-extrabold tabular-nums transition-all duration-150",
                isCurrent
                  ? "scale-105 bg-studio-accent text-studio-accent-fg shadow-lg shadow-studio-overlay"
                  : answered
                    ? "bg-studio-success/15 text-studio-success ring-1 ring-studio-success/30 hover:bg-studio-success/25"
                    : "bg-muted/60 text-muted-foreground ring-1 ring-border/40 hover:bg-muted",
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/30 pt-3">
        <LegendDot className="bg-studio-success/15 text-studio-success ring-studio-success/30" label="مُجاب" />
        <LegendDot className="bg-studio-accent text-studio-accent-fg ring-studio-accent" label="الحالي" />
        <LegendDot className="bg-muted text-muted-foreground ring-border/40" label="بدون إجابة" />
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
      <span className={cn("h-3 w-3 rounded-md ring-1", className)} />
      {label}
    </span>
  );
}

const ExamSessionSidebar = memo(ExamSessionSidebarInner);

export { ExamSessionSidebar };
