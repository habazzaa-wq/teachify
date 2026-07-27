"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  GraduationCap,
  Play,
  Target,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { usePublicWhyChooseUs } from "@/features/homepage/why-choose-us/hooks";
import {
  DEFAULT_WHY_CHOOSE_US,
  type WhyChooseUsIll,
  type WhyChooseUsSettings,
} from "@/features/homepage/why-choose-us/types";

interface FeatureConfig {
  gradient: string;
  glow: string;
  accent: string;
  Icon: typeof GraduationCap;
}

const COPPER = "#D87B63";
const GOLD = "#FFB50E";

const FEATURE_CONFIG: Record<WhyChooseUsIll, FeatureConfig> = {
  cap: {
    gradient: `linear-gradient(135deg, ${COPPER}, ${GOLD})`,
    glow: `radial-gradient(ellipse at 50% 40%, rgba(216,123,99,0.14) 0%, transparent 65%)`,
    accent: COPPER,
    Icon: GraduationCap,
  },
  video: {
    gradient: `linear-gradient(135deg, ${GOLD}, ${COPPER})`,
    glow: `radial-gradient(ellipse at 50% 40%, rgba(255,181,14,0.12) 0%, transparent 65%)`,
    accent: GOLD,
    Icon: Play,
  },
  target: {
    gradient: `linear-gradient(135deg, ${COPPER}, ${GOLD})`,
    glow: `radial-gradient(ellipse at 50% 40%, rgba(216,123,99,0.12) 0%, transparent 65%)`,
    accent: COPPER,
    Icon: Target,
  },
  chat: {
    gradient: `linear-gradient(135deg, ${GOLD}, ${COPPER})`,
    glow: `radial-gradient(ellipse at 50% 40%, rgba(255,181,14,0.12) 0%, transparent 65%)`,
    accent: GOLD,
    Icon: MessageCircle,
  },
  trend: {
    gradient: `linear-gradient(135deg, ${COPPER}, ${GOLD})`,
    glow: `radial-gradient(ellipse at 50% 40%, rgba(216,123,99,0.12) 0%, transparent 65%)`,
    accent: COPPER,
    Icon: TrendingUp,
  },
  wallet: {
    gradient: `linear-gradient(135deg, ${GOLD}, ${COPPER})`,
    glow: `radial-gradient(ellipse at 50% 40%, rgba(255,181,14,0.12) 0%, transparent 65%)`,
    accent: GOLD,
    Icon: TrendingUp,
  },
};

interface DisplayFeature {
  num: string;
  title: string;
  desc: string;
  ill: WhyChooseUsIll;
}

function buildFeatures(s: WhyChooseUsSettings): DisplayFeature[] {
  const src = s.features?.length ? s.features : DEFAULT_WHY_CHOOSE_US.features;
  return src.map((f, i) => ({
    num: String(i + 1).padStart(2, "0"),
    title: f.title,
    desc: f.desc,
    ill: f.ill,
  }));
}

function PremiumIllustration({
  ill,
  isDark,
}: {
  ill: WhyChooseUsIll;
  isDark: boolean;
}) {
  const cfg = FEATURE_CONFIG[ill];
  const Icon = cfg.Icon;

  const copperA = isDark ? "rgba(216,123,99,0.22)" : "rgba(216,123,99,0.28)";
  const goldA = isDark ? "rgba(255,181,14,0.16)" : "rgba(255,181,14,0.22)";
  const ringCol = isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.03)";
  const particleOp = isDark ? 0.2 : 0.15;
  const gridLineCol = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)";

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* ── Ambient glow backdrop ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 45%, ${copperA} 0%, transparent 58%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 55% 55%, ${goldA} 0%, transparent 52%)`,
        }}
      />

      {/* ── Concentric animated rings ── */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            width: 80 + i * 44,
            height: 80 + i * 44,
            border: `1px solid ${ringCol}`,
          }}
          animate={{
            rotate: i % 2 === 0 ? 360 : -360,
            scale: [1, 1 + i * 0.008, 1],
          }}
          transition={{
            rotate: { duration: 28 + i * 8, repeat: Infinity, ease: "linear" },
            scale: { duration: 6 + i, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}

      {/* ── Floating geometric shapes ── */}
      <motion.div
        className="absolute rounded-sm"
        style={{
          width: 10,
          height: 10,
          background: copperA,
          left: "16%",
          top: "22%",
          rotate: 45,
        }}
        animate={{ y: [-6, 6, -6], rotate: [45, 55, 45] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 8,
          height: 8,
          background: goldA,
          right: "20%",
          top: "28%",
        }}
        animate={{ y: [5, -5, 5], scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute rounded-sm"
        style={{
          width: 7,
          height: 7,
          background: goldA,
          left: "22%",
          bottom: "26%",
          rotate: 30,
        }}
        animate={{ y: [3, -5, 3], rotate: [30, 45, 30] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 6,
          height: 6,
          background: copperA,
          right: "18%",
          bottom: "30%",
        }}
        animate={{ y: [-4, 6, -4], scale: [1, 1.2, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute"
        style={{
          width: 5,
          height: 5,
          background: copperA,
          left: "42%",
          top: "16%",
          borderRadius: 1,
          rotate: 20,
        }}
        animate={{ y: [4, -3, 4], rotate: [20, 35, 20] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* ── Grid pattern ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${gridLineCol} 1px, transparent 1px), linear-gradient(90deg, ${gridLineCol} 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
          opacity: 0.7,
          maskImage: "radial-gradient(ellipse at 50% 50%, black 25%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 25%, transparent 70%)",
        }}
      />

      {/* ── Decorative dots ── */}
      {[
        { x: "20%", y: "25%", s: 3 },
        { x: "75%", y: "30%", s: 2.5 },
        { x: "30%", y: "70%", s: 3 },
        { x: "65%", y: "65%", s: 2.5 },
        { x: "45%", y: "18%", s: 2 },
        { x: "55%", y: "78%", s: 2 },
      ].map((d, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute rounded-full"
          style={{
            width: d.s,
            height: d.s,
            background: i % 2 === 0 ? copperA : goldA,
            left: d.x,
            top: d.y,
          }}
          animate={{
            opacity: [particleOp * 0.5, particleOp, particleOp * 0.5],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}

      {/* ── Thin decorative lines ── */}
      <motion.div
        className="absolute h-px"
        style={{
          width: "45%",
          left: "27.5%",
          top: "38%",
          background: `linear-gradient(90deg, transparent, ${copperA}, transparent)`,
        }}
        animate={{ opacity: [0.08, 0.2, 0.08], scaleX: [0.85, 1, 0.85] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-px"
        style={{
          height: "35%",
          top: "32.5%",
          left: "50%",
          background: `linear-gradient(180deg, transparent, ${goldA}, transparent)`,
        }}
        animate={{ opacity: [0.06, 0.16, 0.06], scaleY: [0.9, 1, 0.9] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* ── Central icon ── */}
      <motion.div
        className="relative z-10"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="rounded-full"
          style={{
            padding: "1.5rem",
            boxShadow: `0 0 40px ${copperA}, 0 0 80px rgba(255,181,14,0.08)`,
          }}
        >
          <Icon className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.2} style={{ color: isDark ? "#EDEAE4" : "#1a1510" }} />
        </div>
      </motion.div>
    </div>
  );
}

export function WhyChooseUsOrbit({
  settings,
}: {
  settings?: WhyChooseUsSettings;
}) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const reduced = useReducedMotion() ?? false;

  const { data } = usePublicWhyChooseUs();
  const src = settings ?? data ?? DEFAULT_WHY_CHOOSE_US;

  const title = src.title?.trim() || "لماذا تختارنا؟";
  const subtitle =
    src.subtitle?.trim() ||
    "من قلب المنظومة تشعّ كل ميزة — نظام متصل يحيط طالبك بكل ما يحتاجه للنجاح";
  const features = useMemo(() => buildFeatures(src), [src]);

  const [activeIdx, setActiveIdx] = useState(0);
  const active = features[activeIdx] ?? features[0];
  const activeConfig = FEATURE_CONFIG[active.ill];

  if (src.isActive === false) return null;

  const accentWarm = isDark ? "rgba(216,123,99,0.06)" : "rgba(216,123,99,0.04)";
  const accentCool = isDark ? "rgba(255,181,14,0.04)" : "rgba(255,181,14,0.03)";

  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden py-20 sm:py-28 lg:py-36"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(180deg, #08060e 0%, #0b0912 40%, #0a0810 100%)"
              : "linear-gradient(180deg, #faf8f5 0%, #f6f2ed 50%, #f4f0eb 100%)",
          }}
        />
        {/* Ambient top-left warm glow */}
        <div
          className="absolute -left-[15%] -top-[20%] h-[600px] w-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, ${accentWarm}, transparent 70%)`, filter: "blur(100px)" }}
        />
        {/* Ambient bottom-right cool glow */}
        <div
          className="absolute -bottom-[20%] -right-[10%] h-[500px] w-[500px] rounded-full"
          style={{ background: `radial-gradient(circle, ${accentCool}, transparent 70%)`, filter: "blur(100px)" }}
        />
        {/* Active feature glow */}
        <motion.div
          key={`glow-${active.ill}`}
          className="absolute left-1/2 top-[45%] h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: activeConfig.glow, filter: "blur(90px)" }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 text-center sm:mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 sm:px-5 sm:py-2"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(216,123,99,0.07), rgba(255,181,14,0.04))"
                : "linear-gradient(135deg, rgba(216,123,99,0.06), rgba(255,181,14,0.03))",
              border: `1px solid ${isDark ? "rgba(216,123,99,0.1)" : "rgba(216,123,99,0.08)"}`,
            }}
          >
            <span
              className="text-xs font-semibold tracking-wide sm:text-sm"
              style={{ color: COPPER }}
            >
              {title}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
            style={{ color: isDark ? "#EDEAE4" : "#1a1510" }}
          >
            {subtitle}
          </motion.h2>
        </div>

        {/* Glass Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]"
          style={{
            background: isDark
              ? "linear-gradient(165deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.005) 100%)"
              : "linear-gradient(165deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.45) 100%)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"}`,
            boxShadow: isDark
              ? [
                  "0 1px 0 0 rgba(255,255,255,0.04) inset",
                  "0 4px 24px rgba(0,0,0,0.25)",
                  "0 16px 48px rgba(0,0,0,0.2)",
                  "0 32px 80px rgba(0,0,0,0.15)",
                ].join(", ")
              : [
                  "0 1px 0 0 rgba(255,255,255,0.8) inset",
                  "0 2px 12px rgba(0,0,0,0.04)",
                  "0 8px 32px rgba(0,0,0,0.05)",
                  "0 24px 64px rgba(0,0,0,0.04)",
                ].join(", "),
            backdropFilter: "blur(32px) saturate(1.2)",
          }}
        >
          {/* Inner top highlight */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background: isDark
                ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)"
                : "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
            }}
          />

          {/* Feature Chips */}
          <div
            className="flex flex-wrap justify-center gap-1.5 p-3 sm:gap-2 sm:p-4 lg:p-5"
            style={{
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.035)"}`,
            }}
          >
            {features.map((f, i) => {
              const cfg = FEATURE_CONFIG[f.ill];
              const isActive = activeIdx === i;
              return (
                <motion.button
                  key={f.num}
                  onClick={() => setActiveIdx(i)}
                  className="relative flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium sm:px-4 sm:py-2.5 sm:text-sm"
                  style={{
                    color: isActive ? "#fff" : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.38)"),
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    outline: "none",
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="wcu-active-chip"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${COPPER}, ${GOLD})`,
                        boxShadow: `0 1px 12px ${COPPER}25, 0 4px 20px ${COPPER}15`,
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <cfg.Icon className="relative z-10 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
                  <span className="relative z-10 hidden sm:inline leading-none">{f.title}</span>
                  <span className="relative z-10 sm:hidden leading-none">{f.num}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="relative min-h-[320px] sm:min-h-[380px] lg:min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.ill}
                initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-8 p-6 sm:p-10 lg:flex-row lg:items-center lg:gap-16 lg:px-14 lg:py-12"
              >
                {/* Illustration */}
                <div
                  className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-[1.25rem] sm:h-56 sm:w-56 sm:rounded-[1.5rem] lg:h-64 lg:w-64"
                  style={{
                    background: isDark
                      ? "linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))"
                      : "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}`,
                    boxShadow: [
                      `0 0 0 1px ${isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.6)"}`,
                      `0 8px 40px ${COPPER}10`,
                      isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.04)",
                    ].join(", "),
                  }}
                >
                  {/* Gradient border glow */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-[inherit]"
                    style={{
                      background: `linear-gradient(135deg, ${COPPER}15, transparent 40%, ${GOLD}10)`,
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "exclude",
                      WebkitMaskComposite: "xor",
                      padding: "1px",
                    }}
                  />
                  {/* Inner ambient glow */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[inherit]"
                    style={{
                      background: isDark
                        ? `radial-gradient(ellipse at 50% 40%, ${COPPER}08 0%, transparent 70%)`
                        : `radial-gradient(ellipse at 50% 40%, ${COPPER}0a 0%, transparent 70%)`,
                    }}
                  />
                  {!reduced && (
                    <PremiumIllustration ill={active.ill} isDark={isDark} />
                  )}
                </div>

                {/* Text */}
                <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-start">
                  <div
                    className="mb-3 font-mono text-[11px] font-medium tracking-[0.25em] uppercase sm:text-xs"
                    style={{ color: activeConfig.accent, opacity: 0.75 }}
                  >
                    Feature {active.num}
                  </div>
                  <h3
                    className="mb-4 text-[1.65rem] font-bold leading-snug tracking-tight sm:text-3xl lg:mb-5 lg:text-[2.1rem] lg:leading-tight"
                    style={{ color: isDark ? "#EDEAE4" : "#1a1510" }}
                  >
                    {active.title}
                  </h3>
                  <div
                    className="mb-5 h-[3px] w-10 rounded-full sm:mb-6"
                    style={{ background: `linear-gradient(135deg, ${COPPER}, ${GOLD})` }}
                  />
                  <p
                    className="max-w-md text-[15px] leading-[1.7] sm:text-base lg:text-[17px] lg:leading-[1.75]"
                    style={{ color: isDark ? "#8a8694" : "#736c63" }}
                  >
                    {active.desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Dot Indicators */}
        <div className="mt-8 flex items-center justify-center gap-2.5 sm:mt-10">
          {features.map((f, i) => {
            const isActive = activeIdx === i;
            return (
              <button
                key={f.num}
                onClick={() => setActiveIdx(i)}
                className="group cursor-pointer border-none bg-transparent p-0.5"
                aria-label={`Feature ${f.num}`}
              >
                <div
                  className="rounded-full transition-all duration-500"
                  style={{
                    height: isActive ? 4 : 3,
                    width: isActive ? 28 : 6,
                    background: isActive
                      ? `linear-gradient(135deg, ${COPPER}, ${GOLD})`
                      : isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.08)",
                    boxShadow: isActive ? `0 0 8px ${COPPER}30` : "none",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
