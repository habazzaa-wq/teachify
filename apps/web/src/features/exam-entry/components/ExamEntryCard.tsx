"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Clock,
  ListChecks,
  Target,
  Repeat,
  History,
  Trophy,
  Play,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AppProgress } from "@/components/ui/AppProgress";
import { useExamEntry } from "../hooks";
import { EXAM_STATUS_META, EXAM_LOCKED_REASON_LABELS } from "../constants";
import { formatExamDuration, formatExamPercentage } from "../utils";
import { StartExamDialog } from "./StartExamDialog";

interface ExamEntryCardProps {
  lessonId: string;
  enabled?: boolean;
  className?: string;
}

function ExamEntryCardInner({ lessonId, enabled = true, className }: ExamEntryCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: entry, isLoading } = useExamEntry(lessonId, enabled);

  if (!enabled || isLoading) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-2xl border border-border/40 bg-card/60 p-4",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted/60" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded bg-muted/60" />
            <div className="h-3 w-1/2 rounded bg-muted/40" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  if (!entry || !entry.examExists || !entry.examTitle) {
    return null;
  }

  const status = EXAM_STATUS_META[entry.eligibility];
  const lockedLabel = entry.lockedReason
    ? EXAM_LOCKED_REASON_LABELS[entry.lockedReason]
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-[#BF6D58]/20 bg-card shadow-sm",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#BF6D58]/40 before:to-transparent",
          className,
        )}
        style={{
          background:
            "linear-gradient(135deg, rgba(191,109,88,0.05), rgba(255,181,14,0.03))",
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-gradient-to-br from-[#BF6D58]/15 to-[#FFB50E]/8 text-amber-600 dark:text-amber-400">
            <ClipboardCheck className="h-5 w-5" strokeWidth={1.9} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="line-clamp-1 text-sm font-extrabold text-foreground sm:text-[15px]">
                {entry.examTitle}
              </h4>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                  status.className,
                )}
              >
                {status.label}
              </span>
            </div>
            {entry.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {entry.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-4 sm:px-5">
          <StatTile
            icon={<Clock className="h-4 w-4" />}
            label="المدة"
            value={formatExamDuration(entry.duration)}
          />
          <StatTile
            icon={<ListChecks className="h-4 w-4" />}
            label="عدد الأسئلة"
            value={entry.questionCount !== null ? String(entry.questionCount) : "—"}
          />
          <StatTile
            icon={<Target className="h-4 w-4" />}
            label="درجة النجاح"
            value={formatExamPercentage(entry.passingPercentage)}
          />
          <StatTile
            icon={<Repeat className="h-4 w-4" />}
            label="المحاولات المتبقية"
            value={
              entry.remainingAttempts === null
                ? "غير محدود"
                : String(entry.remainingAttempts)
            }
          />
        </div>

        {/* History + best score */}
        <div className="flex items-center gap-3 border-t border-border/30 bg-muted/20 px-4 py-3 sm:px-5">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <History className="h-3.5 w-3.5 text-[#BF6D58]/70" />
            {entry.previousAttempts === 0
              ? "لا توجد محاولات سابقة"
              : `${entry.previousAttempts} ${entry.previousAttempts === 1 ? "محاولة" : "محاولات"} سابقة`}
          </span>
          <span className="hidden h-3 w-px bg-border/50 sm:block" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <AppProgress
                value={entry.bestScore ?? 0}
                max={100}
                size="sm"
                variant={entry.eligibility === "completed" ? "success" : "default"}
                className="flex-1"
              />
              <span className="shrink-0 text-[11px] font-bold tabular-nums text-foreground/80">
                {entry.bestScore === null
                  ? "أفضل نتيجة —"
                  : `أفضل نتيجة ${formatExamPercentage(entry.bestScore)}`}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2 border-t border-border/30 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
          {lockedLabel ? (
            <p className="flex min-w-0 flex-1 items-start gap-1.5 text-xs leading-relaxed text-amber-600/90 dark:text-amber-400/90">
              <span className="mt-0.5 shrink-0">•</span>
              {lockedLabel}
            </p>
          ) : (
            <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-semibold text-emerald-600/90 dark:text-emerald-400/90">
              <Play className="h-3 w-3 shrink-0 fill-current" />
              أنت مؤهل لبدء هذا الامتحان.
            </p>
          )}
          <button
            type="button"
            disabled={!entry.canStart}
            onClick={() => setDialogOpen(true)}
            className={cn(
              "group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300",
              "shadow-[0_8px_24px_rgba(191,109,88,0.35)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              entry.canStart
                ? "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(191,109,88,0.45)]"
                : "cursor-not-allowed opacity-50 saturate-50",
            )}
            style={{
              background:
                "linear-gradient(135deg, #BF6D58, #a85a47)",
            }}
          >
            <span className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <Play className="relative h-4 w-4 fill-current" />
            <span className="relative">بدء الامتحان</span>
          </button>
        </div>
      </motion.div>

      {entry.canStart && (
        <StartExamDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entry={entry}
          lessonId={lessonId}
        />
      )}
    </>
  );
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatTile({ icon, label, value }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-extrabold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

const ExamEntryCard = memo(ExamEntryCardInner);

export { ExamEntryCard };
export type { ExamEntryCardProps };
