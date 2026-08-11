"use client";

import { Medal, Star, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Achievement, AchievementType } from "../types";
import { useBrandTheme } from "./StudentCard";
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  ACHIEVEMENT_LABELS,
} from "../constants";
import { formatDate, formatNumber } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";

interface AchievementsViewProps {
  achievements: Achievement[];
}

const ICON_BY_TYPE: Record<AchievementType, LucideIcon> = {
  course_completed: Trophy,
  exam_passed: Star,
  certificate: Medal,
};

function accentForType(type: AchievementType): string {
  return type === "course_completed" ? BRAND_PRIMARY : BRAND_SECONDARY;
}

export function AchievementsView({ achievements }: AchievementsViewProps) {
  const t = useBrandTheme();

  return (
    <div>
      <SectionHeader
        index={6}
        eyebrow="أوسمتك"
        title="الإنجازات"
        subtitle="شهادات تكريم على إنجازاتك الحقيقية."
        action={
          achievements.length > 0 ? (
            <span
              className="rounded-full px-3 py-1.5 text-xs font-black tabular-nums"
              style={{ backgroundColor: t.chipBg, color: t.muted, border: `1px solid ${t.cardBorder}` }}
            >
              {formatNumber(achievements.length)} وسام
            </span>
          ) : undefined
        }
      />

      {achievements.length === 0 ? (
        <div
          className="rounded-[1.5rem] border"
          style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}
        >
          <EmptyState
            icon={Medal}
            title="لا توجد إنجازات بعد"
            description="أكمل الدورات واجتز الاختبارات لكسب أوسمتك الأولى."
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {achievements.map((achievement) => {
            const Icon = ICON_BY_TYPE[achievement.type] ?? Star;
            const accent = accentForType(achievement.type);

            return (
              <div
                key={achievement.id}
                className="group flex flex-col items-center gap-4 rounded-[1.5rem] border p-6 text-center transition-all duration-300 hover:-translate-y-1"
                style={{
                  borderColor: t.cardBorder,
                  backgroundColor: t.cardBg,
                  boxShadow: t.cardShadow,
                }}
              >
                {/* medal seal */}
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <span
                    className="absolute -inset-1.5 animate-spin-slow rounded-full border-2 border-dashed"
                    style={{ borderColor: accent, opacity: 0.4 }}
                    aria-hidden="true"
                  />
                  <span
                    className="absolute -inset-3 rounded-full border"
                    style={{ borderColor: accent, opacity: 0.12 }}
                    aria-hidden="true"
                  />
                  <div
                    className="relative flex h-20 w-20 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: `radial-gradient(circle at 30% 25%, ${accent}, ${accent} 60%, ${t.isDark ? "#00000055" : "#00000022"} 160%)`,
                      color: accent === BRAND_SECONDARY ? "#17130d" : "#ffffff",
                      boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
                    }}
                  >
                    <Icon className="h-8 w-8" aria-hidden="true" />
                  </div>
                </div>

                <span
                  className="rounded-full px-3 py-1 text-[10px] font-black"
                  style={{
                    backgroundColor: accent,
                    color: accent === BRAND_SECONDARY ? "#17130d" : "#ffffff",
                  }}
                >
                  {ACHIEVEMENT_LABELS[achievement.type] ?? "إنجاز"}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-black leading-snug" style={{ color: t.ink }}>
                    {achievement.title}
                  </p>
                  {achievement.description && (
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: t.muted }}>
                      {achievement.description}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] font-bold tabular-nums" style={{ color: t.faint }}>
                    {formatDate(achievement.earnedAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
