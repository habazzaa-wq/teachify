"use client";

import { memo } from "react";
import {
  Trophy,
  XCircle,
  Medal,
  Repeat,
  Clock,
  CalendarCheck,
  Target,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ProgressRing } from "@/features/course-workspace/components/ProgressRing";
import { formatDateTime } from "@/lib/format";
import type { ExamResult } from "../types";
import { formatDurationLabel, formatPercent } from "../utils";

interface ResultHeroProps {
  result: ExamResult;
}

function ResultHeroInner({ result }: ResultHeroProps) {
  const { attempt, exam } = result;
  const passed = attempt.passed;
  const percentage = attempt.percentage ?? 0;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-8"
      style={{
        borderColor: passed ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
        background: passed
          ? "linear-gradient(135deg, rgba(16,185,129,0.10), rgb(var(--brand-primary-rgb) / 0.05) 55%, rgb(var(--brand-secondary-rgb) / 0.04))"
          : "linear-gradient(135deg, rgba(239,68,68,0.08), rgb(var(--brand-primary-rgb) / 0.04) 55%, rgb(var(--brand-secondary-rgb) / 0.03))",
      }}
    >
      {/* Decorative glow */}
      <div
        className="pointer-events-none absolute -top-24 -end-24 h-64 w-64 rounded-full blur-3xl"
        style={{
          background: passed
            ? "radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)"
            : "radial-gradient(circle, rgba(239,68,68,0.16), transparent 70%)",
        }}
      />

      <div className="relative grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        {/* Animated score ring */}
        <div className="flex justify-center lg:justify-start">
          <ProgressRing
            progress={percentage}
            size={190}
            strokeWidth={14}
            color={passed ? "stroke-emerald-500" : "stroke-red-500"}
            trackColor="stroke-foreground/10"
          >
            <div className="flex flex-col items-center gap-1">
              {passed ? (
                <Trophy className="h-7 w-7 text-emerald-500" strokeWidth={1.8} />
              ) : (
                <XCircle className="h-7 w-7 text-red-500" strokeWidth={1.8} />
              )}
              <span
                className={cn(
                  "text-4xl font-black tabular-nums",
                  passed ? "text-emerald-500" : "text-red-500",
                )}
              >
                {formatPercent(percentage)}
              </span>
              <span className="text-sm font-extrabold text-muted-foreground">٪</span>
            </div>
          </ProgressRing>
        </div>

        {/* Copy */}
        <div className="text-center lg:text-start">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ring-1",
                passed
                  ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30"
                  : "bg-red-500/10 text-red-500 ring-red-500/30",
              )}
            >
              {passed ? (
                <BadgeCheck className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {passed ? "ناجح" : "لم ينجح"}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ring-1",
                attempt.isPractice
                  ? "bg-sky-500/10 text-sky-600 ring-sky-500/30"
                  : "bg-amber-500/10 text-amber-600 ring-amber-500/30",
              )}
            >
              {attempt.isPractice ? (
                <Repeat className="h-4 w-4" />
              ) : (
                <Medal className="h-4 w-4" />
              )}
              {attempt.isPractice ? "محاولة تدريبية" : "محاولة رسمية"}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1 text-xs font-extrabold text-muted-foreground ring-1 ring-border/50">
              المحاولة {attempt.attemptNumber}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-black text-foreground sm:text-3xl">
            {passed ? "أحسنت، لقد اجتزت الامتحان!" : "لم تجتز الامتحان هذه المرة"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{exam.title}</p>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <HeroStat
              icon={Target}
              label="الدرجة"
              value={`${attempt.score} / ${attempt.maxScore}`}
              accent={passed ? "text-emerald-600 bg-emerald-500/10" : "text-red-500 bg-red-500/10"}
            />
            <HeroStat
              icon={BadgeCheck}
              label="درجة النجاح"
              value={exam.passingScore > 0 ? `${exam.passingScore}٪` : "—"}
              accent="text-amber-600 bg-amber-500/10"
            />
            <HeroStat
              icon={Clock}
              label="الوقت المستغرق"
              value={formatDurationLabel(attempt.durationSeconds) ?? "—"}
              accent="text-sky-600 bg-sky-500/10"
            />
            <HeroStat
              icon={CalendarCheck}
              label="تاريخ التسليم"
              value={attempt.submittedAt ? formatDateTime(attempt.submittedAt) : "—"}
              accent="text-violet-600 bg-violet-500/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/70 px-3 py-3 text-start backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", accent)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[10px] font-bold text-muted-foreground/80">{label}</p>
      </div>
      <p className="mt-1.5 truncate text-sm font-extrabold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

const ResultHero = memo(ResultHeroInner);

export { ResultHero };
