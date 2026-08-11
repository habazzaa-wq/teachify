"use client";

import { AlarmClock, CalendarDays, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CalendarDay, CalendarItemType } from "../types";
import { useBrandTheme } from "./StudentCard";
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  BRAND_TEXT_ON_PRIMARY,
  BRAND_TEXT_ON_SECONDARY,
  CALENDAR_ITEM_LABELS,
} from "../constants";
import { formatDate, formatNumber } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";

interface CalendarViewProps {
  calendar: CalendarDay[];
}

const ICON_BY_TYPE: Record<CalendarItemType, LucideIcon> = {
  exam_due: AlarmClock,
  course_ends: GraduationCap,
};

function accentForType(type: CalendarItemType): string {
  return type === "exam_due" ? BRAND_SECONDARY : BRAND_PRIMARY;
}

interface ParsedDay {
  weekday: string;
  dayNumber: number;
  month: string;
  year: number;
}

function parseDay(date: string): ParsedDay | null {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    weekday: new Intl.DateTimeFormat("ar", { weekday: "long" }).format(parsed),
    dayNumber: parsed.getDate(),
    month: new Intl.DateTimeFormat("ar", { month: "long" }).format(parsed),
    year: parsed.getFullYear(),
  };
}

export function CalendarView({ calendar }: CalendarViewProps) {
  const t = useBrandTheme();

  return (
    <div>
      <SectionHeader
        index={7}
        eyebrow="جدولك"
        title="المواعيد"
        subtitle="اختبارات ونهايات دورات خلال الثلاثين يومًا القادمة."
        action={
          calendar.length > 0 ? (
            <span
              className="rounded-full px-3 py-1.5 text-xs font-black tabular-nums"
              style={{ backgroundColor: t.chipBg, color: t.muted, border: `1px solid ${t.cardBorder}` }}
            >
              {formatNumber(calendar.length)} موعد
            </span>
          ) : undefined
        }
      />

      {calendar.length === 0 ? (
        <div
          className="rounded-[1.5rem] border"
          style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}
        >
          <EmptyState
            icon={CalendarDays}
            title="لا توجد مواعيد قريبة"
            description="لا اختبارات ولا دورات تنتهي في الشهر القادم. وقت مثالي للتعلّم."
          />
        </div>
      ) : (
        <div className="space-y-5">
          {calendar.map((day, index) => {
            const parsed = parseDay(day.date);
            const totalItems = day.items.length;

            return (
              <div
                key={day.date}
                className="overflow-hidden rounded-[1.5rem] border"
                style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}
              >
                {/* day header */}
                <div
                  className="flex items-center gap-4 border-b p-4 sm:gap-5"
                  style={{ borderColor: t.divider }}
                >
                  <div
                    className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl"
                    style={{
                      background: `linear-gradient(140deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                      color: BRAND_TEXT_ON_PRIMARY,
                      boxShadow: "0 8px 18px rgba(0,0,0,0.2)",
                    }}
                  >
                    <span className="text-[10px] font-black" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {parsed?.weekday}
                    </span>
                    <span className="text-2xl font-black tabular-nums leading-tight">
                      {parsed?.dayNumber ?? index + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black" style={{ color: t.ink }}>
                      {parsed ? `${parsed.weekday}، ${formatDate(day.date)}` : formatDate(day.date)}
                    </p>
                    <p className="mt-0.5 text-xs font-bold" style={{ color: t.muted }}>
                      {parsed ? `${parsed.month} ${parsed.year}` : "موعد"}
                    </p>
                  </div>
                  <span
                    className="ms-auto shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black tabular-nums"
                    style={{ backgroundColor: t.chipBg, color: t.muted, border: `1px solid ${t.cardBorder}` }}
                  >
                    {formatNumber(totalItems)} {totalItems === 1 ? "موعد" : "مواعيد"}
                  </span>
                </div>

                {/* items */}
                <ul>
                  {day.items.map((item, itemIndex) => {
                    const Icon = ICON_BY_TYPE[item.type] ?? AlarmClock;
                    const accent = accentForType(item.type);

                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-300 sm:gap-4"
                        style={{
                          backgroundColor: t.cardBg,
                          borderTop: itemIndex === 0 ? undefined : `1px solid ${t.divider}`,
                        }}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: accent,
                            color: accent === BRAND_SECONDARY ? BRAND_TEXT_ON_SECONDARY : BRAND_TEXT_ON_PRIMARY,
                            boxShadow: "0 4px 10px rgba(0,0,0,0.14)",
                          }}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-black" style={{ color: t.ink }}>
                          {item.title}
                        </p>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black"
                          style={{ backgroundColor: t.chipBg, color: accent, border: `1px solid ${t.cardBorder}` }}
                        >
                          {CALENDAR_ITEM_LABELS[item.type] ?? "موعد"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
