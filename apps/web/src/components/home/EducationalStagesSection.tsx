"use client";

import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { GraduationCap, ArrowLeft, ChevronDown } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { usePublicStages } from "@/features/homepage/educational-stages/hooks";
import type { StageItem } from "@/features/homepage/educational-stages/types";

/* Brand palette (warm, matches the public academy theme) */
const primary = "#D87B63";
const secondary = "#FFB50E";

const INITIAL_VISIBLE = 3;

function StageCard({ stage, index, isDark, reduced }: {
  stage: StageItem;
  index: number;
  isDark: boolean;
  reduced: boolean;
}) {
  const inner = (
    <>
      {/* Image */}
      <div className="relative aspect-[5/4] w-full overflow-hidden">
        {stage.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stage.image}
            alt={stage.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: isDark
                ? "linear-gradient(135deg, #2a2530, #1c1822)"
                : `linear-gradient(135deg, ${primary}26, ${secondary}26)`,
            }}
          >
            <GraduationCap
              className="h-12 w-12"
              style={{ color: isDark ? "#6b6470" : primary }}
            />
          </div>
        )}

        {/* soft gradient for depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.12) 100%)",
          }}
        />

        {/* index chip */}
        <span
          className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3
          className="text-lg font-bold leading-snug"
          style={{ color: isDark ? "#F5F1EC" : "#241c16" }}
        >
          {stage.name}
        </h3>

        {stage.description ? (
          <p
            className="line-clamp-3 text-sm leading-relaxed"
            style={{ color: isDark ? "#b8b0a8" : "#5f574e" }}
          >
            {stage.description}
          </p>
        ) : null}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <span
            className="group/cta inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300"
            style={{
              borderColor: isDark ? `${primary}55` : `${primary}40`,
              color: primary,
              background: "transparent",
            }}
          >
            معرفة المزيد
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover/cta:-translate-x-1" />
          </span>
        </div>
      </div>
    </>
  );

  const cardClass =
    "group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl";
  const cardStyle = {
    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(120,90,60,0.12)",
  };

  const motionProps = reduced
    ? { opacity: 0 }
    : { opacity: 0, y: 28 };

  const content = (() => {
    if (stage.link) {
      return (
        <motion.a
          href={stage.link}
          target="_blank"
          rel="noopener noreferrer"
          initial={motionProps}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: (index % INITIAL_VISIBLE) * 0.08, ease: "easeOut" }}
          className={`${cardClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
          style={cardStyle}
        >
          {inner}
        </motion.a>
      );
    }

    return (
      <motion.div
        initial={motionProps}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: (index % INITIAL_VISIBLE) * 0.08, ease: "easeOut" }}
        className={cardClass}
        style={cardStyle}
      >
        {inner}
      </motion.div>
    );
  })();

  return content;
}

export function EducationalStagesSection() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
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
      className="relative w-full overflow-hidden py-12 sm:py-16 lg:py-24"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 50% 0%, #16131c 0%, #100e16 60%, #0c0a12 100%)"
            : "radial-gradient(ellipse at 50% 0%, #fdf8f2 0%, #f8f1e8 60%, #f3ece1 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -start-10 top-10 h-72 w-72 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${primary}0c, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute -end-10 bottom-0 h-72 w-72 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${secondary}0a, transparent 70%)` }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        {/* header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
          >
            <span
              className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold sm:text-sm"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${primary}18, ${secondary}10)`
                  : `linear-gradient(135deg, ${primary}12, ${secondary}08)`,
                color: primary,
                border: `1px solid ${primary}22`,
              }}
            >
              <GraduationCap className="h-4 w-4" />
              المسار التعليمي
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={{ color: isDark ? "#F5F1EC" : "#241c16" }}
          >
            المراحل الدراسية
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mx-auto mt-3 max-w-lg text-sm leading-relaxed sm:text-base"
            style={{ color: isDark ? "#9C948A" : "#6b6258" }}
          >
            استكشف المراحل الدراسية التي نقدّمها خطوة بخطوة لبناء مستقبلك التعليمي
          </motion.p>
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((stage, i) => (
            <StageCard
              key={stage.id}
              stage={stage}
              index={i}
              isDark={isDark}
              reduced={reduced}
            />
          ))}
        </div>

        {/* show more */}
        {hasMore ? (
          <div className="mt-12 flex justify-center">
            <motion.button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold transition-all duration-300 hover:shadow-lg"
              style={{
                borderColor: isDark ? `${primary}55` : `${primary}40`,
                color: primary,
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.5)",
              }}
            >
              {expanded ? "عرض أقل" : `عرض المزيد (${all.length - INITIAL_VISIBLE})`}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : "group-hover:translate-y-0.5"}`}
              />
            </motion.button>
          </div>
        ) : null}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
        style={{
          background: isDark
            ? "linear-gradient(to top, #0c0a12, transparent)"
            : "linear-gradient(to top, #f3ece1, transparent)",
        }}
      />
    </section>
  );
}
