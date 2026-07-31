"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, m, domAnimation, useInView, useReducedMotion } from "framer-motion";
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

const SHOWCASE_CAP = 7;

const stageIcons: LucideIcon[] = [BookOpen, GraduationCap, Sparkles, Star, Trophy, Users];

/* ────────────── helpers ────────────── */

/** Short category label for the floating badge ("ابتدائية", "ثانوي", …). */
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
      : "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(120,90,60,0.07)",
    ["--stage-border" as string]: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
    ["--stage-border-hover" as string]: isDark ? "rgba(191,109,88,0.5)" : "rgba(191,109,88,0.45)",
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
 * Always-visible cover. Renders the real stage image (normalized through the
 * shared media URL helper) when it exists, otherwise a branded gradient cover.
 * Falls back gracefully when a stored URL can no longer be fetched.
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
    <div className="absolute inset-0">
      <div className="relative h-full w-full overflow-hidden lg:transition-transform lg:duration-500 lg:ease-out lg:group-hover:scale-[1.03]">
        {showImage ? (
          <Image
            src={src as string}
            alt={stage.name}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <StageFallbackCover index={index} isDark={isDark} />
        )}
      </div>
    </div>
  );
}

function StageTagChip({ tag, onImage }: { tag: string; onImage?: boolean }) {
  const chip = (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
        onImage ? "pointer-events-none" : ""
      }`}
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
  return onImage ? <div className="absolute start-2 top-2 z-10">{chip}</div> : chip;
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
  large,
}: {
  stats?: StageStats;
  loading: boolean;
  isDark: boolean;
  large?: boolean;
}) {
  const base: CSSProperties = { minHeight: large ? 24 : 20 };

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

function ExploreCta({ isDark, small }: { isDark: boolean; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold transition-colors duration-300 ${small ? "text-[10px]" : "text-[11px]"}`}
      style={{ color: isDark ? "#F0ECE6" : PRIMARY }}
    >
      استكشف المرحلة
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-300"
        style={{ background: `${PRIMARY}14`, color: PRIMARY }}
      >
        <ArrowLeft aria-hidden="true" className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
      </span>
    </span>
  );
}

/* ────────────── mobile compact card (snapping carousel) ────────────── */

function MobileStageCard({
  stage,
  index,
  isDark,
  priority,
  stats,
  loading,
}: {
  stage: StageItem;
  index: number;
  isDark: boolean;
  priority?: boolean;
  stats?: StageStats;
  loading: boolean;
}) {
  return (
    <Link
      href={`/stages/${stage.id}`}
      aria-label={`${stage.name} — استكشف المرحلة`}
      className="group block w-[78%] max-w-[320px] shrink-0 snap-start rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/70"
    >
      <div className="flex h-[190px] overflow-hidden rounded-3xl" style={cardShell(isDark)}>
        <div className="relative w-[46%] max-w-[150px] shrink-0 overflow-hidden">
          <StageCover stage={stage} index={index} isDark={isDark} priority={priority} sizes="130px" />
          <StageTagChip tag={stageTag(stage.name)} onImage />
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3">
          <h3 className="line-clamp-1 text-[13px] font-extrabold leading-snug" style={{ color: ink(isDark) }}>
            {stage.name}
          </h3>

          {stage.description ? (
            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed" style={{ color: muted(isDark) }}>
              {stage.description}
            </p>
          ) : null}

          <div className="mt-auto">
            <StageStatsRow stats={stats} loading={loading} isDark={isDark} />
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold" style={{ color: isDark ? "#a9a1b2" : "#6b7280" }}>
              {formatNumber(stats?.coursesCount ?? 0)} دورة
            </span>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-300"
              style={{ background: `${PRIMARY}14`, color: PRIMARY }}
            >
              <ArrowLeft aria-hidden="true" className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ────────────── desktop compact card (row 2) ────────────── */

function CompactStageCard({
  stage,
  index,
  isDark,
  stats,
  loading,
}: {
  stage: StageItem;
  index: number;
  isDark: boolean;
  stats?: StageStats;
  loading: boolean;
}) {
  return (
    <Link
      href={`/stages/${stage.id}`}
      aria-label={`${stage.name} — استكشف المرحلة`}
      className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/70 focus-visible:rounded-3xl"
    >
      <div
        className="flex h-full overflow-hidden rounded-3xl lg:hover:-translate-y-1"
        style={cardShell(isDark)}
      >
        <div className="relative w-[38%] min-w-[110px] shrink-0 overflow-hidden">
          <StageCover stage={stage} index={index} isDark={isDark} sizes="130px" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3.5">
          <StageTagChip tag={stageTag(stage.name)} />
          <h3 className="line-clamp-1 text-[13px] font-extrabold leading-snug" style={{ color: ink(isDark) }}>
            {stage.name}
          </h3>
          <div className="mt-1">
            <StageStatsRow stats={stats} loading={loading} isDark={isDark} />
          </div>
          <div className="mt-0.5">
            <ExploreCta isDark={isDark} small />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ────────────── vertical medium card ────────────── */

function MediumStageCard({
  stage,
  index,
  isDark,
  priority,
  stats,
  loading,
  popular,
  className,
}: {
  stage: StageItem;
  index: number;
  isDark: boolean;
  priority?: boolean;
  stats?: StageStats;
  loading: boolean;
  popular?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/stages/${stage.id}`}
      aria-label={`${stage.name} — استكشف المرحلة`}
      className={`group block h-full outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/70 focus-visible:rounded-3xl ${className ?? ""}`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl lg:hover:-translate-y-1" style={cardShell(isDark)}>
        <div className="relative h-[140px] shrink-0 overflow-hidden sm:h-[150px]">
          <StageCover stage={stage} index={index} isDark={isDark} priority={priority} sizes="(max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 300px" />

          {popular ? (
            <span
              className="absolute end-2 top-2 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold"
              style={{ background: `${ACCENT}ee`, color: "#5a3a00", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
            >
              <Star aria-hidden="true" className="h-2.5 w-2.5 fill-current" />
              شائع
            </span>
          ) : null}

          <StageTagChip tag={stageTag(stage.name)} onImage />
        </div>

        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <h3 className="line-clamp-1 text-[14px] font-extrabold leading-snug sm:text-[15px]" style={{ color: ink(isDark) }}>
            {stage.name}
          </h3>

          {stage.description ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed" style={{ color: muted(isDark) }}>
              {stage.description}
            </p>
          ) : null}

          <div className="mt-auto pt-2.5">
            <StageStatsRow stats={stats} loading={loading} isDark={isDark} />
          </div>

          <div className="mt-2 border-t pt-2" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
            <ExploreCta isDark={isDark} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ────────────── featured card (row 1) ────────────── */

function FeaturedStageCard({
  stage,
  index,
  isDark,
  stats,
  loading,
  popular,
}: {
  stage: StageItem;
  index: number;
  isDark: boolean;
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
      <div className="flex h-full flex-col overflow-hidden rounded-3xl sm:grid sm:grid-cols-2 lg:hover:-translate-y-1" style={cardShell(isDark)}>
        <div className="relative h-[190px] shrink-0 overflow-hidden sm:h-auto">
          <StageCover stage={stage} index={index} isDark={isDark} priority sizes="(max-width: 1279px) 45vw, 480px" />

          <span
            className="absolute start-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
            style={{ background: "rgba(255,255,255,0.94)", color: PRIMARY, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}
          >
            <Star aria-hidden="true" className="h-3 w-3 fill-current" style={{ color: ACCENT }} />
            {stageTag(stage.name)}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {popular ? (
            <span
              className="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold"
              style={{ background: `${ACCENT}1c`, color: "#8a5b00" }}
            >
              <Star aria-hidden="true" className="h-2.5 w-2.5 fill-current" />
              الأكثر طلباً
            </span>
          ) : null}

          <h3 className="mt-1.5 line-clamp-2 text-lg font-extrabold leading-snug tracking-tight sm:text-xl" style={{ color: ink(isDark) }}>
            {stage.name}
          </h3>

          {stage.description ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed" style={{ color: muted(isDark) }}>
              {stage.description}
            </p>
          ) : null}

          <div className="mt-auto pt-3">
            <StageStatsRow stats={stats} loading={loading} isDark={isDark} large />
          </div>

          <div className="mt-3 border-t pt-3" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors duration-300"
              style={{ background: `${PRIMARY}12`, color: PRIMARY }}
            >
              استكشف المرحلة
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
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
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="جارٍ تحميل المراحل الدراسية">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-3xl" style={cardShell(isDark)}>
          <div className="h-32 w-full sm:h-36" style={block("0.05")} />
          <div className="space-y-2.5 p-4">
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
  const reduced = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });
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

  const anim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" as const },
        transition: { duration: 0.45 },
      };

  const featured = showcase[0] as StageItem;
  const mediums = showcase.slice(1, 3);
  const compacts = showcase.slice(3, 7);

  const decoShapes = reduced
    ? []
    : [
        { x: "4%", y: "18%", s: 8, c: PRIMARY, d: 0 },
        { x: "94%", y: "12%", s: 6, c: ACCENT, d: 1.4 },
        { x: "6%", y: "86%", s: 6, c: ACCENT, d: 0.7 },
        { x: "90%", y: "82%", s: 9, c: PRIMARY, d: 2.1 },
        { x: "52%", y: "4%", s: 5, c: PRIMARY, d: 2.8 },
        { x: "47%", y: "96%", s: 5, c: ACCENT, d: 0.4 },
      ];

  return (
    <LazyMotion features={domAnimation}>
      <section
        ref={sectionRef}
        id="educational-stages"
        dir="rtl"
        aria-label="المراحل الدراسية"
        className="section-lazy relative w-full scroll-mt-28 overflow-hidden py-10 sm:py-12"
      >
        {/* background */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(170deg, #0e0c14 0%, #16121c 55%, #0e0c14 100%)"
              : "linear-gradient(170deg, #fdfbf7 0%, #f7f1e7 55%, #fdfbf7 100%)",
          }}
        />

        {/* subtle dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(${isDark ? "#fff" : "#000"} 0.5px, transparent 0.5px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* soft gradient orbs — cheap radial gradients, no filter blur */}
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

        {/* tiny floating decorative shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {decoShapes.map((d, i) => (
            <m.span
              key={i}
              className="absolute rounded-full"
              style={{ left: d.x, top: d.y, width: d.s, height: d.s, background: d.c, opacity: 0.14 }}
              animate={{ y: [0, -10, 0], opacity: [0.1, 0.24, 0.1] }}
              transition={{ duration: 6 + (i % 3) * 2, repeat: Infinity, delay: d.d }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {/* ── header ── */}
          <div className="mb-5 flex flex-col gap-3 sm:mb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <m.span
                initial={reduced ? undefined : { opacity: 0, scale: 0.95 }}
                animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold sm:text-xs"
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
              </m.span>

              <m.h2
                initial={reduced ? undefined : { opacity: 0, y: 12 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05 }}
                className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl"
                style={{ color: ink(isDark) }}
              >
                المراحل{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(120deg, ${PRIMARY}, ${ACCENT})` }}
                >
                  الدراسية
                </span>
              </m.h2>

              <m.p
                initial={reduced ? undefined : { opacity: 0, y: 12 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mt-1 text-xs leading-relaxed sm:text-sm"
                style={{ color: muted(isDark) }}
              >
                اختر المسار المناسب لمستواك وابدأ رحلة التعلم
              </m.p>
            </div>

            {hasMore ? (
              <div className="hidden md:block">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  aria-controls="educational-stages-grid"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/60"
                  style={{
                    color: isDark ? "#F0ECE6" : "#1a1510",
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {expanded ? "عرض أقل" : `عرض الكل (${all.length})`}
                  <ArrowLeft
                    aria-hidden="true"
                    className={`h-3 w-3 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            ) : null}
          </div>

          {/* ── loading skeleton ── */}
          {isLoading ? (
            <StagesSkeleton isDark={isDark} />
          ) : (
            <>
              {/* mobile: horizontal snapping carousel (all stages, one-thumb) */}
              <div className="-mx-5 px-5 md:hidden">
                <div
                  role="region"
                  aria-label="المراحل الدراسية — مرر أفقياً للاستكشاف"
                  tabIndex={0}
                  className="flex snap-x snap-mandatory [scroll-padding-inline-start:4px] gap-3 overflow-x-auto pb-2 pt-0.5 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:ring-2 focus-visible:ring-[#BF6D58]/50 focus-visible:rounded-2xl"
                >
                  {all.map((stage, i) => {
                    const stats = statsById.get(stage.id);
                    return (
                      <MobileStageCard
                        key={stage.id}
                        stage={stage}
                        index={i}
                        isDark={isDark}
                        priority={i < 2}
                        stats={stats}
                        loading={loadingIds.has(stage.id)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* tablet: compact grid */}
              <div id="educational-stages-grid" className="hidden gap-4 md:grid lg:hidden md:grid-cols-2">
                {display.map((stage, i) => {
                  const stats = statsById.get(stage.id);
                  return (
                    <m.div key={stage.id} {...anim} transition={{ ...anim.transition, delay: (i % 6) * 0.06 }}>
                      <MediumStageCard
                        stage={stage}
                        index={i}
                        isDark={isDark}
                        stats={stats}
                        loading={loadingIds.has(stage.id)}
                        popular={stage.id === popularId}
                      />
                    </m.div>
                  );
                })}
              </div>

              {/* desktop: bento showcase (featured + mediums + compacts) / full grid when expanded */}
              {expanded ? (
                <div id="educational-stages-grid" className="hidden gap-5 lg:grid lg:grid-cols-3 xl:grid-cols-4">
                  {all.map((stage, i) => {
                    const stats = statsById.get(stage.id);
                    return (
                      <m.div key={stage.id} {...anim} transition={{ ...anim.transition, delay: (i % 8) * 0.05 }}>
                        <MediumStageCard
                          stage={stage}
                          index={i}
                          isDark={isDark}
                          stats={stats}
                          loading={loadingIds.has(stage.id)}
                          popular={stage.id === popularId}
                        />
                      </m.div>
                    );
                  })}
                </div>
              ) : (
                <div className="hidden gap-4 lg:grid lg:grid-cols-12 lg:gap-5">
                  {/* row 1 — featured + mediums */}
                  <m.div className="lg:col-span-6" {...anim}>
                    <FeaturedStageCard
                      stage={featured}
                      index={0}
                      isDark={isDark}
                      stats={statsById.get(featured.id)}
                      loading={loadingIds.has(featured.id)}
                      popular={featured.id === popularId}
                    />
                  </m.div>

                  {mediums.map((stage, i) => {
                    const stats = statsById.get(stage.id);
                    return (
                      <m.div key={stage.id} className="lg:col-span-3" {...anim} transition={{ ...anim.transition, delay: 0.08 + i * 0.06 }}>
                        <MediumStageCard
                          stage={stage}
                          index={i + 1}
                          isDark={isDark}
                          stats={stats}
                          loading={loadingIds.has(stage.id)}
                          popular={stage.id === popularId}
                        />
                      </m.div>
                    );
                  })}

                  {/* row 2 — compact stages */}
                  {compacts.map((stage, i) => {
                    const stats = statsById.get(stage.id);
                    return (
                      <m.div key={stage.id} className="lg:col-span-3" {...anim} transition={{ ...anim.transition, delay: 0.16 + i * 0.04 }}>
                        <CompactStageCard
                          stage={stage}
                          index={i + 3}
                          isDark={isDark}
                          stats={stats}
                          loading={loadingIds.has(stage.id)}
                        />
                      </m.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* bottom fade */}
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
    </LazyMotion>
  );
}
