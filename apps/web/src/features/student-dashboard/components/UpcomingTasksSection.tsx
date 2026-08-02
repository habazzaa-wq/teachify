"use client";

import Link from "next/link";
import { AlarmClock, CalendarClock, PlaySquare } from "lucide-react";
import type { UpcomingTask } from "../types";
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui/AppCard";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { AppBadge } from "@/components/ui/AppBadge";
import { formatDateTime } from "@/lib/format";

interface UpcomingTasksSectionProps {
  tasks: UpcomingTask[];
}

export function UpcomingTasksSection({ tasks }: UpcomingTasksSectionProps) {
  return (
    <AppCard className="h-full">
      <AppCardHeader>
        <AppCardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          المهام القادمة
        </AppCardTitle>
      </AppCardHeader>
      <AppCardContent>
        {tasks.length === 0 ? (
          <AppEmptyState
            variant="compact"
            icon={CalendarClock}
            title="لا توجد مهام قادمة"
            description="أنت على اطلاع كامل بكل المهام."
          />
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const Icon = task.type === "exam" ? AlarmClock : PlaySquare;

              return (
                <li key={task.id}>
                  <Link
                    href={task.link}
                    className="group flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={
                          task.priority === "high"
                            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                        }
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{task.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {task.dueAt ? formatDateTime(task.dueAt) : "بدون موعد محدد"}
                        </p>
                      </div>
                    </div>
                    <AppBadge
                      variant={task.priority === "high" ? "destructive" : "outline"}
                      className="shrink-0 text-xs"
                    >
                      {task.type === "exam" ? "اختبار" : "دورة"}
                    </AppBadge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </AppCardContent>
    </AppCard>
  );
}
