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
import { brandContrast } from "@/lib/brand";
import { formatNumber } from "@/lib/format";
import { toAbsoluteAssetUrl } from "@/lib/url";

const GAP_FALLBACK = 16;

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

/* ────────────── stage cover (frosted tile on glass card) ────────────── */

function StageCover({ stage, priority, sizes }: { stage: StageItem; priority?: boolean; sizes: string }) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => toAbsoluteAssetUrl(stage.image), [stage.image]);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm">
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
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
              <GraduationCap aria-hidden="true" className="h-7 w-7" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StageTagChip({ tag }: { tag: string }) {
  return (
    <span className="pointer-events-none inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur-sm">
      {tag}
    </span>
  );
}

/* ────────────── stats row (glass chips) ────────────── */

function StatChip({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      {value} <span className="text-white/70">{label}</span>
    </span>
  );
}

function StageStatsRow({ stats, loading }: { stats?: StageStats; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5" aria-hidden="true">
        <span className="h-7 w-20 animate-pulse rounded-full bg-white/15" />
        <span className="h-7 w-20 animate-pulse rounded-full bg-white/15" />
      </div>
    );
  }

  if (!stats || (stats.coursesCount <= 0 && stats.teachersCount <= 0)) {
    return <div className="min-h-7" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatChip icon={BookOpen} value={formatNumber(stats.coursesCount)} label="دورة" />
      <StatChip icon={Users} value={formatNumber(stats.teachersCount)} label="مدرّس" />
    </div>
  );
}

/* ────────────── explore CTA ────────────── */

function ExploreCta({ primary }: { primary: string }) {
  const text = mixHex(primary, "#000000", 0.2);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-extrabold transition-transform duration-300 group-hover:scale-[1.04]"
      style={{ background: "#ffffff", color: text }}
    >
      استكشف المرحلة
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-300 group-hover:-translate-x-0.5"
        style={{ background: `${text}14`, color: text }}
      >
        <ArrowLeft aria-hidden="true" className="h-3 w-3" />
      </span>
    </span>
  );
}

/* ────────────── stage card (glass — full brightness = inside inner rectangle) ────────────── */

function StageCard({
  stage,
  primary,
  secondary,
  priority,
  stats,
  loading,
  popular,
}: {
  stage: StageItem;
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
      className="group relative block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] shadow-[0_14px_34px_-22px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full border-[16px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -start-20 h-44 w-44 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex h-full flex-col p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <StageTagChip tag={stageTag(stage.name)} />
            {popular ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm"
                style={{ background: secondary, color: brandContrast(secondary) }}
              >
                <Star aria-hidden="true" className="h-3 w-3 fill-current" />
                شائع
              </span>
            ) : null}
          </div>

          <StageCover stage={stage} priority={priority} sizes="(max-width: 639px) 74vw, (max-width: 1023px) 58vw, (max-width: 1279px) 44vw, 40vw" />

          <h3 className="mt-4 line-clamp-1 text-[15px] font-extrabold leading-snug text-white sm:text-lg">{stage.name}</h3>

          {stage.description ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/70 sm:text-xs">{stage.description}</p>
          ) : null}

          <div className="mt-auto pt-4">
            <StageStatsRow stats={stats} loading={loading} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <ExploreCta primary={primary} />
            <span className="text-[10px] font-bold tabular-nums text-white/70">
              {formatNumber(stats?.coursesCount ?? 0)} دورة
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ────────────── skeleton (mirrors glass cards) ────────────── */

const SLIDE_WIDTH = "w-[74%] sm:w-[58%] md:w-[50%] lg:w-[44%] xl:w-[40%]";

function StagesSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden pb-3" aria-busy="true" aria-label="جارٍ تحميل المراحل الدراسية">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${SLIDE_WIDTH} shrink-0`}>
          <div className="animate-pulse overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="h-5 w-14 rounded-full bg-white/15" />
                <span className="h-5 w-12 rounded-full bg-white/15" />
              </div>
              <div className="mt-5 aspect-[4/3] w-full rounded-2xl bg-white/[0.06]" />
              <div className="mt-5 h-4 w-2/3 rounded-full bg-white/15" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded-full bg-white/10" />
                <div className="h-3 w-3/4 rounded-full bg-white/10" />
              </div>
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
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-30"
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
          className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${i === current ? "w-6 bg-white" : "w-3 bg-white/30 hover:bg-white/50"}`}
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
  const innerRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef(0);
  const maxIndexRef = useRef(0);
  const initializedRef = useRef(false);
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
  const pages = Math.max(1, count);
  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const innerGrad = useMemo(
    () =>
      `radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px) 0 0/22px 22px, linear-gradient(168deg, ${primary} 0%, ${mixHex(primary, "#000000", 0.42)} 125%)`,
    [primary],
  );
  const outerGrad = useMemo(
    () => `linear-gradient(180deg, ${mixHex(secondary, "#000000", 0.34)} 0%, ${mixHex(secondary, "#000000", 0.44)} 100%)`,
    [secondary],
  );

  const applyFocus = useCallback(() => {
    const vp = viewportRef.current;
    const inner = innerRef.current;
    if (!vp || !inner) return;
    const ir = inner.getBoundingClientRect();
    const slides = vp.querySelectorAll<HTMLElement>("[data-stage-slide]");
    slides.forEach((slide) => {
      const card = slide.firstElementChild as HTMLElement | null;
      if (!card) return;
      const r = slide.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(r.right, ir.right) - Math.max(r.left, ir.left));
      const raw = overlap / Math.max(1, r.width);
      const f = raw * raw * (3 - 2 * raw);
      card.style.opacity = `${0.38 + 0.62 * f}`;
      card.style.transform = `scale(${0.9 + 0.1 * f})`;
      card.style.filter = `saturate(${0.6 + 0.4 * f}) brightness(${0.7 + 0.3 * f})`;
      card.style.zIndex = f > 0.5 ? "2" : "1";
      if (f > 0.55) {
        card.style.boxShadow = "0 30px 70px -24px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.25)";
      } else {
        card.style.boxShadow = "0 14px 34px -22px rgba(0,0,0,0.55)";
      }
    });
  }, []);

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const slide = vp.querySelector<HTMLElement>("[data-stage-slide]");
    if (!slide) return;
    const next = slide.nextElementSibling as HTMLElement | null;
    const gap = next ? Math.abs(next.offsetLeft - slide.offsetLeft - slide.offsetWidth) : GAP_FALLBACK;
    stepRef.current = slide.offsetWidth + gap;
    maxIndexRef.current = Math.max(0, count - 1);
    setMaxIndex(Math.max(0, count - 1));
    setIndex((prev) => clampNum(prev, 0, Math.max(0, count - 1)));
    applyFocus();
  }, [count, applyFocus]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    measure();
    const ro = new ResizeObserver(() => {
      measure();
      applyFocus();
    });
    ro.observe(vp);
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (stepRef.current <= 0) return;
        const cur = clampNum(Math.round(-vp.scrollLeft / stepRef.current), 0, maxIndexRef.current);
        setIndex((prev) => (prev === cur ? prev : cur));
        applyFocus();
      });
    };
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      vp.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [measure, applyFocus, count]);

  useEffect(() => {
    if (count === 0) return;
    const vp = viewportRef.current;
    const slide = vp?.querySelector<HTMLElement>("[data-stage-slide]");
    if (!vp || !slide) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      const sr = slide.getBoundingClientRect();
      const vr = vp.getBoundingClientRect();
      const delta = sr.left + sr.width / 2 - (vr.left + vp.clientWidth / 2);
      vp.scrollLeft = vp.scrollLeft - delta;
      applyFocus();
    }
  }, [count, applyFocus]);

  const centerPage = useCallback((page: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const slides = vp.querySelectorAll<HTMLElement>("[data-stage-slide]");
    const slide = slides[clampNum(page, 0, Math.max(0, slides.length - 1))];
    if (!slide) return;
    const sr = slide.getBoundingClientRect();
    const vr = vp.getBoundingClientRect();
    const delta = sr.left + sr.width / 2 - (vr.left + vp.clientWidth / 2);
    vp.scrollTo({ left: vp.scrollLeft - delta, behavior: motionAllowed() ? "smooth" : "auto" });
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
      centerPage(nearest);
    }
  };

  const handleClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (dragRef.current.suppressClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (count === 0 && !isLoading) return null;

  return (
    <section
      ref={sectionRef}
      id="educational-stages"
      dir="rtl"
      aria-labelledby="educational-stages-title"
      className="relative w-full scroll-mt-24 overflow-hidden"
      style={{ background: outerGrad }}
    >
      {/* inner rectangle — the bright 70% zone */}
      <div
        ref={innerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 w-[86%] -translate-x-1/2 border-x border-white/10 sm:w-[76%] lg:w-[70%]"
        style={{ background: innerGrad, boxShadow: "inset 0 0 90px rgba(0,0,0,0.22)" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        {/* centered header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm sm:text-xs">
            <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
            المسار التعليمي
          </span>
          <h2 id="educational-stages-title" className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            المراحل الدراسية
          </h2>
          <div aria-hidden="true" className="mx-auto mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-white/0 via-white/70 to-white/0" />
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            اختر المسار المناسب لمستواك وابدأ رحلة التعلم
          </p>
        </div>

        {/* carousel */}
        <div className="relative mt-10 sm:mt-12">
          {isLoading ? (
            <StagesSkeleton />
          ) : (
            <>
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
                className="flex cursor-grab touch-pan-y select-none gap-4 overflow-x-auto overscroll-x-contain py-2 outline-none snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-white/70"
                style={{
                  maskImage: "linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)",
                }}
              >
                {all.map((stage, i) => {
                  const stats = statsById.get(stage.id);
                  return (
                    <div key={stage.id} data-stage-slide className={`${SLIDE_WIDTH} shrink-0 snap-center`}>
                      <StageCard
                        stage={stage}
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

              {count > 1 ? (
                <div className="mt-6 flex items-center justify-center gap-4">
                  <NavButton dir="prev" disabled={!canPrev} onClick={() => centerPage(index - 1)} />
                  <div className="hidden sm:block">
                    <ProgressSegments pages={pages} current={index} onSelect={centerPage} />
                  </div>
                  <NavButton dir="next" disabled={!canNext} onClick={() => centerPage(index + 1)} />
                </div>
              ) : null}

              {count > 1 ? (
                <div className="mt-6 flex items-center justify-center gap-3 sm:hidden">
                  <NavButton dir="prev" disabled={!canPrev} onClick={() => centerPage(index - 1)} />
                  <div className="h-1 w-36 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-[width] duration-300"
                      style={{ width: `${pages > 1 ? (index / (pages - 1)) * 100 : 0}%` }}
                    />
                  </div>
                  <NavButton dir="next" disabled={!canNext} onClick={() => centerPage(index + 1)} />
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
