"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardCheck, Send, Timer } from "lucide-react";
import { CTA_GRADIENT } from "@/features/public-course/brand";
import { formatCountdown } from "../utils";
import type { ActiveExamAttempt } from "../types";

interface ExamActiveReminderProps {
  attempt: ActiveExamAttempt;
  remainingSeconds: number | null;
  onReturn: () => void;
  onSubmit: () => void;
}

/**
 * Persistent "unfinished exam" notification shown on every page until the
 * student returns to the exam, submits it, or the timer runs out. Dismissal is
 * intentionally not allowed — there is no close affordance.
 *
 * Desktop: floating glass card. Mobile: sticky bottom card.
 */
function ExamActiveReminderInner({
  attempt,
  remainingSeconds,
  onReturn,
  onSubmit,
}: ExamActiveReminderProps) {
  const title = attempt.exam?.title || "امتحان";

  return (
    <motion.div
      key="exam-active-reminder"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed inset-x-0 bottom-0 z-[60] p-3 pb-4 sm:inset-x-auto sm:bottom-6 sm:start-6 sm:w-[26rem] sm:max-w-[calc(100vw-3rem)] sm:p-0"
      role="alert"
      aria-live="polite"
    >
      <div className="relative overflow-hidden rounded-t-3xl border border-border/60 bg-background/90 shadow-2xl shadow-black/10 backdrop-blur-xl sm:rounded-3xl">
        <div
          className="h-1 w-full"
          style={{ background: CTA_GRADIENT }}
          aria-hidden="true"
        />

        <div className="flex items-start gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-[rgb(var(--brand-primary-rgb)/0.25)]"
            style={{ background: CTA_GRADIENT }}
          >
            <ClipboardCheck className="h-5 w-5 text-white" strokeWidth={2.1} />
          </motion.div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-extrabold text-foreground">
              لديك امتحان لم يُسلَّم بعد
            </h2>
            <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-muted-foreground/80">
              {title}
            </p>
          </div>

          {remainingSeconds !== null && (
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 font-mono text-xs font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
              <Timer className="h-3.5 w-3.5" />
              {formatCountdown(remainingSeconds)}
            </div>
          )}
        </div>

        <div className="space-y-1.5 px-4 pb-1 pt-3 sm:px-5">
          <p className="text-[13px] font-semibold leading-relaxed text-foreground/85">
            غادرت الامتحان قبل إنهائه والوقت ما زال يعمل.
          </p>
          <p className="text-xs font-medium leading-relaxed text-muted-foreground">
            يرجى العودة لإكمال الامتحان أو تسليمه قبل انتهاء الوقت.
          </p>
        </div>

        <div className="flex gap-2.5 px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={onReturn}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-lg shadow-[rgb(var(--brand-primary-rgb)/0.3)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: CTA_GRADIENT }}
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للامتحان
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 text-sm font-bold text-amber-600 transition-all duration-200 hover:bg-amber-500/20 dark:text-amber-400"
          >
            <Send className="h-4 w-4" />
            تسليم الامتحان
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const ExamActiveReminder = memo(ExamActiveReminderInner);

export { ExamActiveReminder };
