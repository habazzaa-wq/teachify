"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Sparkles,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import type { StageItem, StageStats } from "@/features/homepage/educational-stages/types";
import { formatNumber } from "@/lib/format";
import { toAbsoluteAssetUrl } from "@/lib/url";

const PRIMARY = "#BF6D58";
const ACCENT = "#FFB50E";

const SHOWCASE_CAP = 3;

const stageIcons: LucideIcon[] = [BookOpen, GraduationCap, Sparkles, Star, Trophy, Users];

/* ────────────── helpers ────────────── */

function stageTag(name: string): string {
  const t = name.trim();
  if (t.startsWith("المرحلة ")) return t.slice("المرحلة ".length).replace(/^ال/, "").trim();
  if (t.startsWith("الصف ")) return t.slice("الصف ".length).trim();
  if (t.startsWith("رياض الأطفال")) return "رياض الأطفال";
  return t.length > 14 ? `${t.slice(0, 12)}…` : t;
}

function cardShell(isDark: boolean): CSSProperties {
  return {
    background: isDark ? "#16141e" : "#ffffff",
    border: "1px solid var(--stage-border)",
    boxShadow: isDark
      ? "0 1px 2px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.2)"
      : "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(120,90,60,0.08)",
    ["--stage-border" as string]: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
    ["--stage-border-hover" as string]: isDark ? "rgba(191,109,88,0.55)" : "rgba(191,109,88,0.5)",
    transition: "transform 300ms ease, border-color 300ms ease",
  } as CSSProperties;
}

function ink(isDark: boolean): string {
  return isDark ? "#F0ECE6" : "#1a1510";
}

function muted(isDark: boolean): string {
  return isDark ? "#8a8290" : "#7a7168";
}

/* ────────────── image + fallback cover ────────────── */

function StageFallbackCover({ index, isDark }: { index: number; isDark: boolean }) {
  const Icon = stageIcons[index % stageIcons.length] ?? BookOpen;
  const main = index % 2 === 1 ? ACCENT : PRIMARY;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: isDark
          ? `linear-gradient(150deg, ${main}30 0%, ${main}12 45%, transparent 100%)`
          : `linear-gradient(150deg, ${main}20 0%, ${main}0c 45%, transparent 100%)`,
      }}
    >
      <div className="absolute -end-6 -top-6 h-24 w-24 rounded-full border" style={{ borderColor: `${main}40` }} />
      <div className="absolute -bottom-8 -start-8 h-32 w-32 rounded-full border" style={{ borderColor: `${main}30` }} />
      <div className="absolute bottom-[16%] start-[18%] h-1.5 w-1.5 rounded-full" style={{ background: main }} />
      <div className="absolute end-[22%] top-[24%] h-2 w-2 rounded-full" style={{ background: `${main}80` }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.8)",
            color: main,
            border: `1px solid ${main}30`,
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

/**
 * Always-visible cover. Renders the real stage image normalized through the
 * shared media URL helper without cropping (object-contain), so the whole
 * image is always visible. Falls back to a branded gradient cover when the
 * stage has no image or the stored URL can no longer be fetched.
 */
function StageCover({
  stage,
  index,
  isDark,
  priority,
  sizes,
}: {
  stage: StageItem;
  index: number;
  isDark: boolean;
  priority?: boolean;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => toAbsoluteAssetUrl(stage.image), [stage.image]);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* branded backdrop shown around contained images */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(120% 120% at 50% 0%, ${PRIMARY}26 0%, transparent 62%), radial-gradient(130% 130% at 50% 110%, ${ACCENT}1c 0%, transparent 65%), #1a1622`
            : `radial-gradient(120% 120% at 50% 0%, ${PRIMARY}16 0%, transparent 62%), radial-gradient(130% 130% at 50% 110%, ${ACCENT}12 0%, transparent 65%), #f6efe6`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(${isDark ? "#fff" : "#000"} 0.5px, transparent 0.5px)`,
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative h-full w-full lg:transition-transform lg:duration-500 lg:ease-out lg:group-hover:scale-[1.03]">
        {showImage ? (
          <Image
            src={src as string}
            alt={stage.name}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <StageFallbackCover index={index} isDark={isDark} />
        )}
      </div>
    </div>
  );
}

function StageTagChip({ tag }: { tag: string }) {
  return (
    <span
      className="pointer-events-none absolute start-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
      style={{
        background: "rgba(255,255,255,0.92)",
        color: PRIMARY,
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {tag}
    </span>
  );
}

/* ────────────── stats row ────────────── */

function StatPill({
  icon: Icon,
  value,
  label,
  color,
  isDark,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
  isDark: boolean;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-semibold tabular-nums" style={{ color: muted(isDark) }}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span className="font-extrabold" style={{ color: ink(isDark) }}>{value}</span>
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

function StageStatsRow({
  stats,
  loading,
  isDark,
}: {
  stats?: StageStats;
  loading: boolean;
  isDark: boolean;
}) {
  const base: CSSProperties = { minHeight: 20 };

  if (loading) {
    return (
      <div className="flex items-center gap-2.5" style={base} aria-hidden="true">
        <span className="h-3 w-12 animate-pulse rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)" }} />
        <span className="h-3 w-12 animate-pulse rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)" }} />
      </div>
    );
  }

  if (!stats || (stats.coursesCount <= 0 && stats.teachersCount <= 0)) {
    return <div style={base} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={base}>
      <StatPill icon={BookOpen} value={formatNumber(stats.coursesCount)} label="دورة" color={PRIMARY} isDark={isDark} />
      <StatPill icon={Users} value={formatNumber(stats.teachersCount)} label="مدرّس" color={ACCENT} isDark={isDark} />
    </div>
  );
}

/* ────────────── explore CTA ────────────── */

function ExploreCta() {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-extrabold transition-colors duration-300"
      style={{ color: ACCENT }}
    >
      استكشف المرحلة
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[#5a3a00] transition-transform duration-300 group-hover:scale-110"
        style={{ background: ACCENT, boxShadow: `0 4px 10px ${ACCENT}40` }}
      >
        <ArrowLeft aria-hidden="true" className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
      </span>
    </span>
  );
}

/* ────────────── uniform stage card ────────────── */

function StageCard({
  stage,
  index,
  isDark,
  priority,
  stats,
  loading,
  popular,
}: {
  stage: StageItem;
  index: number;
  isDark: boolean;
  priority?: boolean;
  stats?: StageStats;
  loading: boolean;
  popular?: boolean;
}) {
  return (
    <Link
      href={`/stages/${stage.id}`}
      aria-label={`${stage.name} — استكشف المرحلة`}
      className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/70 focus-visible:rounded-3xl"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl lg:hover:-translate-y-1" style={cardShell(isDark)}>
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
          <StageCover stage={stage} index={index} isDark={isDark} priority={priority} sizes="(max-width: 639px) 90vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 400px" />

          {popular ? (
            <span
              className="absolute end-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold"
              style={{ background: `${ACCENT}ee`, color: "#5a3a00", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
            >
              <Star aria-hidden="true" className="h-2.5 w-2.5 fill-current" />
              شائع
            </span>
          ) : null}

          <StageTagChip tag={stageTag(stage.name)} />
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="line-clamp-1 text-[15px] font-extrabold leading-snug sm:text-base" style={{ color: ink(isDark) }}>
            {stage.name}
          </h3>

          {stage.description ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed sm:text-xs" style={{ color: muted(isDark) }}>
              {stage.description}
            </p>
          ) : null}

          <div className="mt-auto pt-3">
            <StageStatsRow stats={stats} loading={loading} isDark={isDark} />
          </div>

          <div
            className="mt-3 flex items-center justify-between border-t pt-3"
            style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}
          >
            <ExploreCta />
            <span className="text-[10px] font-semibold tabular-nums" style={{ color: muted(isDark) }}>
              {formatNumber(stats?.coursesCount ?? 0)} دورة
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ────────────── skeleton ────────────── */

function StagesSkeleton({ isDark }: { isDark: boolean }) {
  const block = (alpha: string) => ({ background: isDark ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})` });
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="جارٍ تحميل المراحل الدراسية">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-3xl" style={cardShell(isDark)}>
          <div className="aspect-[4/3] w-full" style={block("0.05")} />
          <div className="space-y-2.5 p-5">
            <div className="h-3 w-16 rounded-full" style={block("0.05")} />
            <div className="h-4 w-2/3 rounded-full" style={block("0.06")} />
            <div className="h-3 w-full rounded-full" style={block("0.04")} />
            <div className="h-3 w-3/4 rounded-full" style={block("0.04")} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────── section ────────────── */

export function EducationalStagesSection() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const { ref: sectionRef, inView } = useInViewOnce({ rootMargin: "-80px 0px" });
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = usePublicStages();
  const all = useMemo(() => data?.items ?? [], [data]);

  const showcase = useMemo(() => all.slice(0, SHOWCASE_CAP), [all]);
  const showcaseIds = useMemo(() => showcase.map((s) => s.id), [showcase]);
  const allIds = useMemo(() => all.map((s) => s.id), [all]);

  const { statsById, loadingIds } = useStageStatsState(expanded ? allIds : showcaseIds, inView);

  const popularId = useMemo(() => {
    let bestId: number | null = null;
    let best = 0;
    statsById.forEach((s, id) => {
      if (s.coursesCount > best) {
        best = s.coursesCount;
        bestId = id;
      }
    });
    return best > 0 ? bestId : null;
  }, [statsById]);

  const hasMore = all.length > SHOWCASE_CAP;
  const display = expanded ? all : showcase;

  if (all.length === 0 && !isLoading) return null;

  const decoShapes = [
    { x: "6%", y: "12%", s: 8, c: PRIMARY },
    { x: "93%", y: "16%", s: 6, c: ACCENT },
    { x: "8%", y: "84%", s: 6, c: ACCENT },
    { x: "90%", y: "86%", s: 9, c: PRIMARY },
    { x: "50%", y: "5%", s: 5, c: PRIMARY },
    { x: "46%", y: "95%", s: 5, c: ACCENT },
  ];

  return (
    <section
      ref={sectionRef}
      id="educational-stages"
      dir="rtl"
      aria-label="المراحل الدراسية"
      className="section-lazy relative w-full scroll-mt-28 overflow-hidden py-10 sm:py-14"
    >
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(170deg, #0e0c14 0%, #16121c 55%, #0e0c14 100%)"
              : "linear-gradient(170deg, #fdfbf7 0%, #f7f1e7 55%, #fdfbf7 100%)",
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(${isDark ? "#fff" : "#000"} 0.5px, transparent 0.5px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -start-32 top-1/4 h-72 w-72 rounded-full"
          style={{ background: `radial-gradient(circle, ${PRIMARY}12 0%, transparent 70%)` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-32 bottom-1/4 h-64 w-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${ACCENT}0d 0%, transparent 70%)` }}
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {decoShapes.map((d, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{ left: d.x, top: d.y, width: d.s, height: d.s, background: d.c, opacity: 0.14 }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {/* centered header */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center sm:mb-10">
            <span
              className="home-enter-pop inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold sm:text-xs"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${PRIMARY}1f, ${ACCENT}0f)`
                  : `linear-gradient(135deg, ${PRIMARY}0e, ${ACCENT}08)`,
                color: PRIMARY,
                border: `1px solid ${isDark ? `${PRIMARY}30` : `${PRIMARY}1c`}`,
              }}
            >
              <Sparkles aria-hidden="true" className="h-3 w-3" />
              المسار التعليمي
            </span>

            <h2
              className="home-enter-up mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
              style={{ animationDelay: "0.05s" }}
            >
              <span style={{ color: PRIMARY }}>المراحل</span>{" "}
              <span style={{ color: ACCENT }}>الدراسية</span>
            </h2>

            <p
              className="home-enter-up max-w-xl text-xs leading-relaxed sm:text-sm"
              style={{ color: muted(isDark), animationDelay: "0.1s" }}
            >
              اختر المسار المناسب لمستواك وابدأ رحلة التعلم
            </p>
          </div>

          {isLoading ? (
            <StagesSkeleton isDark={isDark} />
          ) : (
            <>
              {/* uniform grid — stacked single column on phones, side-by-side on larger screens */}
              <div
                id="educational-stages-grid"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {display.map((stage, i) => {
                  const stats = statsById.get(stage.id);
                  return (
                    <div key={stage.id} className="home-enter-up" style={{ animationDelay: `${(i % 6) * 0.06}s` }}>
                      <StageCard
                        stage={stage}
                        index={i}
                        isDark={isDark}
                        priority={i < 2}
                        stats={stats}
                        loading={loadingIds.has(stage.id)}
                        popular={stage.id === popularId}
                      />
                    </div>
                  );
                })}
              </div>

              {hasMore ? (
                <div className="mt-9 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    aria-controls="educational-stages-grid"
                    className="inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-xs font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/60"
                    style={{
                      color: isDark ? "#F0ECE6" : "#1a1510",
                      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {expanded ? "عرض أقل" : "عرض المزيد"}
                    <ArrowLeft
                      aria-hidden="true"
                      className={`h-3 w-3 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
          style={{
            background: isDark
              ? "linear-gradient(to top, #0e0c14, transparent)"
              : "linear-gradient(to top, #fdfbf7, transparent)",
          }}
        />
      </section>
  );
}
