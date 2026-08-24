"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { TIMER_TONES } from "../constants";
import { formatCountdown, getTimerTone } from "../utils";

interface ExamCountdownProps {
  /**
   * The session attempt. Only `timerEndsAt` / `remainingSeconds` / `status`
   * are read; the component anchors the deadline once on mount so the
   * per-second ticking never propagates to the surrounding exam UI.
   */
  attempt: {
    timerEndsAt?: string | null;
    remainingSeconds?: number | null;
    status?: string;
  } | null;
  inProgress: boolean;
}

/**
 * Self-contained countdown display. Owns its own 1-second ticking state so the
 * rest of the exam page (questions, workspace, navigator) does not re-render
 * every second. Auto-submit logic lives in the page; this only renders time.
 */
export function ExamCountdown({ attempt, inProgress }: ExamCountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const deadlineRef = useRef<number | null>(null);

  if (deadlineRef.current === null && attempt?.status === "in_progress") {
    if (attempt.timerEndsAt) {
      deadlineRef.current = new Date(attempt.timerEndsAt).getTime();
    } else if (attempt.remainingSeconds != null) {
      deadlineRef.current = Date.now() + attempt.remainingSeconds * 1000;
    }
  }

  useEffect(() => {
    if (!inProgress || deadlineRef.current === null) return;

    const id = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(id);
  }, [inProgress]);

  const remaining =
    deadlineRef.current != null
      ? Math.max(0, Math.round((deadlineRef.current - now) / 1000))
      : null;
  const tone = remaining === null ? "safe" : getTimerTone(remaining);

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-2 font-mono text-sm font-extrabold tabular-nums",
        TIMER_TONES[tone],
      )}
      role="timer"
      aria-live="off"
    >
      <Clock className="h-4 w-4" />
      {remaining === null ? "—" : formatCountdown(remaining)}
    </div>
  );
}
