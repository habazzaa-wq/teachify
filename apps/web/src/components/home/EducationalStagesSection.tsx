"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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

const GAP_FALLBACK = 20;

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

/** Mix two hex colors; amount 0→a, 1→b. */
function mixHex(a: string, b: string, amount: number): string {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  if (!pa || !pb) return a;
  const ch = (x: number, y: number) => Math.round(x + (y - x) * amount).toString(16).padStart(2, "0");
  return `#${ch(pa.r, pb.r)}${ch(pa.g, pb.g)}${ch(pa.b, pb.b)}`.toUpperCase();
}

/* ────────────── stage cover (frosted tile on brand card) ────────────── */

function StageCover({
  stage,
  contrast,
  priority,
  sizes,
}: {
  stage: StageItem;
  contrast: string;
  priority?: boolean;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => toAbsoluteAssetUrl(stage.image), [stage.image]);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl border backdrop-blur-sm"
      style={{ borderColor: `${contrast}1a`, background: `${contrast}0a` }}
    >
      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.035]">
        {showImage ? (
          <Image
            src={src as string}
            alt={stage.name}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-contain p-2.5"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `${contrast}12`, color: contrast }}
            >
              <GraduationCap aria-hidden="true" className="h-7 w-7" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StageTagChip({ tag, contrast }: { tag: string; contrast: string }) {
  return (
    <span
      className="pointer-events-none inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold backdrop-blur-sm"
      style={{ borderColor: `${contrast}26`, background: `${contrast}14`, color: contrast }}
    >
      {tag}
    </span>
  );
}

/* ────────────── stats row (glass chips) ────────────── */

function StatChip({ icon: Icon, value, label, contrast }: { icon: LucideIcon; value: string; label: string; contrast: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold tabular-nums"
      style={{ background: `${contrast}14`, color: contrast }}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      {value} <span style={{ opacity: 0.72 }}>{label}</span>
    </span>
  );
}

function StageStatsRow({ stats, loading, contrast }: { stats?: StageStats; loading: boolean; contrast: string }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5" aria-hidden="true">
        <span className="h-7 w-20 animate-pulse rounded-full" style={{ background: `${contrast}14` }} />
        <span className="h-7 w-20 animate-pulse rounded-full" style={{ background: `${contrast}14` }} />
      </div>
    );
  }

  if (!stats || (stats.coursesCount <= 0 && stats.teachersCount <= 0)) {
    return <div className="min-h-7" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatChip icon={BookOpen} value={formatNumber(stats.coursesCount)} label="دورة" contrast={contrast} />
      <StatChip icon={Users} value={formatNumber(stats.teachersCount)} label="مدرّس" contrast={contrast} />
    </div>
  );
}

/* ────────────── explore CTA (contrast pill) ────────────── */

function ExploreCta({ contrast, base }: { contrast: string; base: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-extrabold transition-transform duration-300 group-hover:scale-[1.03]"
      style={{ background: contrast, color: base }}
    >
      استكشف المرحلة
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-300 group-hover:-translate-x-0.5"
        style={{ background: `${base}14`, color: base }}
      >
        <ArrowLeft aria-hidden="true" className="h-3 w-3" />
      </span>
    </span>
  );
}

/* ────────────── stage card (alternating brand backgrounds) ────────────── */

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
  const base = useSecondary ? secondary : primary;
  const other = useSecondary ? primary : secondary;
  const light = mixHex(base, "#FFFFFF", 0.14);
  const deep = mixHex(base, "#000000", 0.32);
  const contrast = brandContrast(base);

  return (
    <Link
      href={`/stages/${stage.id}`}
      aria-label={`${stage.name} — استكشف المرحلة`}
      className="group block h-full rounded-[1.75rem] outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_28px_64px_-16px_var(--glow)]"
        style={
          {
            "--glow": `${base}66`,
            background: `linear-gradient(168deg, ${light} 0%, ${base} 48%, ${deep} 132%)`,
            boxShadow: `0 16px 40px -22px ${base}59`,
          } as CSSProperties
        }
      >
        {/* decorative rings / orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-14 -top-14 h-44 w-44 rounded-full border-[18px]"
          style={{ borderColor: `${contrast}0f` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -start-16 h-48 w-48 rounded-full"
          style={{ background: `${contrast}0a`, filter: "blur(2px)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute end-8 bottom-24 h-16 w-16 rounded-full border"
          style={{ borderColor: `${contrast}14` }}
        />

        <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <StageTagChip tag={stageTag(stage.name)} contrast={contrast} />
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

          <StageCover stage={stage} contrast={contrast} priority={priority} sizes="(max-width: 639px) 78vw, (max-width: 1023px) 47vw, (max-width: 1279px) 31vw, 23vw" />

          <h3 className="mt-4 line-clamp-1 text-[15px] font-extrabold leading-snug sm:text-lg" style={{ color: contrast }}>
            {stage.name}
          </h3>

          {stage.description ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed sm:text-xs" style={{ color: `${contrast}b3` }}>
              {stage.description}
            </p>
          ) : null}

          <div className="mt-auto pt-4">
            <StageStatsRow stats={stats} loading={loading} contrast={contrast} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: `${contrast}1f` }}>
            <ExploreCta contrast={contrast} base={base} />
            <span className="text-[10px] font-bold tabular-nums" style={{ color: `${contrast}8c` }}>
              {formatNumber(stats?.coursesCount ?? 0)} دورة
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ────────────── skeleton (mirrors brand cards) ────────────── */

const SLIDE_WIDTH = "w-[78%] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]";

function StagesSkeleton({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="flex gap-5 overflow-hidden pb-3" aria-busy="true" aria-label="جارٍ تحميل المراحل الدراسية">
      {[0, 1, 2].map((i) => {
        const base = i % 2 === 1 ? secondary : primary;
        const light = mixHex(base, "#FFFFFF", 0.14);
        const deep = mixHex(base, "#000000", 0.32);
        const contrast = brandContrast(base);
        return (
          <div key={i} className={`${SLIDE_WIDTH} shrink-0`}>
            <div
              className="animate-pulse overflow-hidden rounded-[1.75rem]"
              style={{ background: `linear-gradient(168deg, ${light} 0%, ${base} 48%, ${deep} 132%)` }}
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="h-5 w-14 rounded-full" style={{ background: `${contrast}1a` }} />
                  <span className="h-5 w-12 rounded-full" style={{ background: `${contrast}1a` }} />
                </div>
                <div className="mt-5 aspect-[4/3] w-full rounded-2xl" style={{ background: `${contrast}12` }} />
                <div className="mt-5 h-4 w-2/3 rounded-full" style={{ background: `${contrast}26` }} />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-full rounded-full" style={{ background: `${contrast}1f` }} />
                  <div className="h-3 w-3/4 rounded-full" style={{ background: `${contrast}1f` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
  const stepRef = useRef(0);
  const maxIndexRef = useRef(0);
  const dragRef = useRef({ down: false, startX: 0, startScroll: 0, moved: false, suppressClick: false });

  const [maxIndex, setMaxIndex] = useState(0);
  const [index, setIndex] = useState(0);

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
  const pages = Math.max(1, maxIndex + 1);
  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const slide = vp.querySelector<HTMLElement>("[data-stage-slide]");
    if (!slide) return;
    const next = slide.nextElementSibling as HTMLElement | null;
    const gap = next ? Math.abs(next.offsetLeft - slide.offsetLeft - slide.offsetWidth) : GAP_FALLBACK;
    const stepPx = slide.offsetWidth + gap;
    const maxScroll = Math.max(0, vp.scrollWidth - vp.clientWidth);
    const pageCount = maxScroll > 0 ? Math.max(0, Math.round(maxScroll / stepPx)) : 0;
    stepRef.current = stepPx;
    maxIndexRef.current = pageCount;
    setMaxIndex(pageCount);
    setIndex((prev) => clampNum(prev, 0, pageCount));
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(vp);
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (stepRef.current <= 0) return;
        const cur = clampNum(Math.round(-vp.scrollLeft / stepRef.current), 0, maxIndexRef.current);
        setIndex((prev) => (prev === cur ? prev : cur));
      });
    };
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      vp.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [measure, count]);

  const scrollToPage = useCallback((page: number) => {
    const vp = viewportRef.current;
    if (!vp || stepRef.current <= 0) return;
    const target = clampNum(page, 0, maxIndexRef.current);
    vp.scrollTo({ left: -target * stepRef.current, behavior: motionAllowed() ? "smooth" : "auto" });
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;
    const vp = viewportRef.current;
    if (!vp) return;
    dragRef.current = { down: true, startX: e.clientX, startScroll: vp.scrollLeft, moved: false, suppressClick: false };
    vp.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.down) return;
    const vp = viewportRef.current;
    if (!vp) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < 6) return;
    d.moved = true;
    vp.scrollLeft = d.startScroll + dx;
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (!d.down) return;
    d.down = false;
    const vp = viewportRef.current;
    if (d.moved && vp && stepRef.current > 0) {
      d.suppressClick = true;
      window.setTimeout(() => {
        dragRef.current.suppressClick = false;
      }, 120);
      const nearest = clampNum(Math.round(-vp.scrollLeft / stepRef.current), 0, maxIndexRef.current);
      vp.scrollTo({ left: -nearest * stepRef.current, behavior: motionAllowed() ? "smooth" : "auto" });
    }
  };

  const handleClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (dragRef.current.suppressClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (all.length === 0 && !isLoading) return null;

  return (
    <section
      ref={sectionRef}
      id="educational-stages"
      dir="rtl"
      aria-labelledby="educational-stages-title"
      className="relative w-full scroll-mt-24 overflow-hidden py-14 sm:py-20"
    >
      {/* layered brand background */}
      <div aria-hidden="true" className="absolute inset-0 bg-background" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{ background: `radial-gradient(50% 70% at 90% -10%, ${primary}1f, transparent 70%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-80"
        style={{ background: `radial-gradient(52% 72% at 8% 115%, ${secondary}17, transparent 70%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${primary}08 0%, transparent 35%, transparent 65%, ${secondary}08 100%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `radial-gradient(${primary}0d 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(80% 70% at 50% 35%, black 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(80% 70% at 50% 35%, black 20%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary sm:text-xs">
              <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
              المسار التعليمي
            </span>
            <h2 id="educational-stages-title" className="mt-3 text-2xl font-extrabold tracking-tight text-card-foreground sm:text-3xl lg:text-4xl">
              المراحل <span className="text-primary">الدراسية</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              اختر المسار المناسب لمستواك وابدأ رحلة التعلم
            </p>
          </div>

          {maxIndex > 0 ? (
            <div className="flex items-center gap-3 lg:pb-1">
              <div className="hidden sm:block">
                <ProgressSegments pages={pages} current={index} onSelect={scrollToPage} />
              </div>
              <div className="flex items-center gap-2">
                <NavButton dir="prev" disabled={!canPrev} onClick={() => scrollToPage(index - 1)} />
                <NavButton dir="next" disabled={!canNext} onClick={() => scrollToPage(index + 1)} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative mt-8 sm:mt-10">
          {isLoading ? (
            <StagesSkeleton primary={primary} secondary={secondary} />
          ) : (
            <>
              {canPrev ? (
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-14" />
              ) : null}
              {canNext ? (
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-14" />
              ) : null}

              <div
                id="educational-stages-viewport"
                ref={viewportRef}
                role="region"
                aria-roledescription="carousel"
                aria-label="المراحل الدراسية"
                tabIndex={0}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onClickCapture={handleClickCapture}
                onDragStart={(e) => e.preventDefault()}
                className="flex cursor-grab touch-pan-y select-none gap-5 overflow-x-auto overscroll-x-contain pb-3 outline-none snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-primary/70"
              >
                {all.map((stage, i) => {
                  const stats = statsById.get(stage.id);
                  return (
                    <div key={stage.id} data-stage-slide className={`${SLIDE_WIDTH} shrink-0 snap-start`}>
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

              {maxIndex > 0 ? (
                <div className="mt-5 flex items-center justify-center gap-3 sm:hidden">
                  <NavButton dir="prev" disabled={!canPrev} onClick={() => scrollToPage(index - 1)} />
                  <div className="h-1 w-36 overflow-hidden rounded-full bg-primary/15">
                    <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pages > 1 ? (index / (pages - 1)) * 100 : 0}%` }} />
                  </div>
                  <NavButton dir="next" disabled={!canNext} onClick={() => scrollToPage(index + 1)} />
                </div>
              ) : null}

              <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                الصفحة {index + 1} من {pages}
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
