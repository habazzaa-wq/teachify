"use client";

import { memo } from "react";
import { CheckCircle2, CircleX, MinusCircle, Gauge, ListChecks } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ResultStatistics } from "../types";
import { formatPercent } from "../utils";

interface PerformanceBreakdownProps {
  statistics: ResultStatistics;
}

function PerformanceBreakdownInner({ statistics }: PerformanceBreakdownProps) {
  const total = statistics.totalQuestions;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {/* Answer distribution */}
      <div className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-foreground">توزيع الإجابات</h2>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          تفاصيل أدائك في {total} سؤالًا
        </p>

        <div className="mt-5 space-y-4">
          <DistributionRow
            label="إجابات صحيحة"
            icon={CheckCircle2}
            count={statistics.correctAnswers}
            percent={statistics.correctPercent}
            barClass="bg-success"
            textClass="text-success"
            iconClass="bg-success/10 text-success"
          />
          <DistributionRow
            label="إجابات خاطئة"
            icon={CircleX}
            count={statistics.wrongAnswers}
            percent={statistics.wrongPercent}
            barClass="bg-destructive"
            textClass="text-destructive"
            iconClass="bg-destructive/10 text-destructive"
          />
          <DistributionRow
            label="أسئلة لم تُجب"
            icon={MinusCircle}
            count={statistics.skippedQuestions}
            percent={statistics.skippedPercent}
            barClass="bg-muted-foreground/40"
            textClass="text-muted-foreground"
            iconClass="bg-muted text-muted-foreground"
          />
        </div>
      </div>

      {/* Accuracy / completion */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricTile
          icon={Gauge}
          label="الدقة"
          value={formatPercent(statistics.accuracy)}
          suffix="٪"
          hint={`من أصل ${statistics.answeredQuestions} سؤال مجاب عنه`}
          tone="success"
        />
        <MetricTile
          icon={ListChecks}
          label="نسبة الإكمال"
          value={formatPercent(statistics.completionRate)}
          suffix="٪"
          hint={`${statistics.answeredQuestions} من ${total} تمت الإجابة`}
          tone="primary"
        />
      </div>
    </section>
  );
}

function DistributionRow({
  label,
  icon: Icon,
  count,
  percent,
  barClass,
  textClass,
  iconClass,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  percent: number;
  barClass: string;
  textClass: string;
  iconClass: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconClass)}>
            <Icon className="h-4 w-4" />
          </span>
          {label}
        </span>
        <span className="text-xs font-extrabold tabular-nums text-muted-foreground">
          <span className={textClass}>{count}</span> / {percent}٪
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", barClass)}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix: string;
  hint: string;
  tone: "success" | "primary";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm",
        tone === "success" ? "hover:border-success/40" : "hover:border-primary/40",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          tone === "success" ? "bg-success" : "bg-primary",
        )}
      />
      <span
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-xl",
          tone === "success" ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums text-foreground">
        {value}
        <span className="ms-0.5 text-sm font-extrabold text-muted-foreground">{suffix}</span>
      </p>
      <p className="mt-1 text-[11px] font-semibold text-muted-foreground/70">{hint}</p>
    </div>
  );
}

const PerformanceBreakdown = memo(PerformanceBreakdownInner);

export { PerformanceBreakdown };
