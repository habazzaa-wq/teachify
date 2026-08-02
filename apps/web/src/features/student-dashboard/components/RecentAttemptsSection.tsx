"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { RecentAttemptItem } from "../types";
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui/AppCard";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { AppBadge } from "@/components/ui/AppBadge";
import { formatDateTime, formatNumber } from "@/lib/format";

interface RecentAttemptsSectionProps {
  attempts: RecentAttemptItem[];
}

function resultBadge(attempt: RecentAttemptItem) {
  if (attempt.passed) {
    return (
      <AppBadge variant="success" className="shrink-0 text-xs">
        ناجح · {formatNumber(attempt.percentage ?? 0)}%
      </AppBadge>
    );
  }

  return (
    <AppBadge variant="destructive" className="shrink-0 text-xs">
      {attempt.status === "submitted" ? "مكتمل" : attempt.status} · {formatNumber(attempt.percentage ?? 0)}%
    </AppBadge>
  );
}

export function RecentAttemptsSection({ attempts }: RecentAttemptsSectionProps) {
  return (
    <AppCard className="h-full">
      <AppCardHeader>
        <AppCardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          آخر الاختبارات
        </AppCardTitle>
      </AppCardHeader>
      <AppCardContent>
        {attempts.length === 0 ? (
          <AppEmptyState
            variant="compact"
            icon={ClipboardCheck}
            title="لم تخض أي اختبار بعد"
            description="عند إتمام اختبار، ستظهر نتيجته هنا."
          />
        ) : (
          <ul className="space-y-2">
            {attempts.map((attempt) => (
              <li key={attempt.attemptId}>
                <Link
                  href={`/exam-results/${attempt.attemptId}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{attempt.examTitle}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {attempt.courseTitle ?? "اختبار مستقل"}
                      {attempt.submittedAt ? ` · ${formatDateTime(attempt.submittedAt)}` : ""}
                    </p>
                  </div>
                  {resultBadge(attempt)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AppCardContent>
    </AppCard>
  );
}
