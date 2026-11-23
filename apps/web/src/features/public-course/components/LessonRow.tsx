"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Download,
  Lock,
  Award,
  Play,
  CalendarDays,
  MapPin,
  Video,
  ExternalLink,
  Radio,
  MapPinned,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getLessonConfig, formatDuration } from "../utils";
import type { PublicCourseLesson } from "../types";

interface LessonRowProps {
  lesson: PublicCourseLesson;
  isEnrolled: boolean;
  onLockedClick: () => void;
  onPlay?: (lesson: PublicCourseLesson) => void;
  isPreview?: boolean;
}

function isSessionLesson(lesson: PublicCourseLesson) {
  return (
    lesson.lessonType === "session" ||
    lesson.lessonType === "live_session" ||
    !!lesson.courseSessionId
  );
}

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

function formatTimeRange(startsAtUtc?: string | null, endsAtUtc?: string | null, timezone?: string | null) {
  const start = formatDateTime(startsAtUtc, timezone);
  if (!start) return null;
  const end = endsAtUtc
    ? (() => {
        const d = new Date(endsAtUtc);
        if (Number.isNaN(d.getTime())) return null;
        try {
          return new Intl.DateTimeFormat("ar-EG", { timeStyle: "short", timeZone: timezone || undefined }).format(d);
        } catch {
          return d.toLocaleTimeString("ar-EG");
        }
      })()
    : null;
  return end ? `${start} — ${end}` : start;
}

const sessionTypeMap = {
  live: { label: "جلسة مباشرة", icon: Radio, chip: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  field: { label: "جلسة ميدانية", icon: MapPinned, chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  offline: { label: "جلسة حضورية", icon: MapPin, chip: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20" },
} as const;

function SessionLessonCard({
  lesson,
  isEnrolled,
  onLockedClick,
}: Pick<LessonRowProps, "lesson" | "isEnrolled" | "onLockedClick">) {
  const session = lesson.courseSession;
  const type = (session?.sessionType ?? "live") as keyof typeof sessionTypeMap;
  const cfg = sessionTypeMap[type] ?? sessionTypeMap.live;
  const Icon = cfg.icon;
  const timeRange = formatTimeRange(session?.startsAtUtc, session?.endsAtUtc, session?.timezone);
  const description = session?.description || lesson.shortDescription;
  const location = session?.locationName || session?.locationAddress;
  const meetingUrl = session?.meetingUrl;

  if (!isEnrolled) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        className="w-full text-start rounded-xl border border-teal-500/20 bg-teal-500/[0.03] p-3 transition-colors hover:bg-teal-500/[0.06]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold", cfg.chip)}>{cfg.label}</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground/90 line-clamp-1">{lesson.title}</div>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Lock className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/[0.04] via-background to-cyan-500/[0.03] p-3 sm:p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold", cfg.chip)}>{cfg.label}</span>
            <span className="text-[10px] text-muted-foreground">جلسة</span>
          </div>
          <h4 className="mt-1 text-sm font-bold text-foreground sm:text-[15px]">{session?.title || lesson.title}</h4>
          {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {timeRange && (
          <div className="flex items-start gap-2 rounded-lg bg-background/70 border border-border/40 px-2.5 py-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-muted-foreground">الموعد</div>
              <div className="text-xs font-medium text-foreground">{timeRange}</div>
              {session?.timezone && <div className="text-[11px] text-muted-foreground/70">{session.timezone}</div>}
            </div>
          </div>
        )}
        {location && (
          <div className="flex items-start gap-2 rounded-lg bg-background/70 border border-border/40 px-2.5 py-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-muted-foreground">المكان</div>
              <div className="text-xs font-medium text-foreground">{session?.locationName || location}</div>
              {session?.locationAddress && <div className="text-[11px] text-muted-foreground/70">{session.locationAddress}</div>}
            </div>
          </div>
        )}
        {meetingUrl && (
          <div className="flex items-start gap-2 rounded-lg bg-background/70 border border-border/40 px-2.5 py-2 sm:col-span-2">
            <Video className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-muted-foreground">رابط الجلسة</div>
              <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline dark:text-teal-400">
                <span className="truncate max-w-[260px] sm:max-w-md">{meetingUrl}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
        <Info className="h-3.5 w-3.5" />
        <span>تفاصيل الجلسة ظاهرة لك لأنك مشترك في الكورس.</span>
      </div>
    </div>
  );
}

function LessonRowInner({
  lesson,
  isEnrolled,
  onLockedClick,
  onPlay,
  isPreview = false,
}: LessonRowProps) {
  const config = useMemo(() => getLessonConfig(lesson), [lesson]);
  const TypeIcon = config.icon;

  if (isSessionLesson(lesson)) {
    return <SessionLessonCard lesson={lesson} isEnrolled={isEnrolled} onLockedClick={onLockedClick} />;
  }

  const duration = useMemo(
    () => formatDuration(lesson.durationSeconds ?? lesson.estimatedDuration),
    [lesson.durationSeconds, lesson.estimatedDuration],
  );

  const hasExam = !!lesson.examId;
  const hasResources = (lesson.filesCount ?? 0) > 0 || lesson.downloadable;
  const isLocked = !isEnrolled;
  const showPreview = isPreview && lesson.freePreview;

  const handleActivate = () => {
    if (isLocked) {
      onLockedClick();
      return;
    }
    onPlay?.(lesson);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      aria-label={isLocked ? `الدرس مقفل: ${lesson.title}` : lesson.title}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
      className={cn(
        "group/lesson flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200",
        "dark:hover:bg-white/[0.03]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-inset",
      )}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover/lesson:scale-105"
        style={{ backgroundColor: `${config.color}16` }}
      >
        <TypeIcon className="h-4 w-4" style={{ color: config.color }} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="line-clamp-1 text-sm font-semibold leading-snug text-foreground/90 transition-colors duration-200 group-hover/lesson:text-foreground">
            {lesson.title}
          </span>
          {showPreview && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
              <Play className="h-2.5 w-2.5 fill-current" />
              معاينة مجانية
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground/60">
          {duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {duration}
            </span>
          )}
          {hasExam && (
            <span className="inline-flex items-center gap-1 text-amber-600/70 dark:text-amber-400/70">
              <Award className="h-3 w-3" />
              امتحان
            </span>
          )}
          {hasResources && (
            <span className="inline-flex items-center gap-1">
              <Download className="h-3 w-3" />
              مرفقات
            </span>
          )}
        </div>
      </div>

      {isLocked ? (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 transition-transform duration-200 group-hover/lesson:scale-110 dark:text-amber-400">
          <Lock className="h-3.5 w-3.5" />
        </div>
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)] transition-transform duration-200 group-hover/lesson:scale-110">
          <Play className="h-3.5 w-3.5 fill-current" />
        </div>
      )}
    </motion.div>
  );
}

const LessonRow = memo(LessonRowInner);

export { LessonRow };
export type { LessonRowProps };
