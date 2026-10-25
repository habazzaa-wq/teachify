"use client";

import { type FC } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { usePublicWhyChooseUs } from "@/features/homepage/why-choose-us/hooks";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { DEFAULT_WHY_CHOOSE_US, type WhyChooseUsIll, type WhyChooseUsSettings } from "@/features/homepage/why-choose-us/types";

/* ───────────────────────────────────────
   Brand palette
   ─────────────────────────────────────── */
const primary = "var(--brand-primary)";
const secondary = "var(--brand-secondary)";

interface DisplayFeature {
  num: string;
  title: string;
  desc: string;
  ill: WhyChooseUsIll;
}

const pad = (n: number) => String(n).padStart(2, "0");

function buildFeatures(settings: WhyChooseUsSettings): DisplayFeature[] {
  const src = settings.features?.length ? settings.features : DEFAULT_WHY_CHOOSE_US.features;
  return src.map((f, i) => ({
    num: pad(i + 1),
    title: f.title,
    desc: f.desc,
    ill: f.ill,
  }));
}

/* ───────────────────────────────────────
   Bento layout rules
   The first feature is a large "flagship" tile (2×2 on desktop).
   Depending on the total feature count the last tiles / CTA tile
   stretch to fill the grid with no holes.
   ─────────────────────────────────────── */
function bentoCell(i: number, total: number): string {
  if (i === 0) return "sm:col-span-2 lg:col-span-2 lg:row-span-2";
  if (i === 1) return "sm:col-span-2 lg:col-span-1";
  if (total === 3 && i === 2) return "lg:col-span-2";
  if (total === 4 && i === 3) return "lg:col-span-2";
  return "lg:col-span-1";
}

const showCtaTile = (total: number) => total >= 2 && total <= 5;

/* ───────────────────────────────────────
   Shared illustration gradient defs
   ─────────────────────────────────────── */
function IllDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id="oG1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={primary} />
        </linearGradient>
        <linearGradient id="oG2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={secondary} />
          <stop offset="100%" stopColor={secondary} />
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
   Shared tokens
   ─────────────────────────────────────── */
const ink = (isDark: boolean) => (isDark ? "#F5F1EC" : "#1a1a1a");
const muted = (isDark: boolean) => (isDark ? "#9C948A" : "#666");
const cardBg = (isDark: boolean) => (isDark ? "rgba(22,20,30,0.72)" : "rgba(255,255,255,0.92)");

/* ───────────────────────────────────────
   Regular feature tile
   ─────────────────────────────────────── */
function FeatureTile({
  f,
  index,
  isDark,
}: {
  f: DisplayFeature;
  index: number;
  isDark: boolean;
}) {
  const Ill = illMap[f.ill]!;
  const accent = index % 2 === 0 ? primary : secondary;

  if (index === 0) {
    return (
      <div
        className="wc-reveal relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6 text-[var(--brand-primary-contrast)] sm:p-8"
        style={{
          background: "var(--brand-primary)",
          boxShadow: `0 18px 44px rgba(0,0,0,0.22)`,
          ["--wc-delay" as string]: "0.05s",
        }}
      >
        {/* decorations */}
        <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -start-12 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -end-8 bottom-8 h-24 w-24 rounded-full border border-white/25" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* top row */}
        <div className="relative flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold backdrop-blur-sm">
            <Sparkles aria-hidden="true" className="h-3 w-3" />
            {f.num}
          </span>
          <span className="text-[11px] font-bold tracking-widest text-white/80">الأفضل دائمًا</span>
        </div>

        {/* emblem */}
        <div className="relative my-6 flex justify-center">
          <div aria-hidden="true" className="absolute -inset-4 rounded-full bg-white/25 blur-2xl" />
          <div aria-hidden="true" className="absolute -start-2 top-2 h-2.5 w-2.5 rounded-full" style={{ background: "#fff" }} />
          <div aria-hidden="true" className="absolute -end-1 bottom-4 h-2 w-2 rounded-full bg-white/70" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/95 shadow-2xl sm:h-32 sm:w-32">
            <div className="h-14 w-14 sm:h-16 sm:w-16"><Ill /></div>
          </div>
        </div>

        {/* text */}
        <div className="relative">
          <h3 className="text-xl font-extrabold leading-snug sm:text-2xl">{f.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-[15px]">{f.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="wc-reveal group relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6"
      style={{
        background: cardBg(isDark),
        borderColor: accent,
        boxShadow: isDark
          ? "0 10px 30px rgba(0,0,0,0.28)"
          : "0 10px 30px rgba(0,0,0,0.071)",
        ["--wc-delay" as string]: `${0.08 + index * 0.06}s`,
      }}
    >
      {/* icon */}
      <div
        className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14"
        style={{
          background: accent,
          border: `1px solid ${accent}`,
        }}
      >
        <div className="h-7 w-7 sm:h-8 sm:w-8"><Ill /></div>
      </div>

      <h3 className="relative text-[15px] font-extrabold leading-snug sm:text-base" style={{ color: ink(isDark) }}>
        {f.title}
      </h3>
      <p className="relative mt-1.5 text-xs leading-relaxed sm:text-[13px]" style={{ color: muted(isDark) }}>
        {f.desc}
      </p>
    </div>
  );
}

/* ───────────────────────────────────────
   CTA tile (fills the bento on smaller feature counts)
   ─────────────────────────────────────── */
function CtaTile({ isDark }: { isDark: boolean }) {
  return (
    <a
      href="#educational-stages"
      className="wc-reveal group relative flex h-full flex-col items-start justify-center gap-3.5 overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
      style={{
        background: "var(--brand-primary)",
        borderColor: "var(--brand-primary)",
        boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.28)" : "0 10px 30px rgba(0,0,0,0.05)",
        ["--wc-delay" as string]: "0.34s",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -end-10 -top-12 h-32 w-32 rounded-full border-2 border-dashed" style={{ borderColor: "var(--brand-primary)" }} />

      <span
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl text-[var(--brand-primary)] transition-transform duration-300 group-hover:scale-110"
        style={{
          background: "var(--brand-primary-contrast)",
          boxShadow: `0 10px 24px rgba(0,0,0,0.239)`,
        }}
      >
        <ArrowLeft aria-hidden="true" className="h-6 w-6" />
      </span>
      <h3 className="relative text-lg font-extrabold leading-snug" style={{ color: "var(--brand-primary-contrast)" }}>
        جاهز للانطلاق؟
      </h3>
      <p className="relative -mt-2 text-sm leading-relaxed" style={{ color: "var(--brand-primary-contrast)" }}>
        ابدأ رحلة النجاح مع منظومة تعليمية متكاملة تواكب طموحك
      </p>
      <span
        className="relative mt-1 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-[var(--brand-secondary-contrast)] transition-transform duration-300 group-hover:scale-[1.03]"
        style={{
          background: secondary,
          boxShadow: `0 10px 26px rgba(0,0,0,0.22)`,
        }}
      >
        استكشف المراحل
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
      </span>
    </a>
  );
}

/* ───────────────────────────────────────
   Background decoration
   ─────────────────────────────────────── */
function Plus({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1 V13 M1 7 H13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function BackgroundDecor({ isDark }: { isDark: boolean }) {
  const dot = isDark ? "rgba(255,255,255,0.05)" : "rgba(120,90,60,0.06)";
  const ring = isDark ? "rgba(255,255,255,0.07)" : "rgba(120,90,60,0.06)";
  const plus = isDark ? "rgba(255,255,255,0.14)" : "rgba(120,90,60,0.12)";
  const plusPos = [
    [11, 16], [87, 11], [5, 58], [93, 66], [16, 90], [82, 92], [50, 6], [50, 95],
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="oDots" width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill={dot} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#oDots)" />
      </svg>

      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full border" style={{ borderColor: ring }} />
      <div className="absolute -right-28 -bottom-28 h-96 w-96 rounded-full border" style={{ borderColor: ring }} />
      <div className="absolute -right-16 top-1/3 h-44 w-44 rounded-full border" style={{ borderColor: ring }} />
      <div className="absolute -left-20 bottom-1/4 h-52 w-52 rounded-full border" style={{ borderColor: ring }} />

      {plusPos.map(([x, y], i) => (
        <span key={i} className="absolute" style={{ left: `${x}%`, top: `${y}%`, color: plus }}>
          <Plus color={plus} />
        </span>
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
  const { ref, inView } = useInViewOnce<HTMLElement>({ rootMargin: "0px 0px -40px 0px" });

  const { data } = usePublicWhyChooseUs();
  const src = settings ?? data ?? DEFAULT_WHY_CHOOSE_US;

  const title = src.title?.trim() || "لماذا تختارنا؟";
  const subtitle =
    src.subtitle?.trim() ||
    "من قلب المنظومة تشعّ كل ميزة — نظام متصل يحيط طالبك بكل ما يحتاجه للنجاح";
  const features = buildFeatures(src);
  const total = features.length;

  if (src.isActive === false) return null;

  return (
    <section
      ref={ref}
      dir="rtl"
      className={`section-lazy relative w-full overflow-hidden py-12 sm:py-16 lg:py-24${inView ? " wc-in-view" : ""}`}
    >
      <IllDefs />

      {/* background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(170deg, #0e0c14 0%, #16121c 55%, #0e0c14 100%)"
            : "linear-gradient(170deg, #fdfbf7 0%, #f7f1e7 55%, #fdfbf7 100%)",
        }}
      />
      <BackgroundDecor isDark={isDark} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <div className="wc-reveal" style={{ ["--wc-delay" as string]: "0s" }}>
            <span
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-[var(--brand-primary-contrast)]"
              style={{
                background: "var(--brand-primary)",
                color: "var(--brand-primary-contrast)",
                border: `1px solid var(--brand-primary)`,
              }}
            >
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" style={{ color: secondary }} />
              مميزات المنظومة
            </span>
          </div>

          <h2
            className="wc-reveal mx-auto pb-2 text-3xl font-extrabold leading-snug sm:text-4xl lg:text-[42px]"
            style={{ color: primary, ["--wc-delay" as string]: "0.12s" }}
          >
            {title}
          </h2>

          <p
            className="wc-reveal mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base"
            style={{ color: muted(isDark), ["--wc-delay" as string]: "0.2s" }}
          >
            {subtitle}
          </p>

          {/* divider */}
          <div className="wc-reveal mt-6 flex items-center justify-center gap-2" style={{ ["--wc-delay" as string]: "0.26s" }}>
            <span className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(to left, var(--brand-primary), transparent)` }} />
            <span className="h-1.5 w-1.5 rotate-45 rounded-[2px]" style={{ background: secondary }} />
            <span className="h-1.5 w-1.5 rotate-45 rounded-[2px]" style={{ background: primary, opacity: 0.6 }} />
            <span className="h-1.5 w-1.5 rotate-45 rounded-[2px]" style={{ background: secondary }} />
            <span className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(to right, var(--brand-secondary), transparent)` }} />
          </div>
        </div>

        {/* bento grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:auto-rows-fr lg:gap-6">
          {features.map((f, i) => (
            <div key={`${f.num}-${i}`} className={`h-full ${bentoCell(i, total)}`}>
              <FeatureTile f={f} index={i} isDark={isDark} />
            </div>
          ))}

          {showCtaTile(total) ? (
            <div className="h-full lg:col-span-1">
              <CtaTile isDark={isDark} />
            </div>
          ) : null}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
        style={{
          background: isDark
            ? "linear-gradient(to top, #0e0c14, transparent)"
            : "linear-gradient(to top, #fdfbf7, transparent)",
        }}
      />
    </section>
  );
}
