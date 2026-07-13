"use client";

import { useRef, type FC, type MouseEvent } from "react";
import { motion, useInView, useReducedMotion, useMotionValue, useSpring } from "framer-motion";
import { useUiStore } from "@/stores/ui.store";
import { usePublicWhyChooseUs } from "@/features/homepage/why-choose-us/hooks";
import { DEFAULT_WHY_CHOOSE_US, type WhyChooseUsIll, type WhyChooseUsSettings } from "@/features/homepage/why-choose-us/types";

/* ───────────────────────────────────────
   Brand palette
   ─────────────────────────────────────── */
const primary = "#D87B63";
const secondary = "#FFB50E";

/* ───────────────────────────────────────
   Fixed professional layout positions (index-based).
   Content (title/desc/ill) is fully dynamic; positions stay fixed.
   ─────────────────────────────────────── */
interface DisplayFeature {
  num: string;
  title: string;
  desc: string;
  ill: WhyChooseUsIll;
  x: number;
  y: number;
}

const POSITIONS: { x: number; y: number }[] = [
  { x: 25, y: 42 },
  { x: 50, y: 42 },
  { x: 75, y: 42 },
  { x: 25, y: 74 },
  { x: 75, y: 74 },
  { x: 50, y: 86 },
];

const pad = (n: number) => String(n).padStart(2, "0");

function buildFeatures(settings: WhyChooseUsSettings): DisplayFeature[] {
  const src = settings.features?.length ? settings.features : DEFAULT_WHY_CHOOSE_US.features;
  return src.map((f, i) => ({
    num: pad(i + 1),
    title: f.title,
    desc: f.desc,
    ill: f.ill,
    ...(POSITIONS[i] ?? { x: 50, y: 90 }),
  }));
}

/* ───────────────────────────────────────
   Shared illustration gradient defs
   ─────────────────────────────────────── */
function IllDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id="oG1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
        <linearGradient id="oG2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={secondary} />
          <stop offset="100%" stopColor={primary} />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IllCap() {
  return (<svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
    <path d="M32 14 L54 22 L32 30 L10 22 Z" fill="url(#oG1)" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M10 22 L10 27 L54 27 L54 22" fill="url(#oG1)" opacity="0.85" />
    <circle cx="32" cy="14" r="2.4" fill="#fff" />
    <path d="M32 14 L32 34" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M32 34 C38 40, 46 40, 50 34" stroke="url(#oG2)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M50 34 l3 3 l-3 3 l-3 -3 z" fill="url(#oG2)" />
    <path d="M46 9 l1.4 3 l3 1.4 l-3 1.4 l-1.4 3 l-1.4 -3 l-3 -1.4 l3 -1.4 z" fill={secondary} opacity="0.9" />
  </svg>);
}
function IllVideo() {
  return (<svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
    <rect x="9" y="14" width="46" height="36" rx="7" fill="url(#oG1)" stroke="#fff" strokeWidth="1.4" />
    <rect x="13" y="18" width="38" height="28" rx="4" fill="#fff" opacity="0.18" />
    <circle cx="32" cy="32" r="10" fill="#fff" opacity="0.92" />
    <path d="M28 27 L39 32 L28 37 Z" fill="url(#oG2)" />
    <circle cx="50" cy="13" r="2.2" fill={secondary} />
  </svg>);
}
function IllTarget() {
  return (<svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
    <circle cx="32" cy="32" r="20" stroke="url(#oG1)" strokeWidth="3" />
    <circle cx="32" cy="32" r="12.5" stroke="url(#oG2)" strokeWidth="3" opacity="0.85" />
    <circle cx="32" cy="32" r="5.5" fill="url(#oG1)" />
    <path d="M25 32 l4.6 4.6 L40 26" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M50 12 l1 2.2 l2.2 1 l-2.2 1 l-1 2.2 l-1 -2.2 l-2.2 -1 l2.2 -1 z" fill={secondary} opacity="0.9" />
  </svg>);
}
function IllChat() {
  return (<svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
    <path d="M12 14 h33 a6 6 0 0 1 6 6 v19 a6 6 0 0 1 -6 6 H26 l-9 8 V45 a6 6 0 0 1 -5 -6 V20 a6 6 0 0 1 6 -6 z" fill="url(#oG1)" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M21 24 c0 -3 4 -4 7 -2 c3 2 7 1 7 4 c0 4 -4 5 -7 3 c-3 -2 -7 -1 -7 -5 z" fill="#fff" opacity="0.95" />
    <path d="M30 30 c-1.6 -1.4 -1.2 -3.6 0.6 -4.4 c1.8 -0.8 3.8 0.4 4 2 c0.2 1.4 -0.8 2.6 -2 2.4" stroke={secondary} strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>);
}
function IllTrend() {
  return (<svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
    <path d="M12 46 L24 38 L33 43 L52 22" stroke="url(#oG1)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M52 22 L43 22 L52 31 Z" fill="url(#oG2)" />
    <rect x="11" y="48" width="6" height="4" rx="1.5" fill={primary} opacity="0.7" />
    <rect x="22" y="42" width="6" height="10" rx="1.5" fill={primary} opacity="0.55" />
    <rect x="31" y="46" width="6" height="6" rx="1.5" fill={primary} opacity="0.7" />
  </svg>);
}
function IllWallet() {
  return (<svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
    <rect x="9" y="22" width="46" height="30" rx="8" fill="url(#oG1)" stroke="#fff" strokeWidth="1.4" />
    <path d="M9 30 a8 8 0 0 1 8 -8 h29 v28 H17 a8 8 0 0 1 -8 -8 z" fill="#fff" opacity="0.16" />
    <circle cx="44" cy="37" r="7" fill="#fff" />
    <text x="44" y="41" textAnchor="middle" fontSize="9" fontWeight="700" fill="url(#oG2)">$</text>
  </svg>);
}
const illMap: Record<string, FC> = { cap: IllCap, video: IllVideo, target: IllTarget, chat: IllChat, trend: IllTrend, wallet: IllWallet };

/* ───────────────────────────────────────
   Connector SVG (hub → node)
   ─────────────────────────────────────── */
function Connectors({ isDark, isInView, reduced, features }: { isDark: boolean; isInView: boolean; reduced: boolean; features: DisplayFeature[] }) {
  const hub = { x: 500, y: 96 };
  return (
    <svg viewBox="0 0 1000 700" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="oHub" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={secondary} />
          <stop offset="60%" stopColor={primary} />
          <stop offset="100%" stopColor={primary} stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id="oLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity="0.7" />
          <stop offset="100%" stopColor={secondary} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* rotating dashed ring around hub */}
      {!reduced && (
        <motion.circle
          cx="500" cy="96" r="74"
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.07)"}
          strokeWidth="1.4"
          strokeDasharray="3 12"
          style={{ transformOrigin: "500px 96px" }}
          initial={{ opacity: 0, rotate: 0 }}
          animate={isInView ? { opacity: 1, rotate: 360 } : {}}
          transition={{ opacity: { duration: 0.8, delay: 0.4 }, rotate: { duration: 22, repeat: Infinity, ease: "linear" } }}
        />
      )}

      {/* connectors */}
      {features.map((f: DisplayFeature, i) => {
        const ex = (f.x / 100) * 1000;
        const ey = (f.y / 100) * 700;
        const sx = hub.x;
        const sy = hub.y + 46;
        const cx = sx + (ex - sx) * 0.5;
        const cy = sy + (ey - sy) * 0.5;
        const d = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
        return (
          <g key={`c-${i}`}>
            {/* base line draws in */}
            <motion.path
              d={d}
              fill="none"
              stroke="url(#oLine)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={reduced ? { opacity: 0.5 } : { pathLength: 0, opacity: 0.6 }}
              animate={isInView ? { pathLength: 1, opacity: 0.6 } : {}}
              transition={{ duration: 0.9, delay: 0.5 + i * 0.12, ease: "easeInOut" }}
            />
            {/* flowing energy dots */}
            {!reduced && (
              <motion.path
                d={d}
                fill="none"
                stroke={secondary}
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeDasharray="1 16"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 0.9, strokeDashoffset: [0, -34] } : {}}
                transition={{
                  strokeDashoffset: { duration: 1.6, repeat: Infinity, ease: "linear", delay: 1 + i * 0.15 },
                  opacity: { duration: 0.6, delay: 1 + i * 0.15 },
                }}
              />
            )}
            {/* moving spark */}
            {!reduced && (
              <motion.circle
                r="3.2"
                fill={secondary}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: [0, 1, 0] } : {}}
                transition={{ duration: 2.4, delay: 1 + i * 0.2, repeat: Infinity, repeatDelay: 1.5 }}
              >
                <animateMotion dur="2.4s" repeatCount="indefinite" path={d} begin={`${1 + i * 0.2}s`} />
              </motion.circle>
            )}
          </g>
        );
      })}

      {/* hub core */}
      <motion.circle
        cx="500" cy="96" r="56"
        fill="url(#oHub)"
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        style={{ transformOrigin: "500px 96px" }}
        transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.3 }}
      />
      <motion.circle
        cx="500" cy="96" r="56"
        fill="none"
        stroke={isDark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)"}
        strokeWidth="1.5"
        initial={{ scale: 0.8 }}
        animate={reduced ? { scale: 0.8 } : { scale: [0.8, 1.15, 0.8], opacity: [0.6, 0, 0.6] }}
        style={{ transformOrigin: "500px 96px" }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.6 }}
      />
      <text x="500" y="92" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">منظومة</text>
      <text x="500" y="110" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff" opacity="0.85">المعرفة</text>
    </svg>
  );
}

/* ───────────────────────────────────────
   Node + card
   ─────────────────────────────────────── */
function Node({ f, index, isInView, reduced, isDark }: { f: DisplayFeature; index: number; isInView: boolean; reduced: boolean; isDark: boolean }) {
  const Ill = illMap[f.ill]!;
  return (
    <motion.div
      className="absolute z-20"
      style={{ left: `${f.x}%`, top: `${f.y}%` }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: 0.8 + index * 0.12, type: "spring", stiffness: 140, damping: 14 }}
    >
      <div
        className="relative"
        style={{ transform: "translate(-50%,-50%)" }}
      >
        <motion.div
          animate={reduced ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: index * 0.3 }}
        >
          {/* glow */}
          <div className="pointer-events-none absolute -inset-4 rounded-full" style={{ background: `${index % 2 === 0 ? primary : secondary}1f` }} />
          {/* badge */}
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16"
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              border: `2px solid ${index % 2 === 0 ? primary : secondary}`,
              boxShadow: `0 12px 30px ${index % 2 === 0 ? primary : secondary}28`,
            }}
          >
            {/* pulse ring */}
            {!reduced && (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ border: `1.5px solid ${index % 2 === 0 ? primary : secondary}` }}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: [1, 1.55, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.4 }}
              />
            )}
            <div className="h-8 w-8 text-primary sm:h-9 sm:w-9"><Ill /></div>
          </div>
        </motion.div>

        {/* centered label below */}
        <div className="absolute left-1/2 top-[calc(100%+16px)] w-[210px] -translate-x-1/2 text-center">
          <div className="mb-1 text-[11px] font-extrabold" style={{ color: index % 2 === 0 ? primary : secondary }}>{f.num}</div>
          <h3 className="text-[13px] font-bold leading-snug sm:text-sm" style={{ color: isDark ? "#F5F1EC" : "#1a1a1a" }}>{f.title}</h3>
          <p className="mx-auto mt-1 max-w-[190px] text-[11px] leading-relaxed sm:text-xs" style={{ color: isDark ? "#9C948A" : "#666" }}>{f.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────────────────────
   Mobile
   ─────────────────────────────────────── */
function Mobile({ isInView, isDark, features }: { isInView: boolean; isDark: boolean; features: DisplayFeature[] }) {
  return (
    <div className="mx-auto max-w-md px-4 lg:hidden">
      <div className="relative mb-6 flex h-28 items-center justify-center">
        <svg viewBox="0 0 200 110" className="h-full w-40" fill="none">
          <defs>
            <radialGradient id="mHub" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={secondary} />
              <stop offset="100%" stopColor={primary} />
            </radialGradient>
          </defs>
          <circle cx="100" cy="55" r="34" fill="url(#mHub)" />
          <text x="100" y="52" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">منظومة</text>
          <text x="100" y="66" textAnchor="middle" fontSize="8" fontWeight="600" fill="#fff" opacity="0.85">المعرفة</text>
          {[
            [50, 30], [100, 22], [150, 30], [50, 84], [150, 84],
          ].map(([x, y], i) => (
            <line key={i} x1="100" y1="55" x2={x} y2={y} stroke={primary} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 4" />
          ))}
        </svg>
      </div>
      <div className="flex flex-col gap-3.5">
        {features.map((f: DisplayFeature, i) => {
          const Ill = illMap[f.ill]!;
          return (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-3 rounded-2xl border p-3.5"
              style={{ background: isDark ? "rgba(18,18,26,0.82)" : "rgba(255,255,255,0.88)", borderColor: `${i % 2 === 0 ? primary : secondary}1a`, boxShadow: `0 6px 18px rgba(0,0,0,${isDark ? "0.3" : "0.05"})` }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `2px solid ${i % 2 === 0 ? primary : secondary}` }}>
                <div className="h-6 w-6 text-primary"><Ill /></div>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-sm font-bold" style={{ color: isDark ? "#F5F1EC" : "#1a1a1a" }}>{f.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: isDark ? "#9C948A" : "#666" }}>{f.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────
   Background decoration (edges / fill)
   ─────────────────────────────────────── */
function Plus({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1 V13 M1 7 H13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function BackgroundDecor({ isDark, reduced }: { isDark: boolean; reduced: boolean }) {
  const dot = isDark ? "rgba(255,255,255,0.05)" : "rgba(120,90,60,0.06)";
  const ring = isDark ? "rgba(255,255,255,0.07)" : "rgba(120,90,60,0.06)";
  const plus = isDark ? "rgba(255,255,255,0.14)" : "rgba(120,90,60,0.12)";
  const plusPos = [
    [11, 16], [87, 11], [5, 58], [93, 66], [16, 90], [82, 92], [50, 6], [50, 95],
  ];
  const floatDots = [
    { x: "14%", y: "30%", c: primary, s: 10, d: 0 },
    { x: "85%", y: "22%", c: secondary, s: 7, d: 1.2 },
    { x: "8%", y: "78%", c: secondary, s: 8, d: 0.6 },
    { x: "90%", y: "58%", c: primary, s: 6, d: 1.8 },
    { x: "24%", y: "12%", c: primary, s: 5, d: 2.4 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* dot grid */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="oDots" width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill={dot} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#oDots)" />
      </svg>

      {/* faint large rings at edges */}
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full border" style={{ borderColor: ring }} />
      <div className="absolute -right-28 -bottom-28 h-96 w-96 rounded-full border" style={{ borderColor: ring }} />
      <div className="absolute -right-16 top-1/3 h-44 w-44 rounded-full border" style={{ borderColor: ring }} />
      <div className="absolute -left-20 bottom-1/4 h-52 w-52 rounded-full border" style={{ borderColor: ring }} />

      {/* plus marks */}
      {plusPos.map(([x, y], i) => (
        <span key={i} className="absolute" style={{ left: `${x}%`, top: `${y}%`, color: plus }}>
          <Plus color={plus} />
        </span>
      ))}

      {/* floating accent dots */}
      {!reduced &&
        floatDots.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ left: p.x, top: p.y, width: p.s, height: p.s, background: p.c, opacity: 0.16 }}
            animate={{ y: [0, -10, 0], opacity: [0.12, 0.3, 0.12] }}
            transition={{ duration: 5, repeat: Infinity, delay: p.d }}
          />
        ))}
    </div>
  );
}

/* ───────────────────────────────────────
   Main
   ─────────────────────────────────────── */
export function WhyChooseUsOrbit({ settings }: { settings?: WhyChooseUsSettings }) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion() ?? false;

  const { data } = usePublicWhyChooseUs();
  const src = settings ?? data ?? DEFAULT_WHY_CHOOSE_US;

  if (src.isActive === false) return null;

  const title = src.title || "لماذا تختارنا؟";
  const subtitle =
    src.subtitle ||
    "من قلب المنظومة تشعّ كل ميزة — نظام متصل يحيط طالبك بكل ما يحتاجه للنجاح";
  const features = buildFeatures(src);

  // 3D mouse-parallax tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(my, { stiffness: 60, damping: 15 });
  const ry = useSpring(mx, { stiffness: 60, damping: 15 });
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 9);
    my.set(-((e.clientY - r.top) / r.height - 0.5) * 9);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section ref={ref} dir="rtl" className="relative w-full overflow-hidden py-12 sm:py-16 lg:py-24">
      <IllDefs />
      <div className="absolute inset-0" style={{ background: isDark ? "radial-gradient(ellipse at 50% 40%, #15131C 0%, #100E16 45%, #0C0A12 100%)" : "radial-gradient(ellipse at 50% 40%, #FBF6F0 0%, #F6EFE6 45%, #F0E8DC 100%)" }} />
      <div className="pointer-events-none absolute -start-10 top-10 h-72 w-72 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${primary}0c, transparent 70%)` }} />
      <div className="pointer-events-none absolute -end-10 bottom-0 h-72 w-72 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${secondary}0a, transparent 70%)` }} />

      {/* background decoration */}
      <BackgroundDecor isDark={isDark} reduced={reduced} />

      {/* title */}
      <div className="relative z-30 mx-auto mb-6 max-w-2xl px-4 text-center sm:mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55 }}>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold sm:text-sm" style={{ background: isDark ? `linear-gradient(135deg, ${primary}18, ${secondary}10)` : `linear-gradient(135deg, ${primary}12, ${secondary}08)`, color: primary, border: `1px solid ${primary}22` }}>{title}</span>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay: 0.16 }} className="mx-auto mt-4 max-w-lg text-sm leading-relaxed sm:text-base" style={{ color: isDark ? "#9C948A" : "#666" }}>
          {subtitle}
        </motion.p>
      </div>

      {/* desktop orbit */}
      <div
        className="relative z-10 mx-auto hidden max-w-6xl px-4 lg:block"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <motion.div
          className="relative mx-auto aspect-[10/7] w-full"
          style={{ perspective: 1200, rotateX: rx, rotateY: ry }}
        >
          <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
            <Connectors isDark={isDark} isInView={isInView} reduced={reduced} features={features} />
            {features.map((f, i) => (
              <Node key={f.num} f={f} index={i} isInView={isInView} reduced={reduced} isDark={isDark} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* mobile */}
      <Mobile isInView={isInView} isDark={isDark} features={features} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28" style={{ background: isDark ? "linear-gradient(to top, #0C0A12, transparent)" : "linear-gradient(to top, #F0E8DC, transparent)" }} />
    </section>
  );
}
