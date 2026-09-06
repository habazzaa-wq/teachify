"use client";

import { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  CircleX,
  MinusCircle,
  ChevronDown,
  Check,
  X,
  Lightbulb,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { DIFFICULTY_LABELS, REVIEW_STATUS_LABELS } from "../constants";
import type { ResultReviewItem } from "../types";
import type { ExamSessionQuestionType } from "@/features/exam-session/types";

interface ReviewQuestionCardProps {
  item: ResultReviewItem;
  index: number;
  revealCorrect: boolean;
}

const STATUS_STYLES: Record<
  ResultReviewItem["status"],
  { badge: string; icon: React.ComponentType<{ className?: string }>; iconClass: string; bar: string }
> = {
  correct: {
    badge: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30",
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    bar: "bg-emerald-500",
  },
  wrong: {
    badge: "bg-red-500/10 text-red-500 ring-red-500/30",
    icon: CircleX,
    iconClass: "text-red-500",
    bar: "bg-red-500",
  },
  skipped: {
    badge: "bg-muted text-muted-foreground ring-border/60",
    icon: MinusCircle,
    iconClass: "text-muted-foreground",
    bar: "bg-muted-foreground/50",
  },
};

function ReviewQuestionCardInner({ item, index, revealCorrect }: ReviewQuestionCardProps) {
  const [open, setOpen] = useState(false);
  const status = STATUS_STYLES[item.status];
  const StatusIcon = status.icon;
  const difficultyLabel = DIFFICULTY_LABELS[item.difficulty] ?? DIFFICULTY_LABELS.medium;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card/60 shadow-sm transition-colors",
        open ? "border-border" : "border-border/40 hover:border-border/70",
      )}
      id={`review-${item.examQuestionId}`}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              status.badge,
            )}
          >
            <StatusIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-foreground">
              سؤال {index + 1}
            </p>
            <p className="truncate text-xs font-semibold text-muted-foreground">
              {REVIEW_STATUS_LABELS[item.status]} · {item.points} درجة
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground sm:inline">
            {difficultyLabel}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Accent bar */}
      <div className={cn("h-0.5 w-full", status.bar, !open && "opacity-60")} />

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="border-t border-border/30 px-4 py-5 sm:px-5">
              <h3 className="text-base font-extrabold leading-relaxed text-foreground">
                {item.title}
              </h3>

              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}

              <div className="mt-5">
                <QuestionOptions
                  type={item.type}
                  content={item.content}
                  studentAnswer={item.studentAnswer}
                  correctAnswer={item.correctAnswer}
                  revealCorrect={revealCorrect}
                />
              </div>

              {revealCorrect && item.explanation && (
                <div className="mt-5 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-amber-600">الشرح</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              )}

              {item.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground/70" />
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionOptions({
  type,
  content,
  studentAnswer,
  correctAnswer,
  revealCorrect,
}: {
  type: ExamSessionQuestionType;
  content: ResultReviewItem["content"];
  studentAnswer: string[] | string | null;
  correctAnswer: string[] | string | null;
  revealCorrect: boolean;
}) {
  if (type === "true_false") {
    const selected = typeof studentAnswer === "string" ? studentAnswer : null;
    const correct = revealCorrect ? (typeof correctAnswer === "string" ? correctAnswer : null) : null;

    return (
      <div className="grid grid-cols-2 gap-3">
        {(["true", "false"] as const).map((value) => {
          const label = value === "true" ? "صح" : "خطأ";
          const isSelected = selected === value;
          const isCorrectValue = correct === value;

          return (
            <div
              key={value}
              className={cn(
                "flex h-16 items-center justify-center gap-2 rounded-2xl border-2 text-base font-extrabold",
                revealCorrect && isCorrectValue
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                  : isSelected
                    ? "border-red-500 bg-red-500/10 text-red-500"
                    : "border-border/60 bg-background/50 text-foreground/60",
                !isSelected && !(revealCorrect && isCorrectValue) && "opacity-80",
              )}
            >
              {revealCorrect && isCorrectValue && <Check className="h-5 w-5" />}
              {isSelected && !(revealCorrect && isCorrectValue) && <X className="h-5 w-5" />}
              {label}
            </div>
          );
        })}
      </div>
    );
  }

  const options = content.options ?? [];
  const selectedIds = Array.isArray(studentAnswer) ? studentAnswer : [];

  return (
    <div className="space-y-2.5">
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        const isCorrectOption = revealCorrect && option.correct === true;

        return (
          <div
            key={option.id}
            className={cn(
              "flex items-start gap-3 rounded-2xl border-2 p-4",
              isCorrectOption
                ? "border-emerald-500 bg-emerald-500/10"
                : isSelected
                  ? "border-red-500 bg-red-500/10"
                  : "border-border/60 bg-background/50",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                isCorrectOption
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : isSelected
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-border/70 bg-background",
              )}
            >
              {isCorrectOption ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : isSelected ? (
                <X className="h-3 w-3" strokeWidth={3} />
              ) : null}
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-foreground">
              {option.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const ReviewQuestionCard = memo(ReviewQuestionCardInner);

export { ReviewQuestionCard };
