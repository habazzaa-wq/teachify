"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Users, Layers, ChevronLeft, Sparkles, GraduationCap } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { formatNumber } from "@/lib/format";
import type { CatalogAggregates } from "../types";
import { ACCENT, PRIMARY } from "../constants";

interface CatalogHeroProps {
  aggregates?: CatalogAggregates;
  isLoading?: boolean;
}

export function CatalogHero({ aggregates, isLoading }: CatalogHeroProps) {
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
      <div className="pointer-events-none absolute -start-32 top-1/4 h-[420px] w-[420px] rounded-full blur-[130px]" />
      <div className="pointer-events-none absolute -end-32 bottom-1/4 h-[360px] w-[360px] rounded-full blur-[120px]" />

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
          <span className="font-semibold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
            جميع الكورسات
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
                مكتبة الدورات التعليمية
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
              style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}
            >
              اكتشف جميع الكورسات
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base"
              style={{ color: isDark ? "#8a8290" : "#7a7168" }}
            >
              استعرض جميع الدورات المتاحة على منصتنا، وصفِّ النتائج حسب المرحلة الدراسية
              أو المادة أو المدرّس أو السعر، وابدأ رحلة تعلّم جديدة بكل سهولة.
            </motion.p>

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
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex h-36 w-36 flex-col items-center justify-center gap-3 rounded-[2rem] backdrop-blur-md"
                  style={{
                    background: isDark ? "rgba(22,20,30,0.6)" : "rgba(255,255,255,0.7)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
                    boxShadow: isDark
                      ? "0 24px 64px rgba(0,0,0,0.4)"
                      : "0 24px 64px rgba(120,90,60,0.12)",
                  }}
                >
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ color: PRIMARY }}
                  >
                    <GraduationCap className="h-8 w-8" />
                  </span>
                  <p className="text-sm font-extrabold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
                    تعلّم بلا حدود
                  </p>
                </div>
              </div>

              {/* decorative ring */}
              <div
                className="pointer-events-none absolute -end-8 -top-8 h-40 w-40 rounded-full border"
                style={{ borderColor: "var(--brand-secondary)" }}
              />
              <div
                className="pointer-events-none absolute -bottom-10 -start-10 h-48 w-48 rounded-full border"
                style={{ borderColor: "var(--brand-primary)" }}
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
