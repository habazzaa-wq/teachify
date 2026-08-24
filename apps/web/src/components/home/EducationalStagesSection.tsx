"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
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
} from "lucide-react";
import { useBrandColors } from "@/hooks/useBrandColors";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import type { StageItem, StageStats } from "@/features/homepage/educational-stages/types";
import { brandContrast } from "@/lib/brand";
import { formatNumber } from "@/lib/format";
import { toAbsoluteAssetUrl } from "@/lib/url";

const SLIDE_WIDTH = "w-[84%] sm:w-[58%] md:w-[44%] lg:w-[31.5%] xl:w-[27%]";

function clampNum(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function motionAllowed(): boolean {
  return typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stageTag(name: string | null): string {
  const t = (name ?? "").trim();
  if (!t) return "";
  if (t.startsWith("المرحلة ")) return t.slice("المرحلة ".length).replace(/^ال/, "").trim();
  if (t.startsWith("الصف ")) return t.slice("الصف ".length).trim();
  if (t.startsWith("رياض الأطفال")) return "رياض الأطفال";
  return t.length > 14 ? `${t.slice(0, 12)}…` : t;
}

/* ────────────── stage imagery (image, or a calm brand fallback) ────────────── */

function StageVisual({ stage, brand, secondary, priority }: { stage: StageItem; brand: string; secondary: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => toAbsoluteAssetUrl(stage.image), [stage.image]);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
      {showImage ? (
        <Image
          src={src as string}
          alt={stage.name}
          fill
          sizes="(max-width: 639px) 84vw, (max-width: 1023px) 58vw, (max-width: 1279px) 31vw, 27vw"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${brand}12 0%, ${secondary}0d 100%)` }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl border"
            style={{ borderColor: `${brand}33`, background: `${brand}14`, color: brand }}
          >
            <GraduationCap aria-hidden="true" className="h-7 w-7" />
          </span>
        </div>
      )}

      <span
        className="absolute start-3 top-3 z-10 inline-flex items-center rounded-full border border-white/60 bg-white/85 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur-sm"
      >
        {stageTag(stage.name)}
      </span>
    </div>
  );
}

/* ────────────── stats ────────────── */

function StatLine({ stats, loading, brand }: { stats?: StageStats; loading: boolean; brand: string }) {
  if (loading) {
    return (
      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="h-4 w-20 animate-pulse rounded-full bg-muted" />
        <span className="h-4 w-20 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  const courses = stats?.coursesCount ?? 0;
  const teachers = stats?.teachersCount ?? 0;
  if (courses <= 0 && teachers <= 0) {
    return <div className="h-4" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <BookOpen aria-hidden="true" className="h-4 w-4" style={{ color: brand }} />
        {formatNumber(courses)} دورة
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users aria-hidden="true" className="h-4 w-4" style={{ color: brand }} />
        {formatNumber(teachers)} مدرّس
      </span>
    </div>
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
  revealed,
}: {
  stage: StageItem;
  index: number;
  primary: string;
  secondary: string;
  priority?: boolean;
  stats?: StageStats;
  loading: boolean;
  popular?: boolean;
  revealed: boolean;
}) {
  return (
    <div
      className="snap-start shrink-0 transition-[opacity,transform] duration-700 ease-out"
      style={{
        transitionDelay: `${Math.min(index, 8) * 65}ms`,
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(16px)",
      }}
    >
      <Link
        href={`/stages/${stage.id}`}
        aria-label={`${stage.name} — استكشف المرحلة`}
        className="group relative block h-full rounded-2xl border border-border bg-card outline-none transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex h-full flex-col overflow-hidden rounded-2xl">
          <div className="relative">
            <StageVisual stage={stage} brand={primary} secondary={secondary} priority={priority} />
            {popular ? (
              <span
                className="absolute end-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm"
                style={{ background: secondary, color: brandContrast(secondary) }}
              >
                <Star aria-hidden="true" className="h-3 w-3 fill-current" />
                الأكثر رواجاً
              </span>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col p-5">
            <h3 className="line-clamp-1 text-lg font-bold leading-snug text-card-foreground">{stage.name}</h3>

            {stage.description ? (
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{stage.description}</p>
            ) : null}

            <div className="mt-4">
              <StatLine stats={stats} loading={loading} brand={primary} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-bold text-primary">استكشف المرحلة</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 ease-out group-hover:-translate-x-1">
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ────────────── skeleton ────────────── */

function StagesSkeleton() {
  return (
    <div className="flex gap-5" aria-busy="true" aria-label="جارٍ تحميل المراحل الدراسية">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${SLIDE_WIDTH} shrink-0`}>
          <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card">
            <div className="aspect-[16/10] w-full bg-muted" />
            <div className="space-y-2.5 p-5">
              <div className="h-4 w-2/3 rounded-full bg-muted" />
              <div className="h-3 w-full rounded-full bg-muted" />
              <div className="h-3 w-3/4 rounded-full bg-muted" />
              <div className="h-4 w-40 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────── nav + progress ────────────── */

function NavButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  const isNext = dir === "next";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isNext ? "التالي" : "السابق"}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition-colors duration-200 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:pointer-events-none disabled:opacity-40 sm:h-11 sm:w-11"
    >
      {isNext ? <ChevronLeft aria-hidden="true" className="h-5 w-5" /> : <ChevronRight aria-hidden="true" className="h-5 w-5" />}
    </button>
  );
}

/* ────────────── section ────────────── */

export function EducationalStagesSection() {
  const { primary, secondary } = useBrandColors();
  const { ref: sectionRef, inView } = useInViewOnce({ rootMargin: "-80px 0px" });

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [progress, setProgress] = useState(0);

  const reduce = useMemo(() => !motionAllowed(), []);
  const revealed = inView;

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

  /* ── scroll bookkeeping (robust to RTL) ── */

  const readScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.children.length === 0) return;
    const first = scroller.children[0] as HTMLElement;
    const total = scroller.scrollWidth - scroller.clientWidth;
    const contRight = scroller.getBoundingClientRect().right;
    const firstRight = first.getBoundingClientRect().right;
    const moved = Math.max(0, contRight - firstRight);
    setAtStart(moved <= 4);
    setAtEnd(total > 1 ? moved >= total - 4 : true);
    setProgress(total > 1 ? clampNum(moved / total, 0, 1) : count > 1 ? 0 : 1);

    const second = scroller.children[1] as HTMLElement | null;
    const step = second ? second.offsetLeft - first.offsetLeft : scroller.clientWidth;
    if (step > 0) setIndex(clampNum(Math.round(moved / step), 0, count - 1));
  }, [count]);

  useEffect(() => {
    if (count === 0) return;
    const raf = requestAnimationFrame(() => readScroll());
    return () => cancelAnimationFrame(raf);
  }, [count, readScroll, primary]);

  useEffect(() => {
    const onResize = () => readScroll();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [readScroll]);

  const scrollToIndex = useCallback(
    (i: number) => {
      const scroller = scrollerRef.current;
      const target = clampNum(i, 0, count - 1);
      setIndex(target);
      const el = scroller?.children[target] as HTMLElement | null;
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "start", block: "nearest" });
    },
    [count, reduce],
  );

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollToIndex(index + 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollToIndex(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      scrollToIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      scrollToIndex(count - 1);
    }
  };

  if (count === 0 && !isLoading) return null;

  return (
    <section
      ref={sectionRef}
      id="educational-stages"
      dir="rtl"
      aria-labelledby="educational-stages-title"
      className="relative w-full scroll-mt-24 bg-muted/40 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div
          className="flex flex-col gap-5 transition-[opacity,transform] duration-700 ease-out sm:flex-row sm:items-end sm:justify-between"
          style={{ opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(16px)" }}
        >
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary sm:text-xs">
              <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
              المسار التعليمي
            </span>
            <h2
              id="educational-stages-title"
              className="mt-3 text-3xl font-extrabold tracking-tight text-card-foreground sm:text-4xl"
            >
              المراحل <span className="text-primary">الدراسية</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              اختر المرحلة التي تناسب مستواك واستكشف الدورات والمدرّسين المتاحين لكل مرحلة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-bold tabular-nums text-muted-foreground sm:inline">{formatNumber(count)} مراحل</span>
            <NavButton dir="prev" disabled={atStart} onClick={() => scrollToIndex(index - 1)} />
            <NavButton dir="next" disabled={atEnd} onClick={() => scrollToIndex(index + 1)} />
          </div>
        </div>

        {/* carousel */}
        <div className="relative mt-8 sm:mt-10">
          {isLoading ? (
            <StagesSkeleton />
          ) : (
            <div
              ref={scrollerRef}
              dir="rtl"
              role="region"
              aria-roledescription="carousel"
              aria-label="المراحل الدراسية"
              tabIndex={0}
              onScroll={readScroll}
              onKeyDown={handleKeyDown}
              onDragStart={(e) => e.preventDefault()}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/70 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {all.map((stage, i) => (
                <div key={stage.id} className={count === 1 ? "w-full shrink-0" : SLIDE_WIDTH}>
                  <StageCard
                    stage={stage}
                    index={i}
                    primary={primary}
                    secondary={secondary}
                    priority={i < 2}
                    stats={statsById.get(stage.id)}
                    loading={loadingIds.has(stage.id)}
                    popular={stage.id === popularId}
                    revealed={revealed}
                  />
                </div>
              ))}
            </div>
          )}

          {/* progress */}
          {!isLoading && count > 1 ? (
            <div className="mx-auto mt-6 h-1 w-full max-w-2xl overflow-hidden rounded-full bg-border" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                style={{ width: `${Math.max(6, progress * 100)}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
