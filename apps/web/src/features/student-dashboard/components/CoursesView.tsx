"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, PlaySquare } from "lucide-react";
import type { ContinueLearningItem } from "../types";
import { useBrandTheme } from "./StudentCard";
import { BRAND_PRIMARY, BRAND_SECONDARY } from "../constants";
import { formatNumber } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";

interface CoursesViewProps {
  items: ContinueLearningItem[];
}

export function CoursesView({ items }: CoursesViewProps) {
  const t = useBrandTheme();

  return (
    <div>
      <SectionHeader
        index={2}
        eyebrow="رحلة التعلّم"
        title="دوراتي"
        subtitle="كل ما التحقت به وما زلت تتقدّم فيه."
        action={
          items.length > 0 ? (
            <span
              className="rounded-full px-3 py-1.5 text-xs font-black tabular-nums"
              style={{ backgroundColor: t.chipBg, color: t.muted, border: `1px solid ${t.cardBorder}` }}
            >
              {formatNumber(items.length)} دورة
            </span>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <div
          className="rounded-[1.5rem] border"
          style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}
        >
          <EmptyState
            icon={BookOpen}
            title="لا توجد دورات جارية"
            description="سجّل في دورة جديدة لتبدأ رحلة التعلّم وستجدها هنا."
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <Link
              key={item.enrollmentId}
              href={`/courses/${item.courseSlug}`}
              className="group flex flex-col overflow-hidden rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: t.cardBorder,
                backgroundColor: t.cardBg,
                boxShadow: t.cardShadow,
              }}
            >
              {/* cover */}
              <div className="relative h-36 overflow-hidden">
                {item.thumbnail ? (
                  <>
                    <img src={item.thumbnail} alt={item.courseTitle} className="absolute inset-0 h-full w-full object-cover" />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.42))" }}
                    />
                  </>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(140deg, ${BRAND_PRIMARY} 0%, ${BRAND_SECONDARY} 130%)`,
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white/90">
                      {item.courseTitle.slice(0, 1)}
                    </span>
                  </div>
                )}
                <span
                  className="absolute right-4 top-3 text-xs font-black tabular-nums text-white/85"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
                >
                  {formatNumber(index + 1)}
                </span>
                <span
                  className="absolute bottom-3 right-4 rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
                >
                  {formatNumber(item.progressPercent)}% مكتمل
                </span>
              </div>

              {/* body */}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="min-w-0">
                  <h4 className="truncate text-[15px] font-black" style={{ color: t.ink }}>
                    {item.courseTitle}
                  </h4>
                  {item.nextLessonTitle ? (
                    <p className="mt-1 truncate text-xs font-bold" style={{ color: t.muted }}>
                      التالي: {item.nextLessonTitle}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-bold" style={{ color: t.muted }}>
                      الدورة على وشك الاكتمال
                    </p>
                  )}
                </div>

                <div className="mt-auto space-y-2">
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: t.isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, item.progressPercent))}%`,
                        background: `linear-gradient(90deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold" style={{ color: t.muted }}>
                    <span className="tabular-nums">
                      {formatNumber(item.completedLessonsCount)} من {formatNumber(item.totalLessonsCount)} درس
                    </span>
                    <span
                      className="inline-flex items-center gap-1 transition-transform duration-300 group-hover:-translate-x-1"
                      style={{ color: BRAND_PRIMARY }}
                    >
                      <PlaySquare className="h-3.5 w-3.5" aria-hidden="true" />
                      متابعة
                      <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
