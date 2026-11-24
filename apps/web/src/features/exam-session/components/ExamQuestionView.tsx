"use client";

import { memo } from "react";
import { Check, X, CheckCircle2, CircleX, ScanLine } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  ExamSessionAnswer,
  ExamSessionQuestion,
} from "../types";
import { QUESTION_TYPE_LABELS } from "../constants";
import { toggleMultiOption } from "../utils";
import { ImageAnswerCapture } from "../image-cap/components/ImageAnswerCapture";
import { ImageQuestionContent } from 
"@/features/exam-bank/components/ImageQuestionContent";
import {
  StructuredQuestionContent,
  parseQuestionDocument,
} from "@/components/structured-question";

interface ExamQuestionViewProps {
  question: ExamSessionQuestion;
  index: number;
  total: number;
  answer: ExamSessionAnswer;
  onAnswerChange?: (answer: ExamSessionAnswer) => void;
  readOnly?: boolean;
  attemptId?: string;
  imageCaptureDisabled?: boolean;
  onImageBusyChange?: (examQuestionId: string, busy: boolean) => void;
  onImageAnsweredChange?: (examQuestionId: string, answered: boolean) => void;
}

function ExamQuestionViewInner({
  question,
  index,
  total,
  answer,
  onAnswerChange,
  readOnly = false,
  attemptId,
  imageCaptureDisabled = false,
  onImageBusyChange,
  onImageAnsweredChange,
}: ExamQuestionViewProps) {
  const options = question.content.options ?? [];
  const structuredDoc =
    question.questionFormat === "structured"
      ? parseQuestionDocument(question.contentDocument)
      : null;

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
          <span className="inline-flex items-center rounded-full bg-studio-accent px-3 py-1 text-xs font-extrabold text-studio-accent-fg ring-1 ring-studio-accent">
            سؤال {index + 1} من {total}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold tabular-nums text-muted-foreground">
            {question.points} درجة
          </span>
          {question.questionFormat === "image" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-studio-success/15 px-2.5 py-1 text-[11px] font-bold text-studio-success">
              <ScanLine className="h-3 w-3" />
              سؤال مصوّر
            </span>
          )}
        </div>

        {structuredDoc ? (
          <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-4">
            <StructuredQuestionContent document={structuredDoc} />
          </div>
        ) : question.questionFormat === "image" && question.scanUrl ? (
          <div className="mt-4">
            <ImageQuestionContent
              src={question.scanUrl}
              alt={`صورة السؤال ${index + 1}`}
              maxHeight={500}
              showControls={true}
            />
          </div>
        ) : (
          <>
            {question.title && (
              <h2 className="mt-4 text-lg font-extrabold leading-relaxed text-foreground">
                {question.title}
              </h2>
            )}
            {question.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {question.description}
              </p>
            )}
          </>
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
                    ? "border-studio-accent bg-studio-accent text-studio-accent-fg shadow-lg shadow-studio-overlay"
                    : "border-border/60 bg-background/50 text-foreground/70 hover:border-studio-accent",
                  readOnly &&
                    !selected &&
                    reveal &&
                    question.content.correct === value &&
                    "border-studio-success bg-studio-success/15 text-studio-success",
                  readOnly &&
                    selected &&
                    reveal &&
                    question.isCorrect &&
                    "border-studio-success bg-studio-success/15 text-studio-success",
                  readOnly &&
                    selected &&
                    reveal &&
                    !question.isCorrect &&
                    "border-studio-danger bg-studio-danger/15 text-studio-danger",
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
              selectable && "cursor-text hover:border-studio-accent focus:border-studio-accent focus:shadow-lg focus:shadow-studio-overlay",
              readOnly &&
                question.isCorrect !== null &&
                (question.isCorrect
                  ? "border-studio-success bg-studio-success/15"
                  : "border-studio-danger bg-studio-danger/15"),
              !selectable && "opacity-80",
            )}
          />
          {readOnly &&
            question.isCorrect !== null &&
            question.content.correct !== undefined && (
              <p
                className={cn(
                  "text-sm font-extrabold",
                  question.isCorrect ? "text-studio-success" : "text-studio-danger",
                )}
              >
                {question.isCorrect
                  ? "إجابة صحيحة"
                  : `الإجابة الصحيحة: ${question.content.correct}`}
              </p>
            )}
        </div>
      ) : question.type === "essay" || question.type === "short_answer" ? (
        <div className="space-y-3">
          <textarea
            disabled={!selectable}
            value={typeof answer === "string" ? answer : ""}
            onChange={(event) => selectable && onAnswerChange!(event.target.value)}
            placeholder={question.type === "essay" ? "اكتب إجابتك المقالية هنا..." : "اكتب إجابتك هنا..."}
            rows={6}
            className={cn(
              "w-full rounded-2xl border-2 px-4 py-3 text-sm font-semibold leading-relaxed text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/50 resize-y",
              selectable && "cursor-text hover:border-studio-accent focus:border-studio-accent focus:shadow-lg focus:shadow-studio-overlay",
              readOnly &&
                question.isCorrect !== null &&
                (question.isCorrect
                  ? "border-studio-success bg-studio-success/15"
                  : "border-studio-danger bg-studio-danger/15"),
              !selectable && "opacity-80",
            )}
          />
          {readOnly && question.type === "essay" && (
            <p className="text-[11px] font-medium text-muted-foreground/70">
              هذه الإجابة تحتاج مراجعة يدوية من المعلّم.
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
                    ? "border-studio-accent bg-studio-accent text-studio-accent-fg shadow-lg shadow-studio-overlay"
                    : "border-border/60 bg-background/50 hover:border-studio-accent",
                  readOnly &&
                    reveal &&
                    option.correct &&
                    "border-studio-success bg-studio-success/15",
                  readOnly &&
                    selected &&
                    reveal &&
                    !option.correct &&
                    "border-studio-danger bg-studio-danger/15",
                  !selectable && "opacity-80",
                )}
              >
                {/* Indicator */}
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    selected
                      ? "border-studio-accent bg-studio-accent text-studio-accent-fg"
                      : "border-border/70 bg-background group-hover:border-studio-accent",
                    readOnly &&
                      reveal &&
                      option.correct &&
                      "border-studio-success bg-studio-success text-studio-success-foreground",
                    readOnly &&
                      selected &&
                      reveal &&
                      !option.correct &&
                      "border-studio-danger bg-studio-danger text-studio-danger-foreground",
                  )}
                >
                  {selected &&
                    (question.type === "multiple_choice" ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-studio-accent-fg" />
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
                      <CheckCircle2 className="h-4 w-4 text-studio-success" />
                    ) : selected ? (
                      <CircleX className="h-4 w-4 text-studio-danger" />
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

      {question.type === "essay" || question.type === "short_answer" ? (
        !readOnly && attemptId ? (
          <ImageAnswerCapture
            attemptId={attemptId}
            examQuestionId={question.examQuestionId}
            disabled={imageCaptureDisabled}
            onBusyChange={onImageBusyChange}
            onAnsweredChange={onImageAnsweredChange}
          />
        ) : null
      ) : null}
    </div>
  );
}

const ExamQuestionView = memo(ExamQuestionViewInner);

export { ExamQuestionView };
export type { ExamQuestionViewProps };
