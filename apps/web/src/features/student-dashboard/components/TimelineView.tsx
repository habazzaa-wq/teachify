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
import { useBrandTheme } from "./StudentCard";
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  BRAND_TEXT_ON_PRIMARY,
  BRAND_TEXT_ON_SECONDARY,
  TIMELINE_EVENT_LABELS,
} from "../constants";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";

interface TimelineViewProps {
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
  return type === "exam_passed" || type === "certificate_issued" || type === "course_completed"
    ? BRAND_SECONDARY
    : BRAND_PRIMARY;
}

export function TimelineView({ events }: TimelineViewProps) {
  const t = useBrandTheme();

  return (
    <div>
      <SectionHeader
        index={5}
        eyebrow="أثرك الرقمي"
        title="النشاط"
        subtitle="أحدث ما حققته في رحلة تعلّمك."
      />

      {events.length === 0 ? (
        <div
          className="rounded-[1.5rem] border"
          style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}
        >
          <EmptyState
            icon={Flame}
            title="لا يوجد نشاط بعد"
            description="ابدأ بالتعلم أو قدّم اختبارًا ليظهر نشاطك هنا."
            accent={BRAND_SECONDARY}
          />
        </div>
      ) : (
        <div className="relative">
          {/* rail line */}
          <div
            className="absolute bottom-4 right-[27px] top-4 w-px"
            style={{
              background: t.isDark
                ? "linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent)"
                : "linear-gradient(180deg, transparent, rgba(0,0,0,0.12), transparent)",
            }}
            aria-hidden="true"
          />

          <ul className="space-y-5">
            {events.map((event, index) => {
              const Icon = ICON_BY_TYPE[event.type] ?? Star;
              const accent = accentForType(event.type);
              const isNewest = index === 0;

              return (
                <li key={event.id} className="relative flex items-stretch gap-5">
                  {/* dot */}
                  <div className="relative z-10 shrink-0">
                    {isNewest && (
                      <span
                        className="absolute -inset-2 animate-ping rounded-full opacity-30"
                        style={{ backgroundColor: accent }}
                        aria-hidden="true"
                      />
                    )}
                    <div
                      className="relative flex h-[54px] w-[54px] items-center justify-center rounded-full border-2"
                      style={{
                        backgroundColor: t.cardBg,
                        borderColor: accent,
                        color: accent === BRAND_SECONDARY ? BRAND_TEXT_ON_SECONDARY : BRAND_TEXT_ON_PRIMARY,
                        boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                      }}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>

                  {/* card */}
                  <div
                    className="flex min-w-0 flex-1 flex-col justify-center rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 sm:p-5"
                    style={{
                      borderColor: t.cardBorder,
                      backgroundColor: t.cardBg,
                      boxShadow: t.cardShadow,
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-black sm:text-[15px]" style={{ color: t.ink }}>
                        {event.title}
                      </p>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black tabular-nums"
                        style={{ backgroundColor: t.chipBg, color: t.muted, border: `1px solid ${t.cardBorder}` }}
                      >
                        {formatDate(event.occurredAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold" style={{ color: t.muted }}>
                      {TIMELINE_EVENT_LABELS[event.type] ?? "نشاط"}
                      {event.description ? ` · ${event.description}` : ""}
                    </p>
                    <span className="mt-1.5 text-[10px] font-bold tabular-nums" style={{ color: t.faint }}>
                      {formatDateTime(event.occurredAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="ms-[74px] mt-2 text-[11px] font-black tabular-nums" style={{ color: t.faint }}>
            {formatNumber(events.length)} نشاط
          </div>
        </div>
      )}
    </div>
  );
}
