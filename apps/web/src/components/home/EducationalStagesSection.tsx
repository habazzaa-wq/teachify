"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LazyMotion, m, domAnimation, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Palette,
  Rocket,
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

const PRIMARY = "#BF6D58";
const SECONDARY = "#FFB50E";

const stageIcons = [BookOpen, GraduationCap, Trophy, Palette, Lightbulb, Rocket];

const INITIAL_VISIBLE = 8;

function getStageIcon(i: number): LucideIcon {
  return stageIcons[i % stageIcons.length] ?? BookOpen;
}

/* Renders a stage icon without creating a component during render. */
function StageGlyph({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="h-[18px] w-[18px]" />;
}

/* ────────────── single card ────────────── */
function StageCard({
  stage,
  index,
  isDark,
  stats,
  isPopular,
  statsLoading,
}: {
  stage: StageItem;
  index: number;
  isDark: boolean;
  stats?: StageStats;
  isPopular: boolean;
  statsLoading: boolean;
}) {
  const icon = getStageIcon(index);

  const surfaceShadow = isDark
    ? "0 1px 2px rgba(0,0,0,0.25), 0 6px 20px rgba(0,0,0,0.22)"
    : "0 1px 2px rgba(0,0,0,0.03), 0 6px 20px rgba(120,90,60,0.06)";
  const hoverShadow = isDark
    ? "0 2px 4px rgba(0,0,0,0.3), 0 12px 28px rgba(0,0,0,0.3)"
    : "0 2px 4px rgba(0,0,0,0.04), 0 12px 28px rgba(120,90,60,0.12)";

  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl transition-[box-shadow,transform] duration-300 lg:hover:-translate-y-1 lg:hover:scale-[1.01] lg:hover:[--surface-shadow:var(--surface-shadow-hover)]"
      style={{
        background: isDark ? "#16141e" : "#ffffff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
        ["--surface-shadow" as string]: surfaceShadow,
        ["--surface-shadow-hover" as string]: hoverShadow,
        boxShadow: "var(--surface-shadow)",
      }}
    >
      {/* thin accent bar */}
      <div
        className="h-[3px] w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
      />

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* icon + badge */}
        <div className="flex items-center justify-between gap-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 lg:group-hover:[--chip-bg:#BF6D58] lg:group-hover:[--chip-fg:#ffffff]"
            style={{
              ["--chip-bg" as string]: `${PRIMARY}12`,
              ["--chip-fg" as string]: PRIMARY,
              background: "var(--chip-bg)",
              color: "var(--chip-fg)",
            }}
          >
            <StageGlyph icon={icon} />
          </span>

          {isPopular ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: `${SECONDARY}1c`, color: "#8a5b00" }}
            >
              <Star aria-hidden="true" className="h-3 w-3 fill-current" />
              شائع
            </span>
          ) : null}
        </div>

        {/* name */}
        <h3
          className="mt-3 line-clamp-1 text-sm font-bold leading-snug sm:text-[15px]"
          style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}
        >
          {stage.name}
        </h3>

        {/* description — max 2 lines */}
        {stage.description ? (
          <p
            className="mt-1 line-clamp-2 text-xs leading-relaxed"
            style={{ color: isDark ? "#8a8290" : "#7a7168" }}
          >
            {stage.description}
          </p>
        ) : null}

        {/* stats row */}
        <div className="mt-auto flex min-h-[18px] flex-wrap items-center gap-x-3 gap-y-1 pt-3">
          {statsLoading ? (
            <>
              <span
                aria-hidden="true"
                className="h-3 w-12 animate-pulse rounded-full"
                style={{ background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)" }}
              />
              <span
                aria-hidden="true"
                className="h-3 w-12 animate-pulse rounded-full"
                style={{ background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)" }}
              />
            </>
          ) : stats && (stats.coursesCount > 0 || stats.teachersCount > 0) ? (
            <>
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums"
                style={{ color: isDark ? "#8a8290" : "#6B7280" }}
              >
                <BookOpen aria-hidden="true" className="h-3 w-3" style={{ color: PRIMARY }} />
                {formatNumber(stats.coursesCount)} دورة
              </span>
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums"
                style={{ color: isDark ? "#8a8290" : "#6B7280" }}
              >
                <Users aria-hidden="true" className="h-3 w-3" style={{ color: SECONDARY }} />
                {formatNumber(stats.teachersCount)} مدرّس
              </span>
            </>
          ) : null}
        </div>

        {/* CTA */}
        <div className="mt-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-[background-color,color] duration-300 lg:group-hover:[--cta-bg:#BF6D58] lg:group-hover:[--cta-fg:#ffffff]"
            style={{
              ["--cta-bg" as string]: SECONDARY,
              ["--cta-fg" as string]: "#3d2a00",
              background: "var(--cta-bg)",
              color: "var(--cta-fg)",
            }}
          >
            اكتشف المزيد
            <ArrowLeft
              aria-hidden="true"
              className="h-3 w-3 transition-transform duration-300 lg:group-hover:-translate-x-0.5"
            />
          </span>
        </div>
      </div>
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
  const all = data?.items ?? [];

  const hasMore = all.length > INITIAL_VISIBLE;
  const visible = expanded ? all : all.slice(0, INITIAL_VISIBLE);

  const visibleIds = useMemo(() => visible.map((s) => s.id), [visible]);
  const { statsById, loadingIds } = useStageStatsState(visibleIds, inView);

  const popularId = useMemo(() => {
    let bestId: number | null = null;
    let best = 0;
    statsById.forEach((stats, id) => {
      if (stats.coursesCount > best) {
        best = stats.coursesCount;
        bestId = id;
      }
    });
    return best > 0 ? bestId : null;
  }, [statsById]);

  if (all.length === 0 && !isLoading) return null;

  const anim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" as const },
        transition: { duration: 0.4 },
      };

  return (
    <LazyMotion features={domAnimation}>
      <section
        ref={sectionRef}
        id="educational-stages"
        dir="rtl"
        aria-label="المراحل الدراسية"
        className="section-lazy relative w-full scroll-mt-28 overflow-hidden py-10 sm:py-12 lg:py-16"
      >
        {/* background */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(170deg, #0e0c14 0%, #16121c 50%, #0e0c14 100%)"
              : "linear-gradient(170deg, #faf6ef 0%, #f5ede2 50%, #faf6ef 100%)",
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
          style={{ background: `radial-gradient(circle, ${PRIMARY}14 0%, transparent 70%)` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-32 bottom-1/4 h-64 w-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${SECONDARY}10 0%, transparent 70%)` }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {/* ── header ── */}
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-center sm:text-start">
              <m.span
                initial={reduced ? undefined : { opacity: 0, scale: 0.95 }}
                animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold sm:text-xs"
                style={{
                  background: isDark
                    ? `linear-gradient(135deg, ${PRIMARY}1f, ${SECONDARY}0f)`
                    : `linear-gradient(135deg, ${PRIMARY}0f, ${SECONDARY}08)`,
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
                className="mt-2.5 text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl"
                style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}
              >
                <span style={{ color: PRIMARY }}>المراحل</span>{" "}
                <span style={{ color: SECONDARY }}>الدراسية</span>
              </m.h2>

              <m.p
                initial={reduced ? undefined : { opacity: 0, y: 12 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed sm:mx-0 sm:text-sm"
                style={{ color: isDark ? "#8a8290" : "#7a7168" }}
              >
                استكشف مراحل التعليم المتوفرة واختر المسار الأنسب لمستواك الدراسي
              </m.p>
            </div>

            {hasMore ? (
              <div className="flex justify-center sm:justify-end">
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
            <div
              id="educational-stages-grid"
              className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 max-[400px]:grid-cols-1"
              aria-busy="true"
              aria-label="جارٍ تحميل المراحل الدراسية"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-[220px] flex-col overflow-hidden rounded-2xl"
                  style={{
                    background: isDark ? "#16141e" : "#fff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                  }}
                >
                  <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }} />
                  <div className="flex flex-col gap-3 p-3.5 sm:p-4">
                    <div
                      className="h-9 w-9 animate-pulse rounded-xl"
                      style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                    />
                    <div
                      className="mt-2 h-4 w-2/3 animate-pulse rounded-full"
                      style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                    />
                    <div
                      className="h-3 w-full animate-pulse rounded-full"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
                    />
                    <div
                      className="h-3 w-3/4 animate-pulse rounded-full"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              id="educational-stages-grid"
              className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 max-[400px]:grid-cols-1"
            >
              {visible.map((stage, i) => {
                const stats = statsById.get(stage.id);
                return (
                  <m.div key={stage.id} {...anim} className="h-full">
                    <Link
                      href={`/stages/${stage.id}`}
                      aria-label={`${stage.name} — اكتشف المزيد`}
                      className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#BF6D58]/70"
                    >
                      <StageCard
                        stage={stage}
                        index={i}
                        isDark={isDark}
                        stats={stats}
                        isPopular={stage.id === popularId}
                        statsLoading={loadingIds.has(stage.id)}
                      />
                    </Link>
                  </m.div>
                );
              })}
            </div>
          )}
        </div>

        {/* bottom fade */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{
            background: isDark
              ? "linear-gradient(to top, #0e0c14, transparent)"
              : "linear-gradient(to top, #faf6ef, transparent)",
          }}
        />
      </section>
    </LazyMotion>
  );
}
