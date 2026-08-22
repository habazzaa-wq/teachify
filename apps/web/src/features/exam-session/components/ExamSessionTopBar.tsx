"use client";

import { memo } from "react";
import { Clock, Send, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppProgress } from "@/components/ui/AppProgress";
import { TIMER_TONES } from "../constants";
import { formatCountdown, getTimerTone } from "../utils";

interface ExamSessionTopBarProps {
  title: string;
  remainingSeconds: number | null;
  answeredCount: number;
  total: number;
  submitting: boolean;
  onSubmitClick: () => void;
}

function ExamSessionTopBarInner({
  title,
  remainingSeconds,
  answeredCount,
  total,
  submitting,
  onSubmitClick,
}: ExamSessionTopBarProps) {
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const tone = remainingSeconds === null ? "safe" : getTimerTone(remainingSeconds);

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-primary)] bg-[var(--brand-primary)]">
            <ClipboardCheck className="h-5 w-5 text-[var(--brand-primary-contrast)]" strokeWidth={1.9} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="line-clamp-1 text-sm font-extrabold text-foreground sm:text-[15px]">
              {title}
            </h1>
            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground/70">
              {answeredCount} من {total} أسئلة مُجابة
            </p>
          </div>

          <div
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-2 font-mono text-sm font-extrabold tabular-nums",
              TIMER_TONES[tone],
            )}
            role="timer"
            aria-live="off"
          >
            <Clock className="h-4 w-4" />
            {remainingSeconds === null ? "—" : formatCountdown(remainingSeconds)}
          </div>

          <button
            type="button"
            onClick={onSubmitClick}
            disabled={submitting}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "var(--brand-primary)" }}
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">تسليم الامتحان</span>
            <span className="sm:hidden">تسليم</span>
          </button>
        </div>

        <AppProgress
          value={progress}
          max={100}
          size="sm"
          variant={progress === 100 ? "success" : "default"}
          className="max-w-full"
        />
      </div>
    </header>
  );
}

const ExamSessionTopBar = memo(ExamSessionTopBarInner);

export { ExamSessionTopBar };
