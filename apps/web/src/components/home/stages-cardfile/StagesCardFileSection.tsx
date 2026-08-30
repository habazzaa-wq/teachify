"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePublicStages } from "@/features/homepage/educational-stages/hooks";
import { toEducationalStage, type EducationalStage } from "../stages/types";
import { pickFeaturedStages } from "../stages/featured";
import { stageAccentTokens } from "../stages/accent";
import { StageIndexCard } from "./StageIndexCard";
import { StageCardFileSkeleton } from "./StageCardFileSkeleton";

const DEFAULT_TITLE = "فهرس مراحل التّعلّم";
const DEFAULT_SUBTITLE =
  "كل مرحلةٍ بطاقة في ملفّ القسم — تُفتح على مناهجها وأدواتها، وترتبط بالتي قبلها وبما بعدها، لتكون الرحلة متّصلة من الروضة حتى التخرّج.";
const RAIL_LABEL = "مراحل التعلّم";

const arabicNumber = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

/**
 * "Card file" (بطاقات الفهرسة) homepage section — library catalogue metaphor.
 *
 * Layout:
 *  · Desktop (≥1024px) — a tab rail of catalogue tabs, then a fanned deck:
 *    two card profiles peek from behind the `start` edge, and a single opened
 *    card is pulled forward (photo in a matted window + stamped body). The
 *    opened card is the only emphasized object; the rest stay quiet.
 *  · Mobile (<1024px)  — the fanned profiles are removed; the rail becomes a
 *    wrapped, tappable flip-list confessor that swaps the opened card inline.
 *    Everything is full-width with fixed-aspect images, so there is no
 *    horizontal overflow and zero layout shift on swap.
 *
 * The one orchestrated motion moment: selecting a tab (rail or profile) pulls
 * the newly opened card out of the file with a spring (`AnimatePresence` +
 * `layout`), while the chosen card is the sole element that ever emphasises.
 * No per-item stagger, no hover-scale defaults — entrance is a single
 * synchronized fade. `role=tablist`/`tab`/`tabpanel` with arrow/homing keys
 * (RTL: ArrowLeft walks forward).
 */
export function StagesCardFileSection({
  stages: stagesProp,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  priorityCount = 0,
}: {
  stages?: EducationalStage[];
  title?: string;
  subtitle?: string;
  /** Number of non-default cards that eager-load their image too. */
  priorityCount?: number;
}) {
  const reduce = useReducedMotion();
  const { data, isLoading } = usePublicStages();
  const fetched = useMemo<EducationalStage[]>(
    () => (data?.items ?? []).map((item) => toEducationalStage(item)),
    [data],
  );
  const stages = stagesProp ?? fetched;

  const [override, setOverride] = useState<number | null>(null);

  const featuredIndex = useMemo(() => {
    if (stages.length === 0) return 0;
    const featured = pickFeaturedStages(stages).featured;
    return featured ? stages.indexOf(featured) : 0;
  }, [stages]);

  // Derived active index: the file opens on the featured stage until the
  // visitor picks a tab, at which point their choice overrides it.
  const safeActive =
    stages.length === 0 ? 0 : Math.min(override ?? featuredIndex, stages.length - 1);
  const frontStage = stages[safeActive] ?? null;

  const peekIndices = useMemo(() => {
    if (stages.length < 2) return [];
    return [(safeActive + 1) % stages.length, (safeActive + 2) % stages.length];
  }, [stages.length, safeActive]);

  const moveActive = (target: number) => {
    if (stages.length === 0) return;
    const next = ((target % stages.length) + stages.length) % stages.length;
    setOverride(next);
    document.getElementById(`cardfile-tab-${next}`)?.focus();
  };

  const onRailKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    // RTL reading order: the first tab sits at the right, so ArrowLeft walks
    // forward and ArrowRight walks back. Home/End jump to the file's ends.
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveActive(safeActive + 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveActive(safeActive - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveActive(stages.length - 1);
    }
  };

  if (stages.length === 0 && !isLoading) return null;
  const showSkeleton = isLoading && stagesProp === undefined;

  return (
    <section
      id="educational-stages"
      dir="rtl"
      aria-labelledby="cardfile-title"
      className="relative w-full overflow-hidden bg-muted/40 py-20 sm:py-24"
    >
      {/* decorative depth layer — desktop only, never affects mobile layout */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute -top-24 end-0 h-80 w-80 rounded-full bg-[var(--brand-primary)] opacity-[0.12] blur-3xl" />
        <div className="absolute -bottom-24 start-0 h-96 w-96 rounded-full bg-[var(--brand-secondary)] opacity-[0.1] blur-3xl" />
        <div className="absolute inset-0 bg-dot opacity-[0.04]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="relative text-start">
          <h2
            id="cardfile-title"
            className="font-display max-w-3xl text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        </header>

        {showSkeleton ? (
          <div className="mt-10 sm:mt-14">
            <StageCardFileSkeleton />
          </div>
        ) : stages.length === 0 ? null : (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            whileInView={reduce ? undefined : { opacity: 1 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 sm:mt-14"
          >
            {/* ——— tab rail (the catalogue tabs) ——— */}
            <div role="tablist" aria-label={RAIL_LABEL} className="flex flex-wrap items-end gap-2 sm:gap-3">
              {stages.map((stage, i) => {
                const accent = stageAccentTokens(stage, i, stages.length);
                const selected = i === safeActive;
                return (
                  <button
                    key={String(stage.id)}
                    id={`cardfile-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="cardfile-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setOverride(i)}
                    onKeyDown={onRailKeyDown}
                    className={cn(
                      "relative flex min-h-11 max-w-full items-center gap-2.5 rounded-t-md px-4 py-2 text-sm font-bold outline-none",
                      "transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--stage-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      selected
                        ? "bg-[var(--stage-color)] text-[var(--stage-fg)] shadow-soft-xs"
                        : "border border-border/70 bg-card/80 text-muted-foreground hoverable:hover:bg-accent hoverable:hover:text-foreground",
                      accent.className,
                    )}
                    style={accent.style}
                  >
                    <span aria-hidden="true" className="font-display text-xs font-bold opacity-90">
                      {arabicNumber(i + 1)}
                    </span>
                    <span className="max-w-[9rem] truncate text-start sm:max-w-[12rem]">{stage.name}</span>
                  </button>
                );
              })}
            </div>
            <div aria-hidden="true" className="mt-0.5 h-px w-full bg-border/60" />

            {/* ——— the deck ——— */}
            <div
              role="tabpanel"
              id="cardfile-panel"
              aria-labelledby={`cardfile-tab-${safeActive}`}
              className="relative mt-6 sm:mt-8"
            >
              {/* fanned profiles behind the opened card (lg+) — mouse-only,
                  the rail carries the full keyboard experience */}
              <div className="pointer-events-none absolute inset-0 hidden lg:block">
                {peekIndices.map((idx, offset) => {
                  const peek = stages[idx]!;
                  const accent = stageAccentTokens(peek, idx, stages.length);
                  return (
                    <button
                      key={String(peek.id)}
                      type="button"
                      tabIndex={-1}
                      onClick={() => setOverride(idx)}
                      aria-label={`${peek.name} — افتح البطاقة`}
                      className={cn(
                        "pointer-events-auto absolute top-3 h-44 w-40 overflow-hidden rounded-lg border border-border/60 bg-card shadow-soft-xs sm:w-44",
                        offset === 0 ? "-start-5 -rotate-[2.5deg]" : "-start-2 -rotate-[4.5deg]",
                        accent.className,
                      )}
                      style={accent.style}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -top-[12px] start-5 inline-flex h-[26px] items-center rounded-t-md rounded-b-[4px] px-2.5 font-display text-xs font-bold text-[var(--stage-fg)]"
                        style={{ backgroundColor: "var(--stage-color)" }}
                      >
                        {arabicNumber(idx + 1)}
                      </span>
                      <div
                        className="mx-2.5 mb-3 mt-6 h-20 rounded-md"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--stage-color-soft) 38%, transparent)",
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="popLayout" initial={false}>
                {frontStage ? (
                  <motion.div
                    key={String(frontStage.id)}
                    layout
                    initial={reduce ? false : { opacity: 0, y: 28, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, y: -22, scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                    className="relative z-10"
                  >
                    <StageIndexCard
                      stage={frontStage}
                      order={safeActive}
                      total={stages.length}
                      tabLabel={arabicNumber(safeActive + 1)}
                      priority={safeActive === featuredIndex || safeActive < priorityCount}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <span aria-live="polite" className="sr-only">
                المرحلة: {frontStage?.name ?? ""}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}