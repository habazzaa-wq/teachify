"use client";

import { memo, useMemo, useState } from "react";
import { CheckCircle2, CircleX, MinusCircle, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppSearchInput } from "@/components/ui";
import { AppEmptyState } from "@/components/ui";
import { REVIEW_FILTERS } from "../constants";
import type { ResultReviewItem, ReviewFilter } from "../types";
import { ReviewQuestionCard } from "./ReviewQuestionCard";

interface ReviewSectionProps {
  items: ResultReviewItem[];
  revealCorrect: boolean;
}

const FILTER_ICONS: Record<ReviewFilter, React.ComponentType<{ className?: string }>> = {
  all: MessagesSquare,
  correct: CheckCircle2,
  wrong: CircleX,
  skipped: MinusCircle,
};

function ReviewSectionInner({ items, revealCorrect }: ReviewSectionProps) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: items.length,
      correct: items.filter((item) => item.status === "correct").length,
      wrong: items.filter((item) => item.status === "wrong").length,
      skipped: items.filter((item) => item.status === "skipped").length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ar");

    return items.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      if (!normalized) return true;
      return item.title.toLocaleLowerCase("ar").includes(normalized);
    });
  }, [items, filter, query]);

  function jumpTo(item: ResultReviewItem) {
    document
      .getElementById(`review-${item.examQuestionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-foreground">مراجعة الأسئلة</h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            تصفح إجاباتك وفهم التصحيح لكل سؤال
          </p>
        </div>
        <AppSearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          placeholder="ابحث عن سؤال..."
          containerClassName="w-full sm:w-64"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {REVIEW_FILTERS.map((option) => {
          const Icon = FILTER_ICONS[option.value];
          const active = filter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold transition-all duration-200",
                active
                  ? "bg-[var(--brand-primary)] text-white shadow-lg shadow-[rgba(0,0,0,0.25)]"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  active ? "bg-white/20" : "bg-background/70",
                )}
              >
                {counts[option.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick navigation */}
      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/30 pt-4">
          {filtered.map((item, index) => (
            <button
              key={item.examQuestionId}
              type="button"
              onClick={() => jumpTo(item)}
              title={`الانتقال إلى سؤال ${index + 1}`}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold tabular-nums transition-colors",
                item.status === "correct" && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
                item.status === "wrong" && "bg-red-500/10 text-red-500 hover:bg-red-500/20",
                item.status === "skipped" && "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <AppEmptyState
            variant="compact"
            title="لا توجد أسئلة مطابقة"
            description="جرّب تغيير عامل التصفية أو نص البحث."
            icon={MessagesSquare}
          />
        ) : (
          filtered.map((item, index) => (
            <ReviewQuestionCard
              key={item.examQuestionId}
              item={item}
              index={index}
              revealCorrect={revealCorrect}
            />
          ))
        )}
      </div>
    </section>
  );
}

const ReviewSection = memo(ReviewSectionInner);

export { ReviewSection };
