"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  AlarmClock,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Flame,
  GraduationCap,
  MapPin,
  PlaySquare,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { StudentDashboardData } from "../types";
import { useBrandTheme, contrastFor } from "./StudentCard";
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  BRAND_TEXT_ON_PRIMARY,
  BRAND_TEXT_ON_SECONDARY,
} from "../constants";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { AnimatedNumber } from "./AnimatedNumber";
import type { DashboardViewId } from "./NavDock";

interface OverviewViewProps {
  data: StudentDashboardData;
  onNavigate: (id: DashboardViewId) => void;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "تصبح على خير";
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "مساء الخير";
  return "مساء الخير";
}

/* ─── Progress ring ─────────────────────────────────────────────── */
function ProgressRing({ value }: { value: number }) {
  const t = useBrandTheme();
  const size = 172;
  const stroke = 15;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="relative h-[172px] w-[172px] shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="sd-ov-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={BRAND_PRIMARY} />
            <stop offset="100%" stopColor={BRAND_SECONDARY} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)"}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#sd-ov-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={pct}
          suffix="%"
          delay={300}
          className="text-4xl font-black tracking-tight"
        />
        <span className="mt-1 text-xs font-bold" style={{ color: t.muted }}>
          متوسط تقدّمك
        </span>
      </div>
    </div>
  );
}

/* ─── Insights band ─────────────────────────────────────────────── */
const INSIGHTS: {
  key: keyof StudentDashboardData["stats"];
  label: string;
  accent: string;
  suffix?: string;
}[] = [
  { key: "enrolledCoursesCount", label: "دورات مسجّلة", accent: BRAND_PRIMARY },
  { key: "completedCoursesCount", label: "دورات مكتملة", accent: BRAND_SECONDARY },
  { key: "averageExamScorePercent", label: "متوسط الاختبارات", accent: BRAND_PRIMARY, suffix: "%" },
  { key: "certificatesCount", label: "شهادات", accent: BRAND_SECONDARY },
  { key: "currentStreakDays", label: "أيام متتالية", accent: BRAND_PRIMARY },
];

function InsightsBand({ stats }: { stats: StudentDashboardData["stats"] }) {
  const t = useBrandTheme();

  return (
    <section
      aria-label="نظرة سريعة على إحصائياتك"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border md:grid-cols-5"
      style={{
        borderColor: t.cardBorder,
        backgroundColor: t.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
      }}
    >
      {INSIGHTS.map((cell, index) => (
        <div
          key={cell.key}
          className={`p-5 ${index === 4 ? "col-span-2 md:col-span-1" : ""}`}
          style={{ backgroundColor: t.cardBg }}
        >
          <div
            className="mb-3 h-1.5 w-6 rounded-full"
            style={{ backgroundColor: cell.accent }}
            aria-hidden="true"
          />
          <p className="text-2xl font-black tracking-tight sm:text-[26px]" style={{ color: t.ink }}>
            <AnimatedNumber
              value={Number(stats[cell.key] ?? 0)}
              suffix={cell.suffix}
              delay={150 + index * 80}
            />
          </p>
          <p className="mt-1 text-xs font-bold" style={{ color: t.muted }}>
            {cell.label}
          </p>
        </div>
      ))}
    </section>
  );
}

/* ─── Continue learning ─────────────────────────────────────────── */
function CourseCover({
  title,
  thumbnail,
  pct,
  className,
}: {
  title: string;
  thumbnail: string | null;
  pct: number;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {thumbnail ? (
        <img src={thumbnail} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(140deg, ${BRAND_PRIMARY} 0%, ${BRAND_SECONDARY} 120%)`,
          }}
        />
      )}
      {thumbnail && (
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(160deg, rgba(0,0,0,0.02), rgba(0,0,0,0.38))",
          }}
        />
      )}
      {!thumbnail && (
        <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white/90">
          {title.slice(0, 1)}
        </span>
      )}
      <span
        className="absolute bottom-2.5 right-2.5 rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums text-white"
        style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      >
        {formatNumber(pct)}%
      </span>
    </div>
  );
}

function ContinueLearningBlock({
  items,
  onNavigate,
}: {
  items: StudentDashboardData["continueLearning"];
  onNavigate: (id: DashboardViewId) => void;
}) {
  const t = useBrandTheme();
  const [featured, ...rest] = items;

  return (
    <section className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black" style={{ color: t.ink }}>
            واصل التعلّم
          </h3>
          <p className="text-xs font-bold" style={{ color: t.muted }}>
            {items.length > 0
              ? `${formatNumber(items.length)} ${items.length === 1 ? "دورة جارية" : "دورات جارية"}`
              : "دوراتك قيد التقدّم"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("courses")}
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-black transition-all duration-300 hover:-translate-y-0.5"
          style={{
            borderColor: t.isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
            color: t.ink,
          }}
        >
          عرض الكل
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border p-10 text-center" style={{ borderColor: t.cardBorder }}>
          <BookOpen className="h-8 w-8" style={{ color: BRAND_PRIMARY }} aria-hidden="true" />
          <p className="text-sm font-bold" style={{ color: t.ink }}>
            لا توجد دورات جارية حتى الآن
          </p>
          <p className="max-w-xs text-xs leading-relaxed" style={{ color: t.muted }}>
            سجّل في دورة جديدة لتبدأ رحلة التعلّم.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {featured && (
            <Link
              href={`/courses/${featured.courseSlug}`}
              className="group grid gap-4 rounded-[1.5rem] border p-4 transition-all duration-300 hover:-translate-y-1 sm:grid-cols-[10rem_1fr]"
              style={{
                borderColor: t.cardBorder,
                backgroundColor: t.cardBg,
                boxShadow: t.cardShadow,
              }}
            >
              <CourseCover
                title={featured.courseTitle}
                thumbnail={featured.thumbnail}
                pct={featured.progressPercent}
                className="h-36 rounded-2xl sm:h-full sm:min-h-28"
              />
              <div className="flex min-w-0 flex-col justify-between gap-3 py-1">
                <div>
                  <h4 className="truncate text-base font-black" style={{ color: t.ink }}>
                    {featured.courseTitle}
                  </h4>
                  {featured.nextLessonTitle && (
                    <p className="mt-1 truncate text-xs font-bold" style={{ color: t.muted }}>
                      التالي: {featured.nextLessonTitle}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: t.isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, featured.progressPercent))}%`,
                        background: `linear-gradient(90deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold" style={{ color: t.muted }}>
                    <span className="tabular-nums">
                      {formatNumber(featured.completedLessonsCount)} من {formatNumber(featured.totalLessonsCount)} درس
                    </span>
                    {featured.nextLessonId && (
                      <span
                        className="inline-flex items-center gap-1.5 transition-transform duration-300 group-hover:-translate-x-1"
                        style={{ color: BRAND_PRIMARY }}
                      >
                        <PlaySquare className="h-3.5 w-3.5" aria-hidden="true" />
                        متابعة
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {rest.map((item, index) => (
            <Link
              key={item.enrollmentId}
              href={`/courses/${item.courseSlug}`}
              className="group flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                borderColor: t.cardBorder,
                backgroundColor: t.chipBg,
              }}
            >
              <span
                className="hidden w-6 shrink-0 text-left text-xs font-black tabular-nums sm:block"
                style={{ color: t.faint }}
              >
                {formatNumber(index + 2)}
              </span>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-base font-black"
                style={{
                  backgroundColor: BRAND_PRIMARY,
                  color: BRAND_TEXT_ON_PRIMARY,
                }}
              >
                {item.courseTitle.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black" style={{ color: t.ink }}>
                  {item.courseTitle}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(0, item.progressPercent))}%`,
                      backgroundColor: BRAND_PRIMARY,
                    }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-sm font-black tabular-nums" style={{ color: BRAND_PRIMARY }}>
                {formatNumber(item.progressPercent)}%
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Upcoming tasks rail ────────────────────────────────────────── */
function TasksRail({
  tasks,
  onNavigate,
}: {
  tasks: StudentDashboardData["upcomingTasks"];
  onNavigate: (id: DashboardViewId) => void;
}) {
  const t = useBrandTheme();

  return (
    <section className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black" style={{ color: t.ink }}>
            مهام قادمة
          </h3>
          <p className="text-xs font-bold" style={{ color: t.muted }}>
            آخر مواعيدك
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("tasks")}
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-black transition-all duration-300 hover:-translate-y-0.5"
          style={{
            borderColor: t.isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
            color: t.ink,
          }}
        >
          الكل
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div
        className="flex flex-1 flex-col gap-2.5 rounded-[1.5rem] border p-4"
        style={{
          borderColor: t.cardBorder,
          backgroundColor: t.cardBg,
          boxShadow: t.cardShadow,
        }}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CalendarDays className="h-7 w-7" style={{ color: BRAND_SECONDARY }} aria-hidden="true" />
            <p className="text-sm font-black" style={{ color: t.ink }}>
              لا توجد مهام قادمة
            </p>
            <p className="text-xs leading-relaxed" style={{ color: t.muted }}>
              أنت على اطلاع كامل بكل المواعيد.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const isExam = task.type === "exam";
            const accent = isExam ? BRAND_SECONDARY : BRAND_PRIMARY;
            const Icon = isExam ? AlarmClock : PlaySquare;

            return (
              <Link
                key={task.id}
                href={task.link}
                className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
              >
                <div
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: accent,
                    color: contrastFor(accent),
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black" style={{ color: t.ink }}>
                    {task.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold tabular-nums" style={{ color: t.muted }}>
                    {task.dueAt ? formatDateTime(task.dueAt) : "بدون موعد محدد"}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black"
                  style={{
                    backgroundColor: accent,
                    color: accent === BRAND_SECONDARY ? BRAND_TEXT_ON_SECONDARY : BRAND_TEXT_ON_PRIMARY,
                  }}
                >
                  {isExam ? "اختبار" : "دورة"}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

/* ─── Main overview ──────────────────────────────────────────────── */
export function OverviewView({ data, onNavigate }: OverviewViewProps) {
  const t = useBrandTheme();
  const student = data.student;
  const stats = data.stats;
  const hasContinue = data.continueLearning.length > 0;
  const hasAttempts = data.recentAttempts.length > 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[2rem] border"
        style={{
          borderColor: t.isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)",
          backgroundColor: t.cardBg,
          boxShadow: t.cardShadow,
        }}
        aria-label="ترحيب الطالب"
      >
        <div
          className="hero-bg-orb absolute -right-20 -top-24 h-80 w-80 rounded-full"
          style={{
            background: `radial-gradient(circle, ${BRAND_PRIMARY}, transparent 70%)`,
            opacity: 0.16,
            "--orb-duration": "14s",
            "--orb-delay": "-4s",
          } as CSSProperties}
          aria-hidden="true"
        />
        <div
          className="hero-bg-orb absolute -bottom-28 -left-24 h-96 w-96 rounded-full"
          style={{
            background: `radial-gradient(circle, ${BRAND_SECONDARY}, transparent 70%)`,
            opacity: 0.18,
            "--orb-duration": "18s",
          } as CSSProperties}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, ${t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px)`,
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 grid gap-10 p-6 sm:p-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          {/* Greeting */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold" style={{ color: t.muted }}>
                {greeting()}،
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black"
                style={{
                  backgroundColor: BRAND_SECONDARY,
                  color: BRAND_TEXT_ON_SECONDARY,
                }}
              >
                <Flame className="h-3 w-3" aria-hidden="true" />
                {formatNumber(stats.currentStreakDays)} يوم متتالي
              </span>
              {stats.certificatesCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black"
                  style={{
                    backgroundColor: BRAND_PRIMARY,
                    color: BRAND_TEXT_ON_PRIMARY,
                  }}
                >
                  <Trophy className="h-3 w-3" aria-hidden="true" />
                  {formatNumber(stats.certificatesCount)} شهادة
                </span>
              )}
            </div>

            <h1
              className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-[42px] sm:leading-[1.15]"
              style={{ color: t.ink }}
            >
              {student.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold" style={{ color: t.muted }}>
              {student.studyLevel && (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: BRAND_SECONDARY }} aria-hidden="true" />
                  {student.studyLevel}
                </span>
              )}
              {student.governorate && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" style={{ color: BRAND_PRIMARY }} aria-hidden="true" />
                  {student.governorate}
                </span>
              )}
              {student.joinedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" style={{ color: BRAND_SECONDARY }} aria-hidden="true" />
                  انضم {formatDate(student.joinedAt)}
                </span>
              )}
              {stats.lastActivityAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: BRAND_PRIMARY }} aria-hidden="true" />
                  آخر نشاط: {formatDateTime(stats.lastActivityAt)}
                </span>
              )}
            </div>
          </div>

          {/* Progress + mini stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 lg:justify-end">
            <ProgressRing value={stats.averageProgressPercent} />
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black" style={{ color: t.muted }}>
                  الدورات المكتملة
                </p>
                <p className="text-xl font-black tabular-nums" style={{ color: t.ink }}>
                  <AnimatedNumber value={stats.completedCoursesCount} delay={380} />
                  <span className="text-sm font-bold" style={{ color: t.faint }}>
                    {" "}من {formatNumber(stats.enrolledCoursesCount)}
                  </span>
                </p>
              </div>
              <div className="h-px w-full" style={{ backgroundColor: t.divider }} aria-hidden="true" />
              <div>
                <p className="text-xs font-black" style={{ color: t.muted }}>
                  متوسط نتائج الاختبارات
                </p>
                <p className="text-xl font-black tabular-nums" style={{ color: t.ink }}>
                  <AnimatedNumber value={stats.averageExamScorePercent} suffix="%" delay={440} />
                </p>
              </div>
              <div className="h-px w-full" style={{ backgroundColor: t.divider }} aria-hidden="true" />
              <div>
                <p className="text-xs font-black" style={{ color: t.muted }}>
                  محاولات مجتازة
                </p>
                <p className="text-xl font-black tabular-nums" style={{ color: t.ink }}>
                  <AnimatedNumber value={stats.passedAttemptsCount} delay={500} />
                  <span className="text-sm font-bold" style={{ color: t.faint }}>
                    {" "}من {formatNumber(stats.attemptsCount)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insights band */}
      <InsightsBand stats={stats} />

      {/* Continue learning + tasks */}
      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <ContinueLearningBlock items={data.continueLearning} onNavigate={onNavigate} />
        <TasksRail tasks={data.upcomingTasks} onNavigate={onNavigate} />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href={hasContinue ? `/courses/${data.continueLearning[0]!.courseSlug}` : "/courses"}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          style={{
            backgroundColor: BRAND_PRIMARY,
            color: BRAND_TEXT_ON_PRIMARY,
            boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
          }}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {hasContinue ? "متابعة التعلّم" : "تصفّح الدورات"}
        </Link>
        <Link
          href={hasAttempts ? `/exam-results/${data.recentAttempts[0]!.attemptId}` : "/courses"}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          style={{
            backgroundColor: BRAND_SECONDARY,
            color: BRAND_TEXT_ON_SECONDARY,
            boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
          }}
        >
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          {hasAttempts ? "مراجعة آخر اختبار" : "ابدأ التعلّم"}
        </Link>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-black transition-all duration-300 hover:-translate-y-0.5"
          style={{
            borderColor: BRAND_PRIMARY,
            color: BRAND_PRIMARY,
            backgroundColor: "transparent",
          }}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          اكتشف المزيد
        </Link>
      </div>
    </div>
  );
}
