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
      <div
        className="pointer-events-none absolute -start-32 top-1/4 h-[420px] w-[420px] rounded-full blur-[130px]"
        style={{ background: `rgb(var(--brand-primary-rgb) / 0.051)` }}
      />
      <div
        className="pointer-events-none absolute -end-32 bottom-1/4 h-[360px] w-[360px] rounded-full blur-[120px]"
        style={{ background: `rgb(var(--brand-secondary-rgb) / 0.039)` }}
      />

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
                  background: isDark
                    ? `linear-gradient(135deg, rgb(var(--brand-primary-rgb) / 0.122), rgb(var(--brand-secondary-rgb) / 0.059))`
                    : `linear-gradient(135deg, rgb(var(--brand-primary-rgb) / 0.059), rgb(var(--brand-secondary-rgb) / 0.031))`,
                  color: PRIMARY,
                  border: `1px solid ${isDark ? `rgb(var(--brand-primary-rgb) / 0.188)` : `rgb(var(--brand-primary-rgb) / 0.11)`}`,
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
            className="relative"
          >
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-[2rem]"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, rgb(var(--brand-primary-rgb) / 0.133), rgb(var(--brand-secondary-rgb) / 0.071))`
                  : `linear-gradient(135deg, rgb(var(--brand-primary-rgb) / 0.078), rgb(var(--brand-secondary-rgb) / 0.051))`,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
              }}
            >
              {stage.image ? (
                <Image
                  src={stage.image}
                  alt={stage.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <GraduationCap className="h-24 w-24" style={{ color: `rgb(var(--brand-primary-rgb) / 0.251)` }} />
                </div>
              )}

              {/* decorative ring */}
              <div
                className="pointer-events-none absolute -end-8 -top-8 h-40 w-40 rounded-full border"
                style={{ borderColor: `rgb(var(--brand-secondary-rgb) / 0.2)` }}
              />
              <div
                className="pointer-events-none absolute -bottom-10 -start-10 h-48 w-48 rounded-full border"
                style={{ borderColor: `rgb(var(--brand-primary-rgb) / 0.18)` }}
              />
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
