"use client";

import { AlarmClock, CalendarDays, GraduationCap } from "lucide-react";
import type { CalendarDay, CalendarItemType } from "../types";
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui/AppCard";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { AppBadge } from "@/components/ui/AppBadge";
import { CALENDAR_ITEM_LABELS } from "../constants";
import { formatDate } from "@/lib/format";

interface CalendarSectionProps {
  calendar: CalendarDay[];
}

const itemStyles: Record<CalendarItemType, { icon: typeof AlarmClock; className: string }> = {
  exam_due: { icon: AlarmClock, className: "bg-destructive/10 text-destructive" },
  course_ends: { icon: GraduationCap, className: "bg-primary/10 text-primary" },
};

function weekdayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ar", { weekday: "long" }).format(parsed);
}

export function CalendarSection({ calendar }: CalendarSectionProps) {
  return (
    <AppCard className="h-full">
      <AppCardHeader>
        <AppCardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
          المواعيد القادمة
        </AppCardTitle>
      </AppCardHeader>
      <AppCardContent>
        {calendar.length === 0 ? (
          <AppEmptyState
            variant="compact"
            icon={CalendarDays}
            title="لا توجد مواعيد قريبة"
            description="لا توجد اختبارات أو دورات تنتهي خلال الثلاثين يومًا القادمة."
          />
        ) : (
          <ul className="space-y-3">
            {calendar.map((day) => (
              <li key={day.date} className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{weekdayLabel(day.date)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(day.date)}</span>
                </div>
                <ul className="space-y-1.5">
                  {day.items.map((item) => {
                    const config = itemStyles[item.type] ?? itemStyles.exam_due;
                    const Icon = config.icon;

                    return (
                      <li key={item.id} className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${config.className}`}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                        <AppBadge variant="outline" className="shrink-0 text-[10px]">
                          {CALENDAR_ITEM_LABELS[item.type] ?? "موعد"}
                        </AppBadge>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </AppCardContent>
    </AppCard>
  );
}
