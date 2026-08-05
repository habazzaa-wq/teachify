"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";
import type { ContinueLearningItem } from "../types";
import {
  StudentCard,
  StudentCardHeader,
  StudentEmptyState,
  useBrandTheme,
} from "./StudentCard";
import { BRAND_PRIMARY } from "../constants";
import { formatNumber } from "@/lib/format";

interface ContinueLearningSectionProps {
  items: ContinueLearningItem[];
}

export function ContinueLearningSection({ items }: ContinueLearningSectionProps) {
  const t = useBrandTheme();

  return (
    <StudentCard className="h-full">
      <StudentCardHeader
        icon={BookOpen}
        title="واصل التعلم"
        subtitle="دوراتك الجارية"
        accent={BRAND_PRIMARY}
      />
      <div className="p-5 sm:p-6">
        {items.length === 0 ? (
          <StudentEmptyState
            icon={BookOpen}
            title="لا توجد دورات جارية"
            description="سجّل في دورة جديدة لتبدأ رحلة التعلم."
            accent={BRAND_PRIMARY}
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.enrollmentId}>
                <Link
                  href={`/courses/${item.courseSlug}`}
                  className="group flex gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    border: `1px solid ${t.cardBorder}`,
                    background: t.chipBg,
                  }}
                >
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-extrabold"
                    style={{
                      backgroundColor: `${BRAND_PRIMARY}1a`,
                      color: BRAND_PRIMARY,
                      boxShadow: `0 4px 12px ${BRAND_PRIMARY}18`,
                    }}
                  >
                    {item.courseTitle.slice(0, 1)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold" style={{ color: t.ink }}>
                          {item.courseTitle}
                        </h4>
                        {item.nextLessonTitle && (
                          <p className="mt-0.5 truncate text-xs" style={{ color: t.muted }}>
                            التالي: {item.nextLessonTitle}
                          </p>
                        )}
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums"
                        style={{
                          backgroundColor: `${BRAND_PRIMARY}1a`,
                          color: BRAND_PRIMARY,
                        }}
                      >
                        {formatNumber(item.progressPercent)}%
                      </span>
                    </div>

                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full"
                      style={{
                        background: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, item.progressPercent))}%`,
                          background: BRAND_PRIMARY,
                          boxShadow: `0 0 8px ${BRAND_PRIMARY}66`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs" style={{ color: t.muted }}>
                      <span>
                        {formatNumber(item.completedLessonsCount)} من{" "}
                        {formatNumber(item.totalLessonsCount)} درس
                      </span>
                      {item.nextLessonId && (
                        <span
                          className="inline-flex items-center gap-1 font-bold transition-transform duration-300 group-hover:-translate-x-1"
                          style={{ color: BRAND_PRIMARY }}
                        >
                          <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          متابعة
                          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StudentCard>
  );
}
