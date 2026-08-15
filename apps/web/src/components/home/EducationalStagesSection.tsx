"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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

/* ────────────── image + branded fallback cover ────────────── */

function StageFallbackCover({ index, primary, secondary }: { index: number; primary: string; secondary: string }) {
  const main = index % 2 === 1 ? secondary : primary;

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(150deg, ${main}2e 0%, ${main}10 55%, transparent 100%)` }}>
      <div className="absolute -end-10 -top-10 h-40 w-40 rounded-full border-[3px]" style={{ borderColor: `${main}33` }} />
      <div className="absolute -bottom-14 -start-10 h-44 w-44 rounded-full border" style={{ borderColor: `${main}26` }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm"
          style={{ borderColor: `${main}40`, color: main }}
        >
          <GraduationCap className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

/**
 * Always-visible cover: renders the real stage image normalized through the
 * shared media URL helper without cropping (object-contain), so the whole
 * image stays visible on a soft brand-tinted backdrop. Falls back to a
 * branded cover when the stage has no image or the URL can no longer load.
 */
function StageCover({
  stage,
  index,
  primary,
  secondary,
  priority,
  sizes,
}: {
  stage: StageItem;
  index: number;
  primary: string;
  secondary: string;
  priority?: boolean;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => toAbsoluteAssetUrl(stage.image), [stage.image]);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${primary}1a 0%, ${primary}0d 45%, ${secondary}0d 100%)` }}
      />
      <div className="relative h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]">
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
          <StageFallbackCover index={index} primary={primary} secondary={secondary} />
        )}
      </div>
    </div>
  );
}

function StageTagChip({ tag }: { tag: string }) {
  return (
    <span className="pointer-events-none absolute start-3 top-3 z-10 inline-flex items-center rounded-full border border-border/60 bg-card/90 px-2.5 py-1 text-[10px] font-extrabold text-primary shadow-sm backdrop-blur-sm">
      {tag}
    </span>
  );
}

/* ────────────── stats row ────────────── */

function StatPill({ icon: Icon, value, label, color }: { icon: LucideIcon; value: string; label: string; color: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-semibold tabular-nums text-muted-foreground">
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span className="font-extrabold text-card-foreground">{value}</span>
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

function StageStatsRow({ stats, loading }: { stats?: StageStats; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5" aria-hidden="true">
        <span className="h-3 w-12 animate-pulse rounded-full bg-muted" />
        <span className="h-3 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (!stats || (stats.coursesCount <= 0 && stats.teachersCount <= 0)) {
    return <div className="min-h-5" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <StatPill icon={BookOpen} value={formatNumber(stats.coursesCount)} label="دورة" color="var(--brand-primary)" />
      <StatPill icon={Users} value={formatNumber(stats.teachersCount)} label="مدرّس" color="var(--brand-secondary)" />
    </div>
  );
}

/* ────────────── explore CTA ────────────── */

function ExploreCta() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-primary transition-colors duration-300">
      استكشف المرحلة
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-sm transition-transform duration-300 group-hover:scale-110"
        style={{ color: "var(--brand-primary-contrast)" }}
      >
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
  return (
    <Link
      href={`/stages/${stage.id}`}
      aria-label={`${stage.name} — استكشف المرحلة`}
      className="group block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-[transform,border-color,box-shadow] duration-300 ease-out group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-xl">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted/60">
          <StageCover
            stage={stage}
            index={index}
            primary={primary}
            secondary={secondary}
            priority={priority}
            sizes="(max-width: 639px) 78vw, (max-width: 1023px) 47vw, (max-width: 1279px) 31vw, 23vw"
          />

          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />

          {popular ? (
            <span
              className="absolute end-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm"
              style={{ background: secondary, color: "var(--brand-secondary-contrast)" }}
            >
              <Star aria-hidden="true" className="h-3 w-3 fill-current" />
              شائع
            </span>
          ) : null}

          <StageTagChip tag={stageTag(stage.name)} />
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="line-clamp-1 text-[15px] font-extrabold leading-snug text-card-foreground sm:text-base">{stage.name}</h3>

          {stage.description ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{stage.description}</p>
          ) : null}

          <div className="mt-auto pt-3">
            <StageStatsRow stats={stats} loading={loading} />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <ExploreCta />
            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{formatNumber(stats?.coursesCount ?? 0)} دورة</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ────────────── skeleton ────────────── */

const SLIDE_WIDTH = "w-[78%] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]";

function StagesSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden pb-3" aria-busy="true" aria-label="جارٍ تحميل المراحل الدراسية">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${SLIDE_WIDTH} shrink-0`}>
          <div className="animate-pulse overflow-hidden rounded-3xl border border-border bg-card">
            <div className="aspect-[4/3] w-full bg-muted" />
            <div className="space-y-2.5 p-4 sm:p-5">
              <div className="h-3 w-16 rounded-full bg-muted" />
              <div className="h-4 w-2/3 rounded-full bg-muted" />
              <div className="h-3 w-full rounded-full bg-muted" />
              <div className="h-3 w-3/4 rounded-full bg-muted" />
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
      className="section-lazy relative w-full scroll-mt-24 overflow-hidden py-14 sm:py-20"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-background" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{ background: `radial-gradient(55% 85% at 88% -12%, ${primary}0f, transparent 70%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
        style={{ background: `radial-gradient(50% 75% at 10% 112%, ${secondary}0c, transparent 70%)` }}
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
            <StagesSkeleton />
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
