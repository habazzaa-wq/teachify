"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { m, useInView, useReducedMotion } from "framer-motion";
import {
  GraduationCap,
  ArrowLeft,
  ChevronDown,
  BookOpen,
  Trophy,
  Palette,
  Lightbulb,
  Rocket,
  Sparkles,
} from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { usePublicStages } from "@/features/homepage/educational-stages/hooks";
import type { StageItem } from "@/features/homepage/educational-stages/types";

const stageIcons = [BookOpen, GraduationCap, Trophy, Palette, Lightbulb, Rocket];
const accents = ["#D87B63", "#7C5CFC", "#22C55E", "#06B6D4", "#EC4899", "#F97316"];

const INITIAL_VISIBLE = 3;

function getStageIcon(i: number) {
  return stageIcons[i % stageIcons.length] ?? BookOpen;
}
function getAccent(i: number) {
  return accents[i % accents.length];
}

/* ────────────── single card ────────────── */
function StageCard({
  stage,
  index,
  isDark,
  reduced,
}: {
  stage: StageItem;
  index: number;
  isDark: boolean;
  reduced: boolean;
}) {
  const Icon = getStageIcon(index);
  const accent = getAccent(index);

  const motionProps = reduced
    ? { opacity: 0 }
    : { opacity: 0, y: 32, rotateX: 8 };

  const card = (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-500"
      style={{
        background: isDark ? "#16141e" : "#fff",
        boxShadow: isDark
          ? "0 1px 2px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(120,90,60,0.06)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
      }}
    >
      {/* ── Angled image area ── */}
      <div className="relative h-52 w-full sm:h-56" style={{ clipPath: "polygon(0 0, 100% 0, 100% 82%, 0 100%)" }}>
        {stage.image ? (
          <Image
            src={stage.image}
            alt={stage.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: isDark
                ? `linear-gradient(135deg, ${accent}18, ${accent}08)`
                : `linear-gradient(135deg, ${accent}12, ${accent}06)`,
            }}
          >
            <Icon className="h-14 w-14" style={{ color: `${accent}50` }} />
          </div>
        )}

        {/* dark overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 40%, ${isDark ? "#16141e" : "#fff"} 100%)`,
          }}
        />

        {/* accent glow on hover */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `linear-gradient(135deg, ${accent}20, transparent 60%)` }}
        />

        {/* floating accent circle */}
        <div
          className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.5)"}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>

        {/* large watermark */}
        <span
          className="pointer-events-none absolute -start-2 bottom-6 select-none font-black leading-none"
          style={{
            fontSize: "clamp(4rem, 8vw, 6rem)",
            color: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* ── Content area ── */}
      <div className="relative flex flex-1 flex-col gap-3 px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
        {/* progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: Math.min(6, Math.max(index + 2, 3)) }).map((_, dotIdx) => (
            <span
              key={dotIdx}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: dotIdx === index ? "1.25rem" : "0.375rem",
                background: dotIdx === index ? accent : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              }}
            />
          ))}
          <span className="me-auto text-[10px] font-bold tracking-wide" style={{ color: `${accent}90` }}>
            {index + 1} / {Math.max(index + 2, 3)}
          </span>
        </div>

        {/* title */}
        <h3
          className="text-lg font-extrabold leading-snug sm:text-xl"
          style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}
        >
          {stage.name}
        </h3>

        {/* description */}
        {stage.description ? (
          <p
            className="line-clamp-2 text-sm leading-relaxed"
            style={{ color: isDark ? "#8a8290" : "#7a7168" }}
          >
            {stage.description}
          </p>
        ) : null}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <span
            className="group/cta inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300"
            style={{
              color: accent,
              background: isDark ? `${accent}12` : `${accent}0a`,
              border: `1.5px solid ${isDark ? `${accent}25` : `${accent}18`}`,
            }}
          >
            اكتشف المزيد
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover/cta:-translate-x-1" />
          </span>
        </div>
      </div>

      {/* bottom accent bar */}
      <div
        className="h-[3px] w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}60)` }}
      />
    </div>
  );

  const anim = {
    initial: motionProps,
    whileInView: { opacity: 1, y: 0, rotateX: 0 },
    viewport: { once: true, margin: "-40px" as const },
    transition: {
      duration: 0.55,
      delay: (index % INITIAL_VISIBLE) * 0.1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };

  if (stage.link) {
    return (
      <m.a
        {...anim}
        href={stage.link}
        target="_blank"
        rel="noopener noreferrer"
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ perspective: "800px" }}
      >
        {card}
      </m.a>
    );
  }

  return (
    <m.div {...anim} style={{ perspective: "800px" }}>
      {card}
    </m.div>
  );
}

/* ────────────── section ────────────── */
export function EducationalStagesSection() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);

  const { data } = usePublicStages();
  const all = data?.items ?? [];

  if (all.length === 0) return null;

  const hasMore = all.length > INITIAL_VISIBLE;
  const visible = expanded ? all : all.slice(0, INITIAL_VISIBLE);

  return (
    <section
      ref={ref}
      dir="rtl"
      className="section-lazy relative w-full overflow-hidden py-10 sm:py-14 lg:py-20"
    >
      {/* bg */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(170deg, #0e0c14 0%, #15121e 50%, #0e0c14 100%)"
            : "linear-gradient(170deg, #faf6ef 0%, #f3ece1 50%, #faf6ef 100%)",
        }}
      />

      {/* subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(${isDark ? "#fff" : "#000"} 0.5px, transparent 0.5px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* orbs */}
      <div className="pointer-events-none absolute -start-32 top-1/4 h-[400px] w-[400px] rounded-full blur-[120px]" style={{ background: `${getAccent(0)}06` }} />
      <div className="pointer-events-none absolute -end-32 bottom-1/4 h-[350px] w-[350px] rounded-full blur-[100px]" style={{ background: `${getAccent(1)}05` }} />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mb-8 text-center sm:mb-12">
          <m.div initial={{ opacity: 0, scale: 0.9 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.4 }} className="mb-4 inline-flex">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold sm:text-sm"
              style={{
                background: isDark ? `linear-gradient(135deg, ${getAccent(0)}12, ${getAccent(1)}08)` : `linear-gradient(135deg, ${getAccent(0)}08, ${getAccent(1)}05)`,
                color: getAccent(0),
                border: `1px solid ${isDark ? `${getAccent(0)}15` : `${getAccent(0)}10`}`,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              المسار التعليمي
            </span>
          </m.div>

          <m.h2
            initial={{ opacity: 0, y: 14 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
            style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}
          >
            المراحل{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${getAccent(0)}, ${getAccent(1)})` }}>
              الدراسية
            </span>
          </m.h2>

          <m.p
            initial={{ opacity: 0, y: 14 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed"
            style={{ color: isDark ? "#8a8290" : "#7a7168" }}
          >
            استكشف المراحل الدراسية التي نقدّمها لبناء مستقبلك التعليمي
          </m.p>
        </div>

        {/* grid — all cards equal */}
        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
          {visible.map((stage, i) => (
            <StageCard key={stage.id} stage={stage} index={i} isDark={isDark} reduced={reduced} />
          ))}
        </div>

        {/* show more */}
        {hasMore ? (
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5 }} className="mt-10 flex justify-center sm:mt-14">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-300 hover:shadow-xl"
              style={{
                color: isDark ? "#F0ECE6" : "#fff",
                background: `linear-gradient(135deg, ${getAccent(0)}, ${getAccent(1)})`,
                boxShadow: `0 4px 20px ${getAccent(0)}28`,
              }}
            >
              {expanded ? (
                "عرض أقل"
              ) : (
                <>
                  عرض المزيد
                  <span className="inline-flex h-6 min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>
                    {all.length - INITIAL_VISIBLE}
                  </span>
                </>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : "group-hover:translate-y-0.5"}`} />
            </button>
          </m.div>
        ) : null}
      </div>

      {/* bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20" style={{ background: isDark ? "linear-gradient(to top, #0e0c14, transparent)" : "linear-gradient(to top, #faf6ef, transparent)" }} />
    </section>
  );
}
