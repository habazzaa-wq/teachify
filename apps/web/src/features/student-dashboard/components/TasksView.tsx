"use client";

import Link from "next/link";
import { AlarmClock, CalendarClock, PlaySquare } from "lucide-react";
import type { UpcomingTask } from "../types";
import { useBrandTheme } from "./StudentCard";
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  BRAND_TEXT_ON_PRIMARY,
  BRAND_TEXT_ON_SECONDARY,
} from "../constants";
import { formatDateTime, formatNumber } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";

interface TasksViewProps {
  tasks: UpcomingTask[];
}

export function TasksView({ tasks }: TasksViewProps) {
  const t = useBrandTheme();

  return (
    <div>
      <SectionHeader
        index={4}
        eyebrow="التزاماتك"
        title="المهام"
        subtitle="اختبارات ومواعيد تحتاج انتباهك قريبًا."
        action={
          tasks.length > 0 ? (
            <span
              className="rounded-full px-3 py-1.5 text-xs font-black tabular-nums"
              style={{ backgroundColor: t.chipBg, color: t.muted, border: `1px solid ${t.cardBorder}` }}
            >
              {formatNumber(tasks.length)} مهمة
            </span>
          ) : undefined
        }
      />

      {tasks.length === 0 ? (
        <div
          className="rounded-[1.5rem] border"
          style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}
        >
          <EmptyState
            icon={CalendarClock}
            title="لا توجد مهام قادمة"
            description="أنت على اطلاع كامل — لا مواعيد تنتهي خلال الأيام القادمة."
            accent={BRAND_SECONDARY}
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const isExam = task.type === "exam";
            const accent = isExam ? BRAND_SECONDARY : BRAND_PRIMARY;
            const Icon = isExam ? AlarmClock : PlaySquare;

            return (
              <li
                key={task.id}
                className="rounded-[1.25rem] border p-4 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  borderColor: task.priority === "high" ? accent : t.cardBorder,
                  backgroundColor: t.cardBg,
                  boxShadow:
                    task.priority === "high"
                      ? `0 6px 20px ${t.isDark ? "rgba(0,0,0,0.35)" : `${accent}22`}`
                      : t.cardShadow,
                }}
              >
                <Link href={task.link} className="flex items-center gap-4">
                  <span
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: accent,
                      color: accent === BRAND_SECONDARY ? BRAND_TEXT_ON_SECONDARY : BRAND_TEXT_ON_PRIMARY,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
                    }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black" style={{ color: t.ink }}>
                      {task.title}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold tabular-nums" style={{ color: t.muted }}>
                      <CalendarClock className="h-3.5 w-3.5" style={{ color: BRAND_PRIMARY }} aria-hidden="true" />
                      {task.dueAt ? formatDateTime(task.dueAt) : "بدون موعد محدد"}
                      {task.priority === "high" && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-black"
                          style={{ backgroundColor: BRAND_SECONDARY, color: BRAND_TEXT_ON_SECONDARY }}
                        >
                          عاجل
                        </span>
                      )}
                    </p>
                  </div>

                  <span
                    className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black"
                    style={{ backgroundColor: accent, color: accent === BRAND_SECONDARY ? BRAND_TEXT_ON_SECONDARY : BRAND_TEXT_ON_PRIMARY }}
                  >
                    {isExam ? "اختبار" : "دورة"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
