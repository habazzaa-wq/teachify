"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useBrandColors } from "@/hooks/useBrandColors";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import type { StageItem, StageStats } from "@/features/homepage/educational-stages/types";
import { brandContrast } from "@/lib/brand";
import { formatNumber } from "@/lib/format";
import { toAbsoluteAssetUrl } from "@/lib/url";

const GAP_FALLBACK = 16;
const SLIDE_WIDTH = "w-[78%] sm:w-[58%] md:w-[50%] lg:w-[44%] xl:w-[40%]";
const ANIM_MS = 440;

function clampNum(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function motionAllowed(): boolean {
  return typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stageTag(name: string): string {
  const t = name.trim();
  if (t.startsWith("المرحلة ")) return t.slice("المرحلة ".length).replace(/^ال/, "").trim();
  if (t.startsWith("الصف ")) return t.slice("الصف ".length).trim();
  if (t.startsWith("رياض الأطفال")) return "رياض الأطفال";
  return t.length > 14 ? `${t.slice(0, 12)}…` : t;
}

/* ────────────── color helpers (local — no external deps) ────────────── */

function hexRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = (hex ?? "").replace("#", "").trim();
  if (clean.length !== 6) return null;
  const int = parseInt(clean, 16);
  if (Number.isNaN(int)) return null;
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function mixHex(a: string, b: string, amount: number): string {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  if (!pa || !pb) return a;
  const ch = (x: number, y: number) => Math.round(x + (y - x) * amount).toString(16).padStart(2, "0");
  return `#${ch(pa.r, pb.r)}${ch(pa.g, pb.g)}${ch(pa.b, pb.b)}`.toUpperCase();
}

/* ────────────── stage band (alternating brand gradient + image) ────────────── */

function StageBand({
  stage,
  brand,
  other,
  brandText,
  priority,
  popular,
  sizes,
}: {
  stage: StageItem;
  brand: string;
  other: string;
  brandText: string;
  priority?: boolean;
  popular?: boolean;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => toAbsoluteAssetUrl(stage.image), [stage.image]);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className="relative aspect-[16/9] w-full shrink-0 overflow-hidden"
      style={{ background: `linear-gradient(150deg, ${brand} 0%, ${mixHex(brand, "#000000", 0.2)} 120%)` }}
    >
      <div aria-hidden="true" className="absolute -end-10 -top-12 h-36 w-36 rounded-full border-[14px]" style={{ borderColor: `${brandText}14` }} />
      <div aria-hidden="true" className="absolute -bottom-16 -start-12 h-40 w-40 rounded-full" style={{ background: `${brandText}0d` }} />

      <div className="absolute inset-0">
        {showImage ? (
          <Image
            src={src as string}
            alt={stage.name}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl border backdrop-blur-sm"
              style={{ borderColor: `${brandText}33`, background: `${brandText}14`, color: brandText }}
            >
              <GraduationCap aria-hidden="true" className="h-8 w-8" />
            </span>
          </div>
        )}
      </div>

      <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold backdrop-blur-sm"
          style={{ borderColor: `${brandText}33`, background: `${brandText}14`, color: brandText }}
        >
          {stageTag(stage.name)}
        </span>
        {popular ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm"
            style={{ background: other, color: brandContrast(other) }}
          >
            <Star aria-hidden="true" className="h-3 w-3 fill-current" />
            شائع
          </span>
        ) : null}
      </div>

      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card to-transparent" />
    </div>
  );
}

/* ────────────── stats row ────────────── */

function StatChip({ icon: Icon, value, label, brand }: { icon: LucideIcon; value: string; label: string; brand: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold tabular-nums text-muted-foreground">
      <Icon aria-hidden="true" className="h-3.5 w-3.5" style={{ color: brand }} />
      {value} <span className="text-foreground/70">{label}</span>
    </span>
  );
}

function StageStatsRow({ stats, loading, brand }: { stats?: StageStats; loading: boolean; brand: string }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5" aria-hidden="true">
        <span className="h-7 w-20 animate-pulse rounded-full bg-muted" />
        <span className="h-7 w-20 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (!stats || (stats.coursesCount <= 0 && stats.teachersCount <= 0)) {
    return <div className="min-h-7" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatChip icon={BookOpen} value={formatNumber(stats.coursesCount)} label="دورة" brand={brand} />
      <StatChip icon={Users} value={formatNumber(stats.teachersCount)} label="مدرّس" brand={brand} />
    </div>
  );
}

/* ────────────── explore CTA ────────────── */

function ExploreCta() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-primary transition-colors duration-300">
      استكشف المرحلة
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[var(--brand-primary-contrast)] shadow-sm transition-transform duration-300 group-hover:scale-110">
        <ArrowLeft aria-hidden="true" className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
      </span>
    </span>
  );
}

/* ────────────── stage card ────────────── */

function StageCard({
  stage,
  index,
  primary,
  secondary,
  priority,
  stats,
  loading,
  popular,
}: {
  stage: StageItem;
  index: number;
  primary: string;
  secondary: string;
  priority?: boolean;
  stats?: StageStats;
  loading: boolean;
  popular?: boolean;
}) {
  const useSecondary = index % 2 === 1;
  const brand = useSecondary ? secondary : primary;
  const other = useSecondary ? primary : secondary;
  const brandText = brandContrast(brand);

  return (
    <Link
      href={`/stages/${stage.id}`}
      aria-label={`${stage.name} — استكشف المرحلة`}
      className="group relative block h-full rounded-[1.75rem] outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_12px_30px_-20px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out group-hover:-translate-y-1.5">
        <StageBand
          stage={stage}
          brand={brand}
          other={other}
          brandText={brandText}
          priority={priority}
          popular={popular}
          sizes="(max-width: 639px) 78vw, (max-width: 1023px) 58vw, (max-width: 1279px) 44vw, 40vw"
        />

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="line-clamp-1 text-[15px] font-extrabold leading-snug text-card-foreground sm:text-lg">{stage.name}</h3>

          {stage.description ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{stage.description}</p>
          ) : null}

          <div className="mt-auto pt-4">
            <StageStatsRow stats={stats} loading={loading} brand={brand} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <ExploreCta />
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
              {formatNumber(stats?.coursesCount ?? 0)} دورة
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ────────────── skeleton ────────────── */

function StagesSkeleton() {
  return (
    <div className="flex gap-4 pb-2" aria-busy="true" aria-label="جارٍ تحميل المراحل الدراسية">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${SLIDE_WIDTH} shrink-0`}>
          <div className="animate-pulse overflow-hidden rounded-[1.75rem] border border-border bg-card">
            <div className="aspect-[16/9] w-full bg-muted" />
            <div className="space-y-2.5 p-4 sm:p-5">
              <div className="h-4 w-2/3 rounded-full bg-muted" />
              <div className="h-3 w-full rounded-full bg-muted" />
              <div className="h-3 w-3/4 rounded-full bg-muted" />
              <div className="h-7 w-24 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────── carousel controls ────────────── */

function NavButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  const isNext = dir === "next";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isNext ? "التالي" : "السابق"}
      aria-controls="educational-stages-viewport"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:pointer-events-none disabled:opacity-40 sm:h-11 sm:w-11"
    >
      {isNext ? <ChevronLeft aria-hidden="true" className="h-5 w-5" /> : <ChevronRight aria-hidden="true" className="h-5 w-5" />}
    </button>
  );
}

function ProgressSegments({ pages, current, onSelect }: { pages: number; current: number; onSelect: (i: number) => void }) {
  return (
    <div role="group" aria-label="التقدّم في المراحل" className="flex items-center gap-1.5">
      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`الانتقال إلى الصفحة ${i + 1}`}
          aria-current={i === current ? "step" : undefined}
          className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${i === current ? "w-6 bg-primary" : "w-3 bg-primary/25 hover:bg-primary/45"}`}
        />
      ))}
    </div>
  );
}

/* ────────────── section ────────────── */

export function EducationalStagesSection() {
  const { primary, secondary } = useBrandColors();
  const { ref: sectionRef, inView } = useInViewOnce({ rootMargin: "-80px 0px" });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  const geomRef = useRef({ viewport: 0, card: 0, gap: GAP_FALLBACK, step: 0, maxPage: 0 });
  const txRef = useRef(0);
  const pageRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const dragRef = useRef({ down: false, startX: 0, startTx: 0, moved: false, suppressClick: false });

  const [page, setPage] = useState(0);
  const [maxPage, setMaxPage] = useState(0);

  const { data, isLoading } = usePublicStages();
  const all = useMemo(() => data?.items ?? [], [data]);
  const allIds = useMemo(() => all.map((s) => s.id), [all]);
  const { statsById, loadingIds } = useStageStatsState(allIds, inView);

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

  const count = all.length;
  const pages = Math.max(1, count);
  const canPrev = page > 0;
  const canNext = page < maxPage;

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const innerGrad = useMemo(
    () =>
      `radial-gradient(${primary}14 1px, transparent 1px) 0 0/24px 24px, linear-gradient(165deg, ${primary}22 0%, ${primary}12 55%, ${secondary}0f 120%)`,
    [primary, secondary],
  );
  const outerGrad = useMemo(
    () => `linear-gradient(180deg, ${secondary}12 0%, transparent 22%, transparent 78%, ${secondary}12 100%)`,
    [secondary],
  );

  /* ── transform helpers ── */

  const offsetFor = useCallback((p: number) => {
    const g = geomRef.current;
    return g.viewport / 2 - p * g.step - g.card / 2;
  }, []);

  const pageFromTx = useCallback((tx: number) => {
    const g = geomRef.current;
    if (g.step <= 0) return 0;
    return clampNum(Math.round((g.viewport / 2 - g.card / 2 - tx) / g.step), 0, g.maxPage);
  }, []);

  const applyTx = useCallback((tx: number) => {
    txRef.current = tx;
    const track = trackRef.current;
    if (track) track.style.transform = `translate3d(${tx}px, 0, 0)`;
  }, []);

  const applyFocus = useCallback(() => {
    const track = trackRef.current;
    const inner = innerRef.current;
    if (!track || !inner) return;
    const ir = inner.getBoundingClientRect();
    const zoneL = ir.left + ir.width * 0.07;
    const zoneR = ir.right - ir.width * 0.07;
    track.querySelectorAll<HTMLElement>("[data-stage-slide]").forEach((slide) => {
      const card = slide.firstElementChild as HTMLElement | null;
      if (!card) return;
      const r = slide.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(r.right, zoneR) - Math.max(r.left, zoneL));
      const raw = overlap / Math.max(1, r.width);
      const f = raw * raw * (3 - 2 * raw);
      card.style.opacity = `${0.45 + 0.55 * f}`;
      card.style.filter = `grayscale(${(1 - f) * 0.6})`;
      card.style.zIndex = f > 0.5 ? "2" : "1";
      card.style.boxShadow =
        f > 0.55
          ? `0 26px 60px -22px ${primary}4d, 0 0 0 2px ${primary}4d`
          : "0 10px 26px -20px rgba(15,23,42,0.22)";
    });
  }, [primary]);

  const animateTo = useCallback(
    (toTx: number) => {
      const from = txRef.current;
      if (Math.abs(toTx - from) < 0.5) {
        applyTx(toTx);
        applyFocus();
        return;
      }
      if (!motionAllowed()) {
        applyTx(toTx);
        applyFocus();
        return;
      }
      if (animRef.current) cancelAnimationFrame(animRef.current);
      const start = performance.now();
      const dur = ANIM_MS;
      const loop = (now: number) => {
        const t = clampNum((now - start) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        applyTx(from + (toTx - from) * eased);
        applyFocus();
        if (t < 1) {
          animRef.current = requestAnimationFrame(loop);
        } else {
          animRef.current = null;
        }
      };
      animRef.current = requestAnimationFrame(loop);
    },
    [applyTx, applyFocus],
  );

  const goTo = useCallback(
    (p: number, animate = true) => {
      const g = geomRef.current;
      const target = clampNum(p, 0, g.maxPage);
      setPage(target);
      pageRef.current = target;
      if (animate) animateTo(offsetFor(target));
      else {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        applyTx(offsetFor(target));
        applyFocus();
      }
    },
    [animateTo, applyTx, applyFocus, offsetFor],
  );

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    const slide = track?.firstElementChild as HTMLElement | null;
    if (!vp || !track || !slide) return;
    const card = slide.offsetWidth;
    const next = slide.nextElementSibling as HTMLElement | null;
    const gap = next ? Math.abs(next.offsetLeft - slide.offsetLeft - card) : GAP_FALLBACK;
    geomRef.current = {
      viewport: vp.clientWidth,
      card,
      gap,
      step: card + gap,
      maxPage: Math.max(0, count - 1),
    };
    setMaxPage(Math.max(0, count - 1));
    setPage((prev) => clampNum(prev, 0, Math.max(0, count - 1)));
    pageRef.current = clampNum(pageRef.current, 0, Math.max(0, count - 1));
  }, [count]);

  /* ── init: measure + center first slide ── */

  useEffect(() => {
    if (count === 0) return;
    if (initializedRef.current) return;
    initializedRef.current = true;
    const raf = requestAnimationFrame(() => {
      measure();
      applyTx(offsetFor(0));
      applyFocus();
    });
    return () => cancelAnimationFrame(raf);
  }, [count, measure, offsetFor, applyTx, applyFocus]);

  /* ── resize ── */

  useEffect(() => {
    if (count === 0) return;
    const onResize = () => {
      measure();
      applyTx(offsetFor(pageRef.current));
      applyFocus();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [count, measure, offsetFor, applyTx, applyFocus]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  /* ── drag / swipe ── */

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    dragRef.current = { down: true, startX: e.clientX, startTx: txRef.current, moved: false, suppressClick: false };
    viewportRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < 6) return;
    d.moved = true;
    applyTx(d.startTx + dx);
    applyFocus();
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (!d.down) return;
    d.down = false;
    if (d.moved) {
      d.suppressClick = true;
      window.setTimeout(() => {
        dragRef.current.suppressClick = false;
      }, 120);
      goTo(pageFromTx(txRef.current));
    }
  };

  const handleClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (dragRef.current.suppressClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(page + 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(page - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(maxPage);
    }
  };

  if (count === 0 && !isLoading) return null;

  return (
    <section
      ref={sectionRef}
      id="educational-stages"
      dir="rtl"
      aria-labelledby="educational-stages-title"
      className="relative w-full scroll-mt-24 overflow-hidden bg-background"
      style={{ background: outerGrad }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        {/* centered header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary sm:text-xs">
            <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
            المسار التعليمي
          </span>
          <h2 id="educational-stages-title" className="mt-4 text-3xl font-extrabold tracking-tight text-card-foreground sm:text-4xl lg:text-5xl">
            المراحل <span className="text-primary">الدراسية</span>
          </h2>
          <div
            aria-hidden="true"
            className="mx-auto mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-primary to-secondary"
          />
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            اختر المسار المناسب لمستواك وابدأ رحلة التعلم
          </p>
        </div>

        {/* panel — premium rounded stage zone */}
        <div
          ref={innerRef}
          className="relative mt-10 rounded-[2rem] sm:mt-12 sm:rounded-[2.5rem] lg:rounded-[3rem]"
          style={{
            background: innerGrad,
            boxShadow: `0 40px 110px -50px ${primary}4d, inset 0 1px 0 0 ${primary}1f, inset 0 0 0 1px ${primary}0f`,
          }}
        >
          <div className="px-5 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-9 lg:px-12">
            {/* top controls — inside panel */}
            {count > 1 ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <span className="hidden text-xs font-bold tabular-nums text-muted-foreground sm:inline-block">
              {formatNumber(count)} مراحل
            </span>
            <div className="flex items-center gap-3">
              <NavButton dir="prev" disabled={!canPrev} onClick={() => goTo(page - 1)} />
              <div className="h-1 w-36 overflow-hidden rounded-full bg-primary/15 sm:hidden">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${pages > 1 ? (page / (pages - 1)) * 100 : 0}%` }}
                />
              </div>
              <NavButton dir="next" disabled={!canNext} onClick={() => goTo(page + 1)} />
              <div className="hidden sm:block">
                <ProgressSegments pages={pages} current={page} onSelect={goTo} />
              </div>
            </div>
          </div>
        ) : null}

        {/* carousel */}
        <div className="relative mt-5 sm:mt-6">
          {isLoading ? (
            <StagesSkeleton />
          ) : (
            <>
              <div
                id="educational-stages-viewport"
                ref={viewportRef}
                dir="ltr"
                role="region"
                aria-roledescription="carousel"
                aria-label="المراحل الدراسية"
                tabIndex={0}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onClickCapture={handleClickCapture}
                onKeyDown={handleKeyDown}
                onDragStart={(e) => e.preventDefault()}
                className="relative cursor-grab touch-pan-y select-none overflow-hidden py-2 outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-primary/70"
              >
                <div ref={trackRef} dir="ltr" className="flex items-stretch gap-4 will-change-transform" style={{ transform: "translate3d(0, 0, 0)" }}>
                  {all.map((stage, i) => {
                    const stats = statsById.get(stage.id);
                    return (
                      <div key={stage.id} dir="rtl" data-stage-slide className={`${SLIDE_WIDTH} shrink-0`}>
                        <StageCard
                          stage={stage}
                          index={i}
                          primary={primary}
                          secondary={secondary}
                          priority={i < 2}
                          stats={stats}
                          loading={loadingIds.has(stage.id)}
                          popular={stage.id === popularId}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                الصفحة {page + 1} من {pages}
              </span>
            </>
          )}
        </div>
        </div>
        </div>
      </div>
    </section>
  );
}
