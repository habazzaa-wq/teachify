"use client";

import { type FC } from "react";
import { useUiStore } from "@/stores/ui.store";
import { usePublicWhyChooseUs } from "@/features/homepage/why-choose-us/hooks";
import { useInViewOnce } from "@/hooks/useInViewOnce";
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
   Connector SVG (hub → node).
   Fully static. The only motion is a one-shot
   draw-in that runs once when the section enters view.
   ─────────────────────────────────────── */
function Connectors({ isDark, features }: { isDark: boolean; features: DisplayFeature[] }) {
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

      {/* static dashed ring around hub */}
      <circle
        cx="500" cy="96" r="74"
        fill="none"
        stroke={isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.07)"}
        strokeWidth="1.4"
        strokeDasharray="3 12"
      />

      {/* connectors (draw in once) */}
      {features.map((f: DisplayFeature, i) => {
        const ex = (f.x / 100) * 1000;
        const ey = (f.y / 100) * 700;
        const sx = hub.x;
        const sy = hub.y + 46;
        const cx = sx + (ex - sx) * 0.5;
        const cy = sy + (ey - sy) * 0.5;
        const d = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
        return (
          <path
            key={`c-${i}`}
            d={d}
            className="wc-line"
            fill="none"
            stroke="url(#oLine)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ "--wc-delay": `${0.5 + i * 0.12}s` } as React.CSSProperties}
          />
        );
      })}

      {/* hub core (static) */}
      <circle cx="500" cy="96" r="56" fill="url(#oHub)" />
      <circle
        cx="500" cy="96" r="56"
        fill="none"
        stroke={isDark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)"}
        strokeWidth="1.5"
      />
      <text x="500" y="92" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">منظومة</text>
      <text x="500" y="110" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff" opacity="0.85">المعرفة</text>
    </svg>
  );
}

/* ───────────────────────────────────────
   Node + card (static; one-shot reveal on view)
   ─────────────────────────────────────── */
function Node({ f, index, isDark }: { f: DisplayFeature; index: number; isDark: boolean }) {
  const Ill = illMap[f.ill]!;
  const accent = index % 2 === 0 ? primary : secondary;
  return (
    <div
      className="wc-reveal absolute z-20"
      style={{ left: `${f.x}%`, top: `${f.y}%`, ["--wc-delay" as string]: `${0.8 + index * 0.12}s` }}
    >
      <div
        className="relative"
        style={{ transform: "translate(-50%,-50%)" }}
      >
        <div>
          {/* glow */}
          <div className="pointer-events-none absolute -inset-4 rounded-full" style={{ background: `${accent}1f` }} />
          {/* badge */}
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16"
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              border: `2px solid ${accent}`,
              boxShadow: `0 12px 30px ${accent}28`,
            }}
          >
            <div className="h-8 w-8 text-primary sm:h-9 sm:w-9"><Ill /></div>
          </div>
        </div>

        {/* centered label below */}
        <div className="absolute left-1/2 top-[calc(100%+16px)] w-[clamp(150px,17vw,220px)] -translate-x-1/2 px-1 text-center">
          <div className="mb-1 text-[11px] font-extrabold" style={{ color: accent }}>{f.num}</div>
          <h3 className="text-[12px] font-bold leading-snug sm:text-[13px] lg:text-sm" style={{ color: isDark ? "#F5F1EC" : "#1a1a1a" }}>{f.title}</h3>
          <p className="mx-auto mt-1 max-w-[190px] text-[10.5px] leading-relaxed sm:text-[11px] lg:text-xs" style={{ color: isDark ? "#9C948A" : "#666" }}>{f.desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────
    Responsive cards (phones → tablets, < lg)
    ─────────────────────────────────────── */
function CardsGrid({ isDark, features }: { isDark: boolean; features: DisplayFeature[] }) {
  return (
    <div className="mx-auto max-w-6xl px-4 lg:hidden">
      {/* hub */}
      <div className="relative mb-7 flex h-24 items-center justify-center sm:mb-9 sm:h-28">
        <svg viewBox="0 0 200 110" className="h-full w-36 sm:w-40" fill="none">
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

      {/* responsive grid: 1 col on phones, 2 cols on small tablets/tablets */}
      <div className="relative z-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
        {features.map((f: DisplayFeature, i) => {
          const Ill = illMap[f.ill]!;
          const accent = i % 2 === 0 ? primary : secondary;
          return (
            <div
              key={f.num}
              className="wc-reveal flex items-start gap-3 rounded-2xl border p-3.5 sm:gap-3.5 sm:p-4"
              style={{
                background: isDark ? "rgba(18,18,26,0.82)" : "rgba(255,255,255,0.88)",
                borderColor: `${accent}1a`,
                boxShadow: `0 6px 18px rgba(0,0,0,${isDark ? "0.3" : "0.05"})`,
                ["--wc-delay" as string]: `${0.3 + i * 0.1}s`,
              }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `2px solid ${accent}` }}>
                <div className="h-6 w-6 text-primary sm:h-7 sm:w-7"><Ill /></div>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="mb-0.5 text-[11px] font-extrabold" style={{ color: accent }}>{f.num}</div>
                <h3 className="text-sm font-bold leading-snug sm:text-[15px]" style={{ color: isDark ? "#F5F1EC" : "#1a1a1a" }}>{f.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed sm:text-[13px]" style={{ color: isDark ? "#9C948A" : "#666" }}>{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────
   Background decoration (edges / fill) — fully static
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

  if (src.isActive === false) return null;

  return (
    <section ref={ref} dir="rtl" className={`section-lazy relative w-full overflow-hidden py-12 sm:py-16 lg:py-24${inView ? " wc-in-view" : ""}`}>
      <IllDefs />
      <div className="absolute inset-0" style={{ background: isDark ? "radial-gradient(ellipse at 50% 40%, #15131C 0%, #100E16 45%, #0C0A12 100%)" : "radial-gradient(ellipse at 50% 40%, #FBF6F0 0%, #F6EFE6 45%, #F0E8DC 100%)" }} />
      <div className="pointer-events-none absolute -start-10 top-10 h-72 w-72 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${primary}0c, transparent 70%)` }} />
      <div className="pointer-events-none absolute -end-10 bottom-0 h-72 w-72 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${secondary}0a, transparent 70%)` }} />

      {/* background decoration */}
      <BackgroundDecor isDark={isDark} />

      {/* title */}
      <div className="relative z-30 mx-auto mb-6 max-w-2xl px-4 text-center sm:mb-8">
        <div className="wc-reveal" style={{ ["--wc-delay" as string]: "0s" }}>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold sm:text-sm" style={{ background: isDark ? `linear-gradient(135deg, ${primary}18, ${secondary}10)` : `linear-gradient(135deg, ${primary}12, ${secondary}08)`, color: primary, border: `1px solid ${primary}22` }}>{title}</span>
        </div>
        <p className="wc-reveal mx-auto mt-4 max-w-lg text-sm leading-relaxed sm:text-base" style={{ color: isDark ? "#9C948A" : "#666", ["--wc-delay" as string]: "0.16s" }}>
          {subtitle}
        </p>
      </div>

      {/* desktop orbit */}
      <div className="relative z-10 mx-auto hidden max-w-6xl px-4 lg:block">
        <div className="relative mx-auto aspect-[10/7] w-full">
          <div className="relative h-full w-full">
            <Connectors isDark={isDark} features={features} />
            {features.map((f, i) => (
              <Node key={f.num} f={f} index={i} isDark={isDark} />
            ))}
          </div>
        </div>
      </div>

      {/* phones & tablets (< lg) */}
      <CardsGrid isDark={isDark} features={features} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28" style={{ background: isDark ? "linear-gradient(to top, #0C0A12, transparent)" : "linear-gradient(to top, #F0E8DC, transparent)" }} />
    </section>
  );
}
