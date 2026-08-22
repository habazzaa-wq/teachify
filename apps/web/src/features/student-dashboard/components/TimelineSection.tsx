"use client";

import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Award,
  BadgeCheck,
  FileCheck,
  FileX,
} from "lucide-react";
import type { TimelineEvent, TimelineEventType } from "../types";
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui/AppCard";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { TIMELINE_EVENT_LABELS } from "../constants";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

interface TimelineSectionProps {
  events: TimelineEvent[];
}

const eventStyles: Record<TimelineEventType, { icon: typeof Clock3; className: string }> = {
  course_enrolled: { icon: BookOpen, className: "bg-primary/10 text-primary" },
  lesson_progressed: { icon: Clock3, className: "bg-cyan-500/10 text-cyan-600" },
  lesson_completed: { icon: CheckCircle2, className: "bg-success/10 text-success" },
  course_completed: { icon: Award, className: "bg-success/10 text-success" },
  exam_submitted: { icon: FileCheck, className: "bg-muted text-muted-foreground" },
  exam_passed: { icon: BadgeCheck, className: "bg-warning/10 text-warning" },
  certificate_issued: { icon: FileX, className: "bg-primary/10 text-primary" },
};

export function TimelineSection({ events }: TimelineSectionProps) {
  return (
    <AppCard className="h-full">
      <AppCardHeader>
        <AppCardTitle className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
          النشاط الأخير
        </AppCardTitle>
      </AppCardHeader>
      <AppCardContent>
        {events.length === 0 ? (
          <AppEmptyState
            variant="compact"
            icon={Clock3}
            title="لا يوجد نشاط بعد"
            description="سيظهر نشاطك التعليمي هنا تدريجيًا."
          />
        ) : (
          <ol className="relative space-y-4 before:absolute before:inset-y-1 before:start-[15px] before:w-px before:bg-border">
            {events.map((event) => {
              const config = eventStyles[event.type] ?? eventStyles.lesson_progressed;
              const Icon = config.icon;

              return (
                <li key={event.id} className="relative flex gap-3 ps-0">
                  <div
                    className={cn(
                      "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                      config.className,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-medium">{event.title}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {TIMELINE_EVENT_LABELS[event.type] ?? "نشاط"}
                      </span>
                    </div>
                    {event.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                      {formatDateTime(event.occurredAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </AppCardContent>
    </AppCard>
  );
}
