"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";
import type { ContinueLearningItem } from "../types";
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui/AppCard";
import { AppProgress } from "@/components/ui/AppProgress";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { AppBadge } from "@/components/ui/AppBadge";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

interface ContinueLearningSectionProps {
  items: ContinueLearningItem[];
}

export function ContinueLearningSection({ items }: ContinueLearningSectionProps) {
  return (
    <AppCard className="h-full">
      <AppCardHeader className="flex-row items-center justify-between space-y-0">
        <AppCardTitle className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          واصل التعلم
        </AppCardTitle>
      </AppCardHeader>
      <AppCardContent>
        {items.length === 0 ? (
          <AppEmptyState
            variant="compact"
            icon={BookOpen}
            title="لا توجد دورات جارية"
            description="سجّل في دورة جديدة لتبدأ رحلة التعلم."
          />
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.enrollmentId}>
                <Link
                  href={`/courses/${item.courseSlug}`}
                  className="group flex gap-4 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div
                    className={cn(
                      "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg text-lg font-bold text-primary",
                      "bg-gradient-to-br from-primary/20 to-warning/20",
                    )}
                  >
                    {item.courseTitle.slice(0, 1)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold">{item.courseTitle}</h4>
                        {item.nextLessonTitle && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            التالي: {item.nextLessonTitle}
                          </p>
                        )}
                      </div>
                      <AppBadge variant="outline" className="shrink-0 text-xs">
                        {formatNumber(item.progressPercent)}%
                      </AppBadge>
                    </div>

                    <AppProgress value={item.progressPercent} size="sm" />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatNumber(item.completedLessonsCount)} من{" "}
                        {formatNumber(item.totalLessonsCount)} درس
                      </span>
                      {item.nextLessonId && (
                        <span className="inline-flex items-center gap-1 text-primary transition-transform group-hover:-translate-x-1">
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
      </AppCardContent>
    </AppCard>
  );
}
