"use client";

import { Medal, Star } from "lucide-react";
import type { Achievement, AchievementType } from "../types";
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui/AppCard";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { AppBadge } from "@/components/ui/AppBadge";
import { ACHIEVEMENT_LABELS } from "../constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

interface AchievementsSectionProps {
  achievements: Achievement[];
}

const achievementStyles: Record<AchievementType, string> = {
  course_completed: "bg-success/10 text-success",
  exam_passed: "bg-warning/10 text-warning",
  certificate: "bg-primary/10 text-primary",
};

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  return (
    <AppCard className="h-full">
      <AppCardHeader>
        <AppCardTitle className="flex items-center gap-2">
          <Medal className="h-4 w-4 text-primary" aria-hidden="true" />
          الإنجازات
        </AppCardTitle>
      </AppCardHeader>
      <AppCardContent>
        {achievements.length === 0 ? (
          <AppEmptyState
            variant="compact"
            icon={Medal}
            title="لا توجد إنجازات بعد"
            description="أكمل الدورات واجتز الاختبارات لكسب الإنجازات."
          />
        ) : (
          <ul className="grid gap-2">
            {achievements.map((achievement) => (
              <li
                key={achievement.id}
                className="flex items-center gap-3 rounded-xl border p-3"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    achievementStyles[achievement.type] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  <Star className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{achievement.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {ACHIEVEMENT_LABELS[achievement.type] ?? "إنجاز"}
                    {achievement.description ? ` · ${achievement.description}` : ""}
                  </p>
                </div>
                <AppBadge variant="outline" className="shrink-0 text-[10px]">
                  {formatDate(achievement.earnedAt)}
                </AppBadge>
              </li>
            ))}
          </ul>
        )}
      </AppCardContent>
    </AppCard>
  );
}
