"use client";

import {
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Flame,
  PlaySquare,
  Star,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TimelineEvent, TimelineEventType } from "../types";
import {
  StudentCard,
  StudentCardHeader,
  StudentEmptyState,
  useBrandTheme,
} from "./StudentCard";
import { BRAND_PRIMARY, BRAND_SECONDARY, TIMELINE_EVENT_LABELS } from "../constants";
import { formatDate } from "@/lib/format";
import { brandAlpha } from "@/lib/brand";

interface TimelineSectionProps {
  events: TimelineEvent[];
}

const ICON_BY_TYPE: Record<TimelineEventType, LucideIcon> = {
  course_enrolled: BookOpen,
  lesson_progressed: PlaySquare,
  lesson_completed: CheckCircle2,
  course_completed: Trophy,
  exam_submitted: FileCheck2,
  exam_passed: BadgeCheck,
  certificate_issued: Award,
};

function accentForType(type: TimelineEventType): string {
  if (
    type === "exam_passed" ||
    type === "certificate_issued" ||
    type === "course_completed"
  ) {
    return BRAND_SECONDARY;
  }
  return BRAND_PRIMARY;
}

export function TimelineSection({ events }: TimelineSectionProps) {
  const t = useBrandTheme();

  return (
    <StudentCard className="h-full">
      <StudentCardHeader
        icon={Flame}
        title="آخر نشاطك"
        subtitle="أحدث الأنشطة والإنجازات"
        accent={BRAND_SECONDARY}
      />
      <div className="p-5 sm:p-6">
        {events.length === 0 ? (
          <StudentEmptyState
            icon={Flame}
            title="لا يوجد نشاط بعد"
            description="ابدأ بالتعلم ليظهر نشاطك هنا."
            accent={BRAND_SECONDARY}
          />
        ) : (
          <ul className="space-y-2.5">
            {events.map((event) => {
              const Icon = ICON_BY_TYPE[event.type] ?? Star;
              const accent = accentForType(event.type);

              return (
                <li key={event.id}>
                  <div
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
                          backgroundColor: brandAlpha(accent, 0.102),
                          color: accent,
                          boxShadow: `0 4px 10px ${brandAlpha(accent, 0.11)}`,
                        }}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold" style={{ color: t.ink }}>
                          {event.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs" style={{ color: t.muted }}>
                          {TIMELINE_EVENT_LABELS[event.type] ?? "نشاط"}
                        </p>
                      </div>
                    </div>
                    <span
                      className="shrink-0 text-[11px] font-medium tabular-nums"
                      style={{ color: t.muted }}
                    >
                      {formatDate(event.occurredAt)}
                    </span>
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
