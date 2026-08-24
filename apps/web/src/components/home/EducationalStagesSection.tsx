"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Pause,
  Play,
  Users,
} from "lucide-react";
import { useBrandColors } from "@/hooks/useBrandColors";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import type { StageItem, StageStats } from "@/features/homepage/educational-stages/types";
import { brandContrast } from "@/lib/brand";
import { formatNumber } from "@/lib/format";
import { toAbsoluteAssetUrl } from "@/lib/url";

const AUTOPLAY_MS = 2800;

function stageTag(name: string | null): string {
  const t = (name ?? "").trim();
  if (!t) return "";
  if (t.startsWith("المرحلة ")) return t.slice("المرحلة ".length).replace(/^ال/, "").trim();
  if (t.startsWith("الصف ")) return t.slice("الصف ".length).trim();
  if (t.startsWith("رياض الأطفال")) return "رياض الأطفال";
  return t.length > 14 ? `${t.slice(0, 12)}…` : t;
}

/* ────────────── path node ────────────── */

function PathNode({
  stage,
  index,
  active,
  onSelect,
  primary,
}: {
  stage: StageItem;
  index: number;
  active: boolean;
  onSelect: () => void;
  primary: string;
}) {
  return (
    <button
      id={`stage-node-${index}`}
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className="group flex shrink-0 flex-col items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold tabular-nums transition-all duration-300 ${
          active ? "scale-110 shadow-sm" : "border-border bg-card text-muted-foreground group-hover:scale-105 group-hover:text-card-foreground"
        }`}
        style={active ? { background: primary, borderColor: primary, color: brandContrast(primary) } : undefined}
      >
        {index + 1}
      </span>
      <span
        className={`hidden max-w-[7rem] truncate text-center text-xs font-semibold transition-colors sm:block ${
          active ? "text-card-foreground" : "text-muted-foreground"
        }`}
      >
        {stage.name}
      </span>
    </button>
  );
}

/* ────────────── featured panel ────────────── */

function StagePanel({ stage, primary, secondary, stats, loading }: { stage: StageItem; primary: string; secondary: string; stats?: StageStats; loading: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => toAbsoluteAssetUrl(stage.image), [stage.image]);
  const showImage = Boolean(src) && !failed;

  return (
    <article className="stage-swap grid gap-0 overflow-hidden rounded-3xl border border-border bg-card sm:grid-cols-2" key={stage.id}>
      <div className="relative order-1 min-h-[220px] w-full sm:order-2 sm:min-h-[340px]">
        {showImage ? (
          <Image
            src={src as string}
            alt={stage.name}
            fill
            sizes="(max-width: 639px) 100vw, 45vw"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div
            className="flex h-full min-h-[220px] w-full items-center justify-center sm:min-h-[340px]"
            style={{ background: `linear-gradient(135deg, ${primary}16 0%, ${secondary}0d 100%)` }}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl border"
              style={{ borderColor: `${primary}33`, background: `${primary}14`, color: primary }}
            >
              <GraduationCap aria-hidden="true" className="h-8 w-8" />
            </span>
          </div>
        )}
        <span className="absolute start-4 top-4 z-10 inline-flex items-center rounded-full border border-white/60 bg-white/85 px-3 py-1 text-[11px] font-bold text-primary backdrop-blur-sm">
          {stageTag(stage.name)}
        </span>
      </div>

      <div className="order-2 flex flex-col justify-between gap-6 p-6 sm:order-1 sm:p-8">
        <div>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="tabular-nums">المرحلة</span>
            <span aria-hidden="true" className="h-px w-8 bg-primary/40" />
          </div>
          <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-card-foreground sm:text-3xl">{stage.name}</h3>
          {stage.description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{stage.description}</p>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold text-muted-foreground">
              <BookOpen aria-hidden="true" className="h-4 w-4" style={{ color: primary }} />
              {loading ? <span className="h-4 w-16 animate-pulse rounded-full bg-muted" /> : <>{formatNumber(stats?.coursesCount ?? 0)} دورة</>}
            </span>
            <span className="inline-flex items-center gap-2 font-semibold text-muted-foreground">
              <Users aria-hidden="true" className="h-4 w-4" style={{ color: primary }} />
              {loading ? <span className="h-4 w-16 animate-pulse rounded-full bg-muted" /> : <>{formatNumber(stats?.teachersCount ?? 0)} مدرّس</>}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/stages/${stage.id}`}
              aria-label={`${stage.name} — استكشف المرحلة`}
              className="group/cta inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-[var(--brand-primary-contrast)] transition-colors duration-200 hover:bg-primary/90"
            >
              استكشف المرحلة
              <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover/cta:-translate-x-1" />
            </Link>
            <span className="text-xs text-muted-foreground">تصفّح الدورات والمدرّسين المتاحين</span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ────────────── nav button ────────────── */

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition-colors duration-200 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:pointer-events-none disabled:opacity-40 sm:h-11 sm:w-11"
    >
      {children}
    </button>
  );
}

/* ────────────── section ────────────── */

export function EducationalStagesSection() {
  const { primary, secondary } = useBrandColors();

  const { data, isLoading } = usePublicStages();
  const all = useMemo(() => data?.items ?? [], [data]);
  const allIds = useMemo(() => all.map((s) => s.id), [all]);
  const { statsById, loadingIds } = useStageStatsState(allIds, true);

  const count = all.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, Math.max(0, count - 1));
  const active = all[safeIndex];

  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const [auto, setAuto] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const mountedRef = useRef(false);

  const playing = auto && !reduce && !hovering && !tabHidden && count > 1;

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing, count, safeIndex]);

  /* keep the active node centered in the path strip as it advances */
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const el = document.getElementById(`stage-node-${safeIndex}`);
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" });
  }, [safeIndex, reduce]);

  if (count === 0 && !isLoading) return null;

  const activeStats = active ? statsById.get(active.id) : undefined;
  const activeLoading = active ? loadingIds.has(active.id) : false;

  return (
    <section
      id="educational-stages"
      dir="rtl"
      aria-labelledby="educational-stages-title"
      className="relative w-full scroll-mt-24 bg-muted/40 py-20 sm:py-24"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span aria-hidden="true" className="h-px w-8 bg-border" />
              المسار التعليمي
            </div>
            <h2 id="educational-stages-title" className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              المراحل الدراسية
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              مسار متكامل يبدأ من حيث أنت — اختر المرحلة واكتشف الدورات والمدرّسين المتاحين لها.
            </p>
          </div>

          {!isLoading && count > 1 ? (
            <div className="flex items-center gap-3">
              {!reduce ? (
                <IconButton
                  label={auto ? "إيقاف التشغيل التلقائي" : "تشغيل التشغيل التلقائي"}
                  onClick={() => setAuto((a) => !a)}
                >
                  {auto ? <Pause aria-hidden="true" className="h-5 w-5" /> : <Play aria-hidden="true" className="h-5 w-5" />}
                </IconButton>
              ) : null}
              <span className="hidden text-xs font-bold tabular-nums text-muted-foreground sm:inline">
                {formatNumber(safeIndex + 1)} / {formatNumber(count)}
              </span>
              <IconButton label="السابق" disabled={safeIndex <= 0} onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}>
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
              </IconButton>
              <IconButton label="التالي" disabled={safeIndex >= count - 1} onClick={() => setActiveIndex((i) => Math.min(count - 1, i + 1))}>
                <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              </IconButton>
            </div>
          ) : null}
        </div>

        {/* path */}
        {!isLoading && count > 1 ? (
          <div
            className="mt-10 flex items-center gap-1 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="مراحل المسار"
          >
            {all.map((stage, i) => (
              <Fragment key={stage.id}>
                {i > 0 ? (
                  <span
                    aria-hidden="true"
                    className="mx-1 h-0.5 w-6 shrink-0 rounded-full sm:w-10"
                    style={{ background: i <= safeIndex ? primary : "hsl(var(--border))" }}
                  />
                ) : null}
                <div className="snap-center shrink-0 px-1">
                  <PathNode stage={stage} index={i} active={i === safeIndex} onSelect={() => setActiveIndex(i)} primary={primary} />
                </div>
              </Fragment>
            ))}
          </div>
        ) : null}

        {/* autoplay progress */}
        {!isLoading && count > 1 ? (
          <div className="mx-auto mt-4 h-0.5 w-full max-w-2xl overflow-hidden rounded-full bg-border/60" aria-hidden="true">
            <div
              key={safeIndex}
              className="stage-auto-bar h-full rounded-full bg-primary"
              style={{
                width: reduce ? "100%" : undefined,
                animation: reduce ? undefined : `stageAutoProgress ${AUTOPLAY_MS}ms linear`,
                animationPlayState: playing ? "running" : "paused",
              }}
            />
          </div>
        ) : null}

        {/* panel */}
        <div className="mt-8">
          {isLoading || !active ? (
            <div className="aspect-[16/10] w-full animate-pulse rounded-3xl bg-muted" aria-busy="true" aria-label="جارٍ تحميل المرحلة" />
          ) : (
            <StagePanel stage={active} primary={primary} secondary={secondary} stats={activeStats} loading={activeLoading} />
          )}
        </div>
      </div>
    </section>
  );
}
