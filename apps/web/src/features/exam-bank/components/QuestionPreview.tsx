"use client";

import { StudioSurfaceCard, StudioChip, StudioStatusChip } from "@/components/studio";
import { cn } from "@/lib/cn";
import {
  QUESTION_TYPE_CONFIG,
  DIFFICULTY_CONFIG,
} from "@/features/exam-bank/constants";
import type { Question, QuestionStatus } from "@/features/exam-bank/types";

type StudioStatus = "active" | "pending" | "archived";

function statusToStudioStatus(status: QuestionStatus): StudioStatus {
  if (status === "published") return "active";
  if (status === "draft") return "pending";
  return "archived";
}

function difficultyVariant(color: string) {
  if (color === "success") return "success" as const;
  if (color === "warning") return "warning" as const;
  return "danger" as const;
}

export function QuestionPreview({ question }: { question: Question }) {
  const typeCfg = QUESTION_TYPE_CONFIG[question.type];
  const TypeIcon = typeCfg.icon;
  const difficultyCfg = DIFFICULTY_CONFIG[question.difficulty];
  const isScanned = question.questionFormat === "image" && question.scanUrl;

  return (
    <StudioSurfaceCard padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StudioChip variant="accent" size="sm" className="gap-1">
          <TypeIcon className="h-3 w-3" />
          {typeCfg.label}
        </StudioChip>
        <StudioChip variant={difficultyVariant(difficultyCfg.color)} size="sm">
          {difficultyCfg.label}
        </StudioChip>
        <StudioStatusChip status={statusToStudioStatus(question.status)} />
        <StudioChip variant="default" size="sm">
          {question.points} نقطة
        </StudioChip>
        {isScanned && (
          <StudioChip variant="success" size="sm">
            سؤال مصوّر
          </StudioChip>
        )}
        {question.category?.name && (
          <StudioChip variant="default" size="sm">
            {question.category.name}
          </StudioChip>
        )}
      </div>

      <div>
        {isScanned && question.scanUrl ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl border border-studio-border">
              <img
                src={question.scanUrl}
                alt="السؤال المصوّر"
                className="max-h-[300px] w-full object-contain"
              />
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-base font-semibold text-studio-fg">{question.title}</h3>
            {question.description && (
              <p className="mt-1 text-sm text-studio-fg-muted">{question.description}</p>
            )}
          </>
        )}
      </div>

      <div className="border-t border-studio-border pt-4">
        <PreviewContent question={question} />
      </div>

      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {question.tags.map((t) => (
            <span key={t} className="text-xs text-studio-fg-muted">
              #{t}
            </span>
          ))}
        </div>
      )}
    </StudioSurfaceCard>
  );
}

function PreviewContent({ question }: { question: Question }) {
  const { type, content } = question;
  const c = content ?? {};

  switch (type) {
    case "single_choice":
    case "multiple_choice": {
      const options = c.options ?? [];
      return (
        <ul className="space-y-2">
          {options.map((o) => (
            <li
              key={o.id}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-2.5 text-sm",
                o.correct
                  ? "border-studio-success bg-studio-success/10 text-studio-fg"
                  : "border-studio-border bg-studio-soft/40 text-studio-fg-muted",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]",
                  o.correct
                    ? "border-studio-success bg-studio-success text-white"
                    : "border-studio-fg-subtle",
                  type === "multiple_choice" && "rounded-md",
                )}
              >
                {o.correct ? "✓" : ""}
              </span>
              <span className="flex-1">
                {o.text || <span className="text-studio-fg-subtle">—</span>}
                {o.explanation && (
                  <span className="mt-1 block text-xs text-studio-fg-muted">
                    {o.explanation}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    case "true_false":
      return (
        <div className="space-y-2">
          {(["true", "false"] as const).map((v) => (
            <div
              key={v}
              className={cn(
                "rounded-lg border p-2.5 text-sm",
                c.correct === v
                  ? "border-studio-success bg-studio-success/10"
                  : "border-studio-border bg-studio-soft/40 text-studio-fg-muted",
              )}
            >
              {v === "true" ? "صح" : "خطأ"}
              {c.correct === v && " ✓"}
            </div>
          ))}
          {c.trueFalseExplanation && (
            <p className="text-xs text-studio-fg-muted">{c.trueFalseExplanation}</p>
          )}
        </div>
      );

    case "short_answer":
      return (
        <div className="space-y-1.5">
          {(c.acceptedAnswers ?? []).map((a, i) => (
            <div
              key={i}
              className="rounded-lg border border-studio-border bg-studio-soft/40 px-3 py-2 text-sm text-studio-fg"
            >
              {a}
            </div>
          ))}
          {c.caseSensitive && (
            <p className="text-xs text-studio-fg-muted">مطابقة حساسة لحالة الأحرف</p>
          )}
        </div>
      );

    case "essay":
      return (
        <div className="space-y-1.5 text-sm text-studio-fg-muted">
          <p>سؤال مقالي — يُقيَّم يدوياً.</p>
          {c.rubric && <p className="text-studio-fg">بطاقة التقييم: {c.rubric}</p>}
          <p className="text-xs">
            {c.minLength != null && `الحد الأدنى: ${c.minLength} حرف • `}
            {c.maxLength != null && `الحد الأقصى: ${c.maxLength} حرف • `}
            {c.attachmentAllowed && "المرفقات مسموحة"}
          </p>
        </div>
      );

    case "fill_blank": {
      const text = c.fillText ?? "";
      const blanks = c.fillAnswers ?? [];
      const parts = text.split("__BLANK__");
      return (
        <div className="space-y-2 text-sm text-studio-fg">
          <p className="leading-relaxed">
            {parts.map((part, i) => (
              <span key={i}>
                {part}
                {i < blanks.length && (
                  <span className="mx-1 inline-flex items-center gap-1 rounded-md bg-studio-accent-soft px-2 py-0.5 text-xs font-medium text-studio-accent">
                    {blanks[i]?.join(" / ") || "..."}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>
      );
    }

    case "matching": {
      const pairs = c.pairs ?? [];
      return (
        <ul className="space-y-2">
          {pairs.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-studio-border bg-studio-soft/40 px-3 py-2 text-sm"
            >
              <span className="text-studio-fg">{p.left || "—"}</span>
              <span className="text-studio-fg-subtle">↔</span>
              <span className="text-studio-fg">{p.right || "—"}</span>
            </li>
          ))}
        </ul>
      );
    }

    case "ordering": {
      const items = c.items ?? [];
      return (
        <ol className="space-y-2">
          {items.map((it, i) => (
            <li
              key={it.id}
              className="flex items-center gap-2 rounded-lg border border-studio-border bg-studio-soft/40 px-3 py-2 text-sm"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-studio-soft text-xs font-medium text-studio-fg-muted">
                {i + 1}
              </span>
              <span className="text-studio-fg">{it.text || "—"}</span>
            </li>
          ))}
        </ol>
      );
    }

    case "numeric":
      return (
        <div className="space-y-1.5 text-sm text-studio-fg">
          <p>
            الإجابة:{" "}
            <span className="font-semibold">{c.answer ?? "—"}</span>
            {c.unit ? ` ${c.unit}` : ""}
          </p>
          {c.tolerance != null && (
            <p className="text-xs text-studio-fg-muted">هامش الخطأ: {c.tolerance}</p>
          )}
        </div>
      );

    case "file_upload":
      return (
        <p className="text-sm text-studio-fg-muted">
          سيتم تقييم المرفق يدوياً من قبل المصحح.
        </p>
      );

    case "coding":
      return (
        <div className="space-y-2 text-sm text-studio-fg-muted">
          <p>محرر الكود وقارئ الكود سيتم دمجه لاحقاً.</p>
          {c.language && <p>اللغة: {c.language}</p>}
          {c.starterCode && (
            <pre className="overflow-x-auto rounded-lg bg-studio-soft p-3 text-xs text-studio-fg">
              {c.starterCode}
            </pre>
          )}
        </div>
      );

    default:
      return null;
  }
}
