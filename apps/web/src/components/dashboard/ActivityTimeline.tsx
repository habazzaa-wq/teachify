"use client";

import { cn } from "@/lib/cn";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type: "create" | "update" | "delete" | "login" | "warning" | "info";
}

const typeConfig = {
  create: { dot: "bg-success", line: "bg-success/20" },
  update: { dot: "bg-primary", line: "bg-primary/20" },
  delete: { dot: "bg-destructive", line: "bg-destructive/20" },
  login: { dot: "bg-primary", line: "bg-primary/20" },
  warning: { dot: "bg-warning", line: "bg-warning/20" },
  info: { dot: "bg-muted-foreground", line: "bg-muted-foreground/20" },
};

interface ActivityTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
            <div className="h-full w-px animate-pulse bg-muted" />
          </div>
          <div className="flex-1 space-y-1.5 pb-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTimeline({ events, loading }: ActivityTimelineProps) {
  if (loading) return <TimelineSkeleton />;

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-2 text-3xl">📭</div>
        <p className="text-sm font-medium text-muted-foreground">لا توجد نشاطات حديثة</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {events.map((event, index) => {
        const config = typeConfig[event.type];
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={cn("z-10 h-2.5 w-2.5 rounded-full ring-2 ring-background", config.dot)} />
              {!isLast && (
                <div className={cn("h-full w-px", config.line)} />
              )}
            </div>

            {/* Content */}
            <div className={cn("flex-1 pb-5", isLast && "pb-0")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium leading-tight">{event.title}</p>
                  {event.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground/60">
                  {event.timestamp}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { ActivityTimeline };
export type { TimelineEvent };
