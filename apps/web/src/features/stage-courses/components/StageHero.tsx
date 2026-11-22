"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Users, Layers, ChevronLeft, Sparkles } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { formatNumber } from "@/lib/format";
import type { StageItem } from "@/features/homepage/educational-stages/types";
import type { StageAggregates } from "../types";
import { ACCENT, PRIMARY } from "../constants";

interface StageHeroProps {
  stage: StageItem;
  aggregates?: StageAggregates;
  isLoading?: boolean;
}

export function StageHero({ stage, aggregates, isLoading }: StageHeroProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const stats = [
    {
      key: "courses",
      icon: BookOpen,
      value: isLoading ? "…" : formatNumber(aggregates?.coursesCount ?? 0),
      label: "دورة",
      color: PRIMARY,
    },
    {
      key: "teachers",
      icon: Users,
      value: isLoading ? "…" : formatNumber(aggregates?.teachersCount ?? 0),
      label: "مدرّس",
      color: ACCENT,
    },
    {
      key: "subjects",
      icon: Layers,
      value: isLoading ? "…" : formatNumber(aggregates?.subjects.length ?? 0),
      label: "مادة",
      color: "#22C55E",
    },
  ];

  return (
    <section dir="rtl" className="relative w-full overflow-hidden">
      {/* background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(170deg, #0e0c14 0%, #171320 55%, #0e0c14 100%)"
            : "linear-gradient(170deg, #faf6ef 0%, #f3e8dc 55%, #faf6ef 100%)",
        }}
      />

      {/* subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(${isDark ? "#fff" : "#000"} 0.5px, transparent 0.5px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* orbs */}
      <div className="pointer-events-none absolute -start-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[var(--brand-primary)] opacity-[0.10] blur-[130px]" />
      <div className="pointer-events-none absolute -end-32 bottom-1/4 h-[360px] w-[360px] rounded-full bg-[var(--brand-secondary)] opacity-[0.08] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pb-14 lg:pt-12">
        {/* breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          aria-label="مسار التصفح"
          className="mb-6 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm"
        >
          <Link
            href="/"
            className="transition-colors hover:opacity-80"
            style={{ color: isDark ? "#8a8290" : "#7a7168" }}
          >
            الرئيسية
          </Link>
          <ChevronLeft
            className="h-3.5 w-3.5"
            style={{ color: isDark ? "#55505c" : "#b3a99c" }}
          />
          <span style={{ color: isDark ? "#8a8290" : "#7a7168" }}>
            المراحل الدراسية
          </span>
          <ChevronLeft
            className="h-3.5 w-3.5"
            style={{ color: isDark ? "#55505c" : "#b3a99c" }}
          />
          <span className="font-semibold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
            {stage.name}
          </span>
        </motion.nav>

        <div className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-12">
          {/* text column */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="mb-4 inline-flex"
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold sm:text-sm"
                style={{
                  background: "var(--brand-primary)",
                  color: "var(--brand-primary-contrast)",
                  border: "1px solid var(--brand-primary)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                المسار التعليمي
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
              style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}
            >
              {stage.name}
            </motion.h1>

            {stage.description ? (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base"
                style={{ color: isDark ? "#8a8290" : "#7a7168" }}
              >
                {stage.description}
              </motion.p>
            ) : null}

            {/* stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6 flex flex-wrap gap-3"
            >
              {stats.map(({ key, icon: Icon, value, label, color }) => (
                <div
                  key={key}
                  className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                    boxShadow: isDark
                      ? "0 1px 2px rgba(0,0,0,0.25)"
                      : "0 1px 3px rgba(120,90,60,0.06)",
                  }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${color}14`, color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-base font-extrabold tabular-nums" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
                      {value}
                    </p>
                    <p className="text-[11px] font-medium" style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}>
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* image column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mx-auto w-full max-w-[460px]"
          >
            {/* ambient brand glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 rounded-[3rem] blur-3xl"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 28%, transparent), transparent 55%), linear-gradient(315deg, color-mix(in srgb, var(--brand-secondary) 26%, transparent), transparent 55%)",
              }}
            />

            {/* corner accents behind the frame */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-5 -top-5 h-28 w-28 rounded-full border"
              style={{ borderColor: "color-mix(in srgb, var(--brand-secondary) 55%, transparent)" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-5 -start-5 h-36 w-36 rounded-full border"
              style={{ borderColor: "color-mix(in srgb, var(--brand-primary) 55%, transparent)" }}
            />

            {/* layered gradient frame */}
            <div
              className="relative rounded-[28px] p-[3px] shadow-[0_28px_70px_-28px_rgba(0,0,0,0.55)]"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-secondary) 85%, white) 48%, color-mix(in srgb, var(--brand-primary) 55%, transparent))",
              }}
            >
              <div
                className="relative aspect-video overflow-hidden rounded-[25px] bg-[#100c0a]"
                style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)" }}
              >
                {stage.image ? (
                  <Image
                    src={stage.image}
                    alt={stage.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 460px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--brand-primary) 35%, transparent), transparent 65%)",
                    }}
                  >
                    <GraduationCap className="h-24 w-24" style={{ color: "var(--brand-secondary)" }} />
                  </div>
                )}

                {/* subtle sheen + depth on the glass */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,0.10), transparent 32%, transparent 68%, rgba(0,0,0,0.22))",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                  }}
                />

                {/* floating stage chip */}
                <div className="absolute bottom-4 start-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3.5 py-2 backdrop-blur-md">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      background: "var(--brand-secondary)",
                      color: "var(--brand-secondary-contrast)",
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold text-white">{stage.name}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* bottom fade into page background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
        style={{
          background: isDark
            ? "linear-gradient(to top, #0b0a10, transparent)"
            : "linear-gradient(to top, #f6f2ea, transparent)",
        }}
      />
    </section>
  );
}
