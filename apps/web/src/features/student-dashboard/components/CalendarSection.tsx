"use client";

import { AlarmClock, CalendarDays, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CalendarDay, CalendarItemType } from "../types";
import {
  StudentCard,
  StudentCardHeader,
  StudentChip,
  StudentEmptyState,
  useBrandTheme,
} from "./StudentCard";
import { BRAND_PRIMARY, BRAND_SECONDARY, CALENDAR_ITEM_LABELS } from "../constants";
import { formatDate } from "@/lib/format";

interface CalendarSectionProps {
  calendar: CalendarDay[];
}

const ICON_BY_TYPE: Record<CalendarItemType, LucideIcon> = {
  exam_due: AlarmClock,
  course_ends: GraduationCap,
};

function accentForType(type: CalendarItemType): string {
  return type === "exam_due" ? BRAND_SECONDARY : BRAND_PRIMARY;
}

function weekdayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ar", { weekday: "long" }).format(parsed);
}

export function CalendarSection({ calendar }: CalendarSectionProps) {
  const t = useBrandTheme();

  return (
    <StudentCard className="h-full">
      <StudentCardHeader
        icon={CalendarDays}
        title="المواعيد القادمة"
        subtitle="اختبارات ومواعيد نهاية الدورات"
        accent={BRAND_PRIMARY}
      />
      <div className="p-5 sm:p-6">
        {calendar.length === 0 ? (
          <StudentEmptyState
            icon={CalendarDays}
            title="لا توجد مواعيد قريبة"
            description="لا توجد اختبارات أو دورات تنتهي خلال الثلاثين يومًا القادمة."
            accent={BRAND_PRIMARY}
          />
        ) : (
          <ul className="space-y-3">
            {calendar.map((day) => (
              <li
                key={day.date}
                className="rounded-2xl border p-3"
                style={{
                  border: `1px solid ${t.cardBorder}`,
                  background: t.chipBg,
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: t.ink }}>
                    {weekdayLabel(day.date)}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: t.muted }}>
                    {formatDate(day.date)}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {day.items.map((item) => {
                    const Icon = ICON_BY_TYPE[item.type] ?? AlarmClock;
                    const accent = accentForType(item.type);

                    return (
                      <li key={item.id} className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                          style={{
                            backgroundColor: `${accent}1a`,
                            color: accent,
                          }}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm" style={{ color: t.ink }}>
                          {item.title}
                        </span>
                        <StudentChip accent={accent} className="shrink-0">
                          {CALENDAR_ITEM_LABELS[item.type] ?? "موعد"}
                        </StudentChip>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StudentCard>
  );
}
