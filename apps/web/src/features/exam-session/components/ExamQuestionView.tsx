"use client";

import { memo } from "react";
import { Check, X, CheckCircle2, CircleX } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  ExamSessionAnswer,
  ExamSessionQuestion,
} from "../types";
import { QUESTION_TYPE_LABELS } from "../constants";
import { toggleMultiOption } from "../utils";

interface ExamQuestionViewProps {
  question: ExamSessionQuestion;
  index: number;
  total: number;
  answer: ExamSessionAnswer;
  onAnswerChange?: (answer: ExamSessionAnswer) => void;
  readOnly?: boolean;
}

function ExamQuestionViewInner({
  question,
  index,
  total,
  answer,
  onAnswerChange,
  readOnly = false,
}: ExamQuestionViewProps) {
  const options = question.content.options ?? [];

  const selectable = !readOnly && onAnswerChange;

  function handleSelect(optionId: string) {
    if (!selectable) return;

    if (question.type === "multiple_choice") {
      onAnswerChange!(toggleMultiOption(question, optionId));
      return;
    }

    onAnswerChange!([optionId]);
  }

  function handleTrueFalse(value: "true" | "false") {
    if (!selectable) return;
    onAnswerChange!(value);
  }

  return (
    <div className="space-y-5">
      {/* Question header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[rgb(var(--brand-primary-rgb)/0.1)] px-3 py-1 text-xs font-extrabold text-[var(--brand-primary)] ring-1 ring-[rgb(var(--brand-primary-rgb)/0.2)]">
            سؤال {index + 1} من {total}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold tabular-nums text-muted-foreground">
            {question.points} درجة
          </span>
        </div>

        <h2 className="mt-4 text-lg font-extrabold leading-relaxed text-foreground">
          {question.title}
        </h2>

        {question.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {question.description}
          </p>
        )}
      </div>

      {/* Choices */}
      {question.type === "true_false" ? (
        <div className="grid grid-cols-2 gap-3">
          {(["true", "false"] as const).map((value) => {
            const label = value === "true" ? "صح" : "خطأ";
            const selected = answer === value;
            const reveal = readOnly && question.isCorrect !== null;

            return (
              <button
                key={value}
                type="button"
                disabled={!selectable}
                onClick={() => handleTrueFalse(value)}
                aria-pressed={selected}
                className={cn(
                  "flex h-24 items-center justify-center gap-2 rounded-2xl border-2 text-base font-extrabold transition-all duration-200",
                  selectable && "cursor-pointer hover:-translate-y-0.5",
                  selected
                    ? "border-[var(--brand-primary)] bg-[rgb(var(--brand-primary-rgb)/0.1)] text-[var(--brand-primary)] shadow-lg shadow-[rgb(var(--brand-primary-rgb)/0.1)]"
                    : "border-border/60 bg-background/50 text-foreground/70 hover:border-[rgb(var(--brand-primary-rgb)/0.4)]",
                  readOnly &&
                    !selected &&
                    reveal &&
                    question.content.correct === value &&
                    "border-emerald-500 bg-emerald-500/10 text-emerald-600",
                  readOnly &&
                    selected &&
                    reveal &&
                    question.isCorrect &&
                    "border-emerald-500 bg-emerald-500/10 text-emerald-600",
                  readOnly &&
                    selected &&
                    reveal &&
                    !question.isCorrect &&
                    "border-red-500 bg-red-500/10 text-red-500",
                  !selectable && "opacity-70",
                )}
              >
                {readOnly && reveal && (
                  <>
                    {question.isCorrect && value === question.content.correct ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : value === question.content.correct ? (
                      <Check className="h-5 w-5" />
                    ) : selected ? (
                      <X className="h-5 w-5" />
                    ) : null}
                  </>
                )}
                {label}
              </button>
            );
          })}
        </div>
      ) : question.type === "numeric" ? (
        <div className="space-y-3">
          <input
            type="text"
            inputMode="decimal"
            dir="ltr"
            disabled={!selectable}
            value={typeof answer === "string" ? answer : ""}
            onChange={(event) => selectable && onAnswerChange!(event.target.value)}
            placeholder="أدخل الإجابة الرقمية"
            className={cn(
              "h-14 w-full rounded-2xl border-2 px-4 text-lg font-extrabold tabular-nums text-foreground outline-none transition-all duration-200 placeholder:text-base placeholder:font-semibold placeholder:text-muted-foreground/50",
              selectable && "cursor-text hover:border-[rgb(var(--brand-primary-rgb)/0.4)] focus:border-[var(--brand-primary)] focus:shadow-lg focus:shadow-[rgb(var(--brand-primary-rgb)/0.1)]",
              readOnly &&
                question.isCorrect !== null &&
                (question.isCorrect
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-red-500 bg-red-500/10"),
              !selectable && "opacity-80",
            )}
          />
          {readOnly &&
            question.isCorrect !== null &&
            question.content.correct !== undefined && (
              <p
                className={cn(
                  "text-sm font-extrabold",
                  question.isCorrect ? "text-emerald-600" : "text-red-500",
                )}
              >
                {question.isCorrect
                  ? "إجابة صحيحة"
                  : `الإجابة الصحيحة: ${question.content.correct}`}
              </p>
            )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {options.map((option) => {
            const selected = Array.isArray(answer) && answer.includes(option.id);
            const reveal = readOnly && option.correct !== undefined;

            return (
              <button
                key={option.id}
                type="button"
                disabled={!selectable}
                onClick={() => handleSelect(option.id)}
                aria-pressed={selected}
                className={cn(
                  "group relative flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-start transition-all duration-200",
                  selectable && "cursor-pointer hover:-translate-y-0.5",
                  selected
                    ? "border-[var(--brand-primary)] bg-[rgb(var(--brand-primary-rgb)/0.1)] shadow-lg shadow-[rgb(var(--brand-primary-rgb)/0.1)]"
                    : "border-border/60 bg-background/50 hover:border-[rgb(var(--brand-primary-rgb)/0.4)]",
                  readOnly &&
                    reveal &&
                    option.correct &&
                    "border-emerald-500 bg-emerald-500/10",
                  readOnly &&
                    selected &&
                    reveal &&
                    !option.correct &&
                    "border-red-500 bg-red-500/10",
                  !selectable && "opacity-80",
                )}
              >
                {/* Indicator */}
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    selected
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                      : "border-border/70 bg-background group-hover:border-[rgb(var(--brand-primary-rgb)/0.5)]",
                    readOnly &&
                      reveal &&
                      option.correct &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    readOnly &&
                      selected &&
                      reveal &&
                      !option.correct &&
                      "border-red-500 bg-red-500 text-white",
                  )}
                >
                  {selected &&
                    (question.type === "multiple_choice" ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    ))}
                  {!selected && readOnly && reveal && option.correct && (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  )}
                </span>

                <span className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-foreground">
                  {option.text}
                </span>

                {readOnly && reveal && (
                  <span className="mt-0.5 shrink-0">
                    {option.correct ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : selected ? (
                      <CircleX className="h-4 w-4 text-red-500" />
                    ) : null}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Hint for multiple selection */}
      {question.type === "multiple_choice" && !readOnly && (
        <p className="text-[11px] font-medium text-muted-foreground/70">
          يمكنك تحديد أكثر من خيار لهذا السؤال.
        </p>
      )}
    </div>
  );
}

const ExamQuestionView = memo(ExamQuestionViewInner);

export { ExamQuestionView };
export type { ExamQuestionViewProps };
