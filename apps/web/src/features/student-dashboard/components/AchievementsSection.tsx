"use client";

import { Medal, Star, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Achievement, AchievementType } from "../types";
import {
  StudentCard,
  StudentCardHeader,
  StudentChip,
  StudentEmptyState,
  useBrandTheme,
} from "./StudentCard";
import { BRAND_PRIMARY, BRAND_SECONDARY, ACHIEVEMENT_LABELS } from "../constants";
import { formatDate } from "@/lib/format";

interface AchievementsSectionProps {
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

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const t = useBrandTheme();

  return (
    <StudentCard className="h-full">
      <StudentCardHeader
        icon={Medal}
        title="الإنجازات"
        subtitle="أوسمتك في رحلة التعلّم"
        accent={BRAND_PRIMARY}
      />
      <div className="p-5 sm:p-6">
        {achievements.length === 0 ? (
          <StudentEmptyState
            icon={Medal}
            title="لا توجد إنجازات بعد"
            description="أكمل الدورات واجتز الاختبارات لكسب الإنجازات."
            accent={BRAND_PRIMARY}
          />
        ) : (
          <ul className="space-y-2.5">
            {achievements.map((achievement) => {
              const Icon = ICON_BY_TYPE[achievement.type] ?? Star;
              const accent = accentForType(achievement.type);

              return (
                <li key={achievement.id}>
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl border p-3"
                    style={{
                      border: `1px solid ${t.cardBorder}`,
                      background: t.chipBg,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${accent}1a`,
                          color: accent,
                          boxShadow: `0 4px 10px ${accent}1c`,
                        }}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold" style={{ color: t.ink }}>
                          {achievement.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs" style={{ color: t.muted }}>
                          {ACHIEVEMENT_LABELS[achievement.type] ?? "إنجاز"}
                          {achievement.description ? ` · ${achievement.description}` : ""}
                        </p>
                      </div>
                    </div>
                    <StudentChip accent={accent} className="shrink-0 tabular-nums">
                      {formatDate(achievement.earnedAt)}
                    </StudentChip>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </StudentCard>
  );
}
