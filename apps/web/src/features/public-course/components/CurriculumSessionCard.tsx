"use client";

import { memo, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  Radio,
  MapPinned,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { PublicCourseModule, PublicCourseSession } from "../types";

interface Props {
  module: PublicCourseModule;
}

const sessionTypeConfig: Record<
  PublicCourseSession["sessionType"],
  { label: string; icon: typeof Video; chip: string; accent: string; soft: string }
> = {
  live: {
    label: "جلسة مباشرة",
    icon: Radio,
    chip: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    accent: "text-red-600 dark:text-red-400",
    soft: "bg-red-500/10",
  },
  field: {
    label: "جلسة ميدانية",
    icon: MapPinned,
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    accent: "text-amber-700 dark:text-amber-400",
    soft: "bg-amber-500/10",
  },
  offline: {
    label: "جلسة حضورية",
    icon: MapPin,
    chip: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
    accent: "text-teal-700 dark:text-teal-400",
    soft: "bg-teal-500/10",
  },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: "مجدولة", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" },
  completed: { label: "مكتملة", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
  cancelled: { label: "ملغاة", className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20" },
  draft: { label: "مسودة", className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20" },
};

function formatDateTime(iso: string | null | undefined, timezone?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone || undefined,
    }).format(d);
  } catch {
    return d.toLocaleString("ar-EG");
  }
}

function formatTimeRange(session: PublicCourseSession) {
  const start = formatDateTime(session.startsAtUtc, session.timezone);
  const end = session.endsAtUtc
    ? (() => {
        const d = new Date(session.endsAtUtc);
        if (Number.isNaN(d.getTime())) return null;
        try {
          return new Intl.DateTimeFormat("ar-EG", {
            timeStyle: "short",
            timeZone: session.timezone || undefined,
          }).format(d);
        } catch {
          return d.toLocaleTimeString("ar-EG");
        }
      })()
    : null;
  if (!start) return null;
  return end ? `${start} — ${end}` : start;
}

function CurriculumSessionCardInner({ module }: Props) {
  const session = module.courseSession;
  const type = session?.sessionType ?? "live";
  const cfg = sessionTypeConfig[type] ?? sessionTypeConfig.live;
  const status = (statusConfig[session?.status ?? "scheduled"] ?? statusConfig.scheduled)!;
  const Icon = cfg.icon;

  const timeRange = useMemo(() => (session ? formatTimeRange(session) : null), [session]);
  const description = session?.description || module.description;
  const hasMeeting = !!session?.meetingUrl;
  const hasLocation = !!(session?.locationName || session?.locationAddress);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border",
        "border-teal-500/20 dark:border-teal-400/15",
        "bg-gradient-to-br from-teal-500/[0.04] via-card to-cyan-500/[0.03]",
        "shadow-sm"
      )}
    >
      {/* Accent bar */}
      <div className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-teal-500 to-cyan-500" />

      <div className="p-4 sm:p-5 ps-5 sm:ps-6">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-3">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", cfg.soft, cfg.accent)}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold", cfg.chip)}>
                {cfg.label}
              </span>
              <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold", status.className)}>
                {status.label}
              </span>
            </div>
            <h3 className="text-base font-bold leading-snug text-foreground sm:text-[17px]">
              {session?.title || module.title}
            </h3>
            {description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* Details - always open */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {timeRange && (
            <div className="flex items-start gap-2.5 rounded-xl bg-background/70 px-3 py-2.5 border border-border/40">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-muted-foreground">الموعد</div>
                <div className="text-sm font-medium text-foreground">{timeRange}</div>
                {session?.timezone && (
                  <div className="text-[11px] text-muted-foreground/80">{session.timezone}</div>
                )}
              </div>
            </div>
          )}

          {(hasLocation || type !== "live") && (
            <div className="flex items-start gap-2.5 rounded-xl bg-background/70 px-3 py-2.5 border border-border/40">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-muted-foreground">
                  {type === "live" ? "المكان / الرابط" : "المكان"}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {session?.locationName || (type === "live" ? "عبر الإنترنت" : "سيتم تحديد المكان")}
                </div>
                {session?.locationAddress && (
                  <div className="text-[11px] text-muted-foreground/80">{session.locationAddress}</div>
                )}
              </div>
            </div>
          )}

          {hasMeeting && (
            <div className="flex items-start gap-2.5 rounded-xl bg-background/70 px-3 py-2.5 border border-border/40 sm:col-span-2">
              <Video className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-muted-foreground">رابط الجلسة</div>
                <a
                  href={session!.meetingUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 underline-offset-2 hover:underline"
                >
                  <span className="truncate max-w-[280px] sm:max-w-md">{session!.meetingUrl}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <Info className="h-3.5 w-3.5" />
          <span>جلسة ضمن منهج الكورس — التفاصيل معروضة لك لأنك مشترك.</span>
        </div>
      </div>
    </div>
  );
}

export const CurriculumSessionCard = memo(CurriculumSessionCardInner);
