"use client";

import Link from "next/link";
import { AlarmClock, CalendarClock, PlaySquare } from "lucide-react";
import type { UpcomingTask } from "../types";
import {
  StudentCard,
  StudentCardHeader,
  StudentChip,
  StudentEmptyState,
  useBrandTheme,
  contrastFor,
} from "./StudentCard";
import { BRAND_PRIMARY, BRAND_SECONDARY } from "../constants";
import { formatDateTime } from "@/lib/format";

interface UpcomingTasksSectionProps {
  tasks: UpcomingTask[];
}

export function UpcomingTasksSection({ tasks }: UpcomingTasksSectionProps) {
  const t = useBrandTheme();

  return (
    <StudentCard className="h-full">
      <StudentCardHeader
        icon={CalendarClock}
        title="المهام القادمة"
        subtitle="اختبارات ومواعيد تنتهي قريبًا"
        accent={BRAND_SECONDARY}
      />
      <div className="p-5 sm:p-6">
        {tasks.length === 0 ? (
          <StudentEmptyState
            icon={CalendarClock}
            title="لا توجد مهام قادمة"
            description="أنت على اطلاع كامل بكل المهام."
            accent={BRAND_SECONDARY}
          />
        ) : (
          <ul className="space-y-2.5">
            {tasks.map((task) => {
              const isExam = task.type === "exam";
              const Icon = isExam ? AlarmClock : PlaySquare;
              const accent = isExam ? BRAND_SECONDARY : BRAND_PRIMARY;

              return (
                <li key={task.id}>
                  <Link
                    href={task.link}
                    className="group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      border: `1px solid ${t.cardBorder}`,
                      background: t.chipBg,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: accent,
                          color: contrastFor(accent),
                          boxShadow: "0 4px 10px rgba(0,0,0,0.11)",
                        }}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold" style={{ color: t.ink }}>
                          {task.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs" style={{ color: t.muted }}>
                          {task.dueAt ? formatDateTime(task.dueAt) : "بدون موعد محدد"}
                        </p>
                      </div>
                    </div>
                    <StudentChip accent={accent} className="shrink-0">
                      {isExam ? "اختبار" : "دورة"}
                    </StudentChip>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </StudentCard>
  );
}
