"use client";

import Link from "next/link";
import { ChevronLeft, ClipboardCheck } from "lucide-react";
import type { RecentAttemptItem } from "../types";
import { useBrandTheme } from "./StudentCard";
import {
  BRAND_SECONDARY,
  BRAND_TEXT_ON_SECONDARY,
} from "../constants";
import { formatDateTime, formatNumber } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";
import { AnimatedNumber } from "./AnimatedNumber";

interface ExamsViewProps {
  attempts: RecentAttemptItem[];
}

export function ExamsView({ attempts }: ExamsViewProps) {
  const t = useBrandTheme();
  const passed = attempts.filter((a) => a.passed).length;
  const passRate = attempts.length > 0 ? Math.round((passed / attempts.length) * 100) : 0;

  return (
    <div>
      <SectionHeader
        index={3}
        eyebrow="نتائجك"
        title="الاختبارات"
        subtitle="آخر المحاولات ونتائجها، من الأحدث إلى الأقدم."
      />

      {attempts.length === 0 ? (
        <div
          className="rounded-[1.5rem] border"
          style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}
        >
          <EmptyState
            icon={ClipboardCheck}
            title="لم تخض أي اختبار بعد"
            description="عند إتمام أول اختبار، ستظهر نتيجته هنا مع تحليل أدائك."
          />
        </div>
      ) : (
        <>
          {/* summary band */}
          <section
            aria-label="ملخص النتائج"
            className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-[1.5rem] border"
            style={{
              borderColor: t.cardBorder,
              backgroundColor: t.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
            }}
          >
            <div className="p-5 text-center" style={{ backgroundColor: t.cardBg }}>
              <p className="text-2xl font-black tabular-nums" style={{ color: t.ink }}>
                <AnimatedNumber value={attempts.length} delay={100} />
              </p>
              <p className="mt-1 text-xs font-bold" style={{ color: t.muted }}>
                محاولة
              </p>
            </div>
            <div className="p-5 text-center" style={{ backgroundColor: t.cardBg }}>
              <p className="text-2xl font-black tabular-nums" style={{ color: t.ink }}>
                <AnimatedNumber value={passed} delay={180} />
              </p>
              <p className="mt-1 text-xs font-bold" style={{ color: t.muted }}>
                مجتازة
              </p>
            </div>
            <div className="p-5 text-center" style={{ backgroundColor: t.cardBg }}>
              <p className="text-2xl font-black tabular-nums" style={{ color: t.ink }}>
                <AnimatedNumber value={passRate} suffix="%" delay={260} />
              </p>
              <p className="mt-1 text-xs font-bold" style={{ color: t.muted }}>
                نسبة النجاح
              </p>
            </div>
          </section>

          {/* attempts list */}
          <ul className="space-y-3">
            {attempts.map((attempt) => {
              const pct = Math.max(0, Math.min(100, attempt.percentage ?? 0));
              return (
                <li key={attempt.attemptId}>
                  <Link
                    href={`/exam-results/${attempt.attemptId}`}
                    className="group flex items-center gap-4 rounded-[1.25rem] border p-4 transition-all duration-300 hover:-translate-y-0.5 sm:gap-5"
                    style={{
                      borderColor: t.cardBorder,
                      backgroundColor: t.cardBg,
                      boxShadow: t.cardShadow,
                    }}
                  >
                    {/* score */}
                    <div className="w-16 shrink-0 text-center sm:w-20">
                      <p
                        className="text-2xl font-black tabular-nums tracking-tight sm:text-[28px]"
                        style={{ color: attempt.passed ? BRAND_SECONDARY : t.ink }}
                      >
                        {formatNumber(pct)}
                        <span className="text-xs font-bold" style={{ color: t.faint }}>
                          %
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10px] font-black" style={{ color: t.muted }}>
                        من {formatNumber(attempt.maxScore)}
                      </p>
                    </div>

                    <div className="h-12 w-px shrink-0" style={{ backgroundColor: t.divider }} aria-hidden="true" />

                    {/* main */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black" style={{ color: t.ink }}>
                        {attempt.examTitle}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-bold" style={{ color: t.muted }}>
                        {attempt.courseTitle ?? "اختبار مستقل"}
                        {attempt.submittedAt ? ` · ${formatDateTime(attempt.submittedAt)}` : ""}
                      </p>
                      <div
                        className="mt-2 h-1.5 w-full max-w-56 overflow-hidden rounded-full"
                        style={{ backgroundColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: attempt.passed ? BRAND_SECONDARY : t.muted,
                          }}
                        />
                      </div>
                    </div>

                    {/* status */}
                    <span
                      className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black"
                      style={
                        attempt.passed
                          ? {
                              backgroundColor: BRAND_SECONDARY,
                              color: BRAND_TEXT_ON_SECONDARY,
                            }
                          : {
                              backgroundColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                              color: t.muted,
                            }
                      }
                    >
                      {attempt.passed ? "ناجح" : attempt.status === "submitted" ? "مكتمل" : attempt.status}
                    </span>

                    <ChevronLeft
                      className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-1"
                      style={{ color: t.faint }}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
