"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { RecentAttemptItem } from "../types";
import {
  StudentCard,
  StudentCardHeader,
  StudentEmptyState,
  useBrandTheme,
} from "./StudentCard";
import { BRAND_PRIMARY, BRAND_SECONDARY } from "../constants";
import { formatDateTime, formatNumber } from "@/lib/format";

interface RecentAttemptsSectionProps {
  attempts: RecentAttemptItem[];
}

function resultBadge(attempt: RecentAttemptItem, t: ReturnType<typeof useBrandTheme>) {
  if (attempt.passed) {
    return (
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold tabular-nums"
        style={{
          backgroundColor: `rgb(var(--brand-secondary-rgb) / 0.11)`,
          color: BRAND_SECONDARY,
        }}
      >
        ناجح · {formatNumber(attempt.percentage ?? 0)}%
      </span>
    );
  }

  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold tabular-nums"
      style={{
        backgroundColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        color: t.muted,
      }}
    >
      {attempt.status === "submitted" ? "مكتمل" : attempt.status} ·{" "}
      {formatNumber(attempt.percentage ?? 0)}%
    </span>
  );
}

export function RecentAttemptsSection({ attempts }: RecentAttemptsSectionProps) {
  const t = useBrandTheme();

  return (
    <StudentCard className="h-full">
      <StudentCardHeader
        icon={ClipboardCheck}
        title="آخر الاختبارات"
        subtitle="أحدث المحاولات ونتائجها"
        accent={BRAND_PRIMARY}
      />
      <div className="p-5 sm:p-6">
        {attempts.length === 0 ? (
          <StudentEmptyState
            icon={ClipboardCheck}
            title="لم تخض أي اختبار بعد"
            description="عند إتمام اختبار، ستظهر نتيجته هنا."
            accent={BRAND_PRIMARY}
          />
        ) : (
          <ul className="space-y-2.5">
            {attempts.map((attempt) => (
              <li key={attempt.attemptId}>
                <Link
                  href={`/exam-results/${attempt.attemptId}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    border: `1px solid ${t.cardBorder}`,
                    background: t.chipBg,
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold" style={{ color: t.ink }}>
                      {attempt.examTitle}
                    </p>
                    <p className="mt-0.5 truncate text-xs" style={{ color: t.muted }}>
                      {attempt.courseTitle ?? "اختبار مستقل"}
                      {attempt.submittedAt ? ` · ${formatDateTime(attempt.submittedAt)}` : ""}
                    </p>
                  </div>
                  {resultBadge(attempt, t)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StudentCard>
  );
}
