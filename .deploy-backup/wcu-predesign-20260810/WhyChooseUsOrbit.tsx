"use client";

import { type FC } from "react";
import { ArrowLeft } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { usePublicWhyChooseUs } from "@/features/homepage/why-choose-us/hooks";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import {
  DEFAULT_WHY_CHOOSE_US,
  type WhyChooseUsIll,
  type WhyChooseUsSettings,
} from "@/features/homepage/why-choose-us/types";

/* ───────────────────────────────────────
   Brand palette
   ─────────────────────────────────────── */
const PRIMARY = "var(--brand-primary)";
const SECONDARY = "var(--brand-secondary)";

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
   Feature illustrations — flat brand fills,
   resolved through CSS variables so every
   tenant sees its own colors.
   ─────────────────────────────────────── */
function IllCap() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
      <path d="M32 14 L54 22 L32 30 L10 22 Z" fill={PRIMARY} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 22 L10 27 L54 27 L54 22" fill={PRIMARY} opacity="0.85" />
      <circle cx="32" cy="14" r="2.4" fill="#fff" />
      <path d="M32 14 L32 34" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M32 34 C38 40, 46 40, 50 34" stroke={SECONDARY} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M50 34 l3 3 l-3 3 l-3 -3 z" fill={SECONDARY} />
      <path d="M46 9 l1.4 3 l3 1.4 l-3 1.4 l-1.4 3 l-1.4 -3 l-3 -1.4 l3 -1.4 z" fill={SECONDARY} opacity="0.9" />
    </svg>
  );
}
function IllVideo() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
      <rect x="9" y="14" width="46" height="36" rx="7" fill={PRIMARY} stroke="#fff" strokeWidth="1.4" />
      <rect x="13" y="18" width="38" height="28" rx="4" fill="#fff" opacity="0.18" />
      <circle cx="32" cy="32" r="10" fill="#fff" opacity="0.92" />
      <path d="M28 27 L39 32 L28 37 Z" fill={SECONDARY} />
      <circle cx="50" cy="13" r="2.2" fill={SECONDARY} />
    </svg>
  );
}
function IllTarget() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
      <circle cx="32" cy="32" r="20" stroke={PRIMARY} strokeWidth="3" />
      <circle cx="32" cy="32" r="12.5" stroke={SECONDARY} strokeWidth="3" opacity="0.85" />
      <circle cx="32" cy="32" r="5.5" fill={PRIMARY} />
      <path d="M25 32 l4.6 4.6 L40 26" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M50 12 l1 2.2 l2.2 1 l-2.2 1 l-1 2.2 l-1 -2.2 l-2.2 -1 l2.2 -1 z" fill={SECONDARY} opacity="0.9" />
    </svg>
  );
}
function IllChat() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
      <path d="M12 14 h33 a6 6 0 0 1 6 6 v19 a6 6 0 0 1 -6 6 H26 l-9 8 V45 a6 6 0 0 1 -5 -6 V20 a6 6 0 0 1 6 -6 z" fill={PRIMARY} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M21 24 c0 -3 4 -4 7 -2 c3 2 7 1 7 4 c0 4 -4 5 -7 3 c-3 -2 -7 -1 -7 -5 z" fill="#fff" opacity="0.95" />
      <path d="M30 30 c-1.6 -1.4 -1.2 -3.6 0.6 -4.4 c1.8 -0.8 3.8 0.4 4 2 c0.2 1.4 -0.8 2.6 -2 2.4" stroke={SECONDARY} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function IllTrend() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
      <path d="M12 46 L24 38 L33 43 L52 22" stroke={PRIMARY} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M52 22 L43 22 L52 31 Z" fill={SECONDARY} />
      <rect x="11" y="48" width="6" height="4" rx="1.5" fill={PRIMARY} opacity="0.7" />
      <rect x="22" y="42" width="6" height="10" rx="1.5" fill={PRIMARY} opacity="0.55" />
      <rect x="31" y="46" width="6" height="6" rx="1.5" fill={PRIMARY} opacity="0.7" />
    </svg>
  );
}
function IllWallet() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
      <rect x="9" y="22" width="46" height="30" rx="8" fill={PRIMARY} stroke="#fff" strokeWidth="1.4" />
      <path d="M9 30 a8 8 0 0 1 8 -8 h29 v28 H17 a8 8 0 0 1 -8 -8 z" fill="#fff" opacity="0.16" />
      <circle cx="44" cy="37" r="7" fill="#fff" />
      <text x="44" y="41" textAnchor="middle" fontSize="9" fontWeight="700" fill={SECONDARY}>$</text>
    </svg>
  );
}

const illMap: Record<WhyChooseUsIll, FC> = {
  cap: IllCap,
  video: IllVideo,
  target: IllTarget,
  chat: IllChat,
  trend: IllTrend,
  wallet: IllWallet,
};

function FeatureIll({ ill }: { ill: WhyChooseUsIll }) {
  const Ill = illMap[ill];
  return Ill ? <Ill /> : null;
}

/* ───────────────────────────────────────
   The "؟" editorial seal — the section is
   answering the question "why?", so a single
   oversized question mark is stamped like an
   editor's/teacher's mark. Purely typographic
   (real Arabic glyph in the tenant font),
   brand-primary outline, rotated slightly so
   it reads hand-placed.
   ─────────────────────────────────────── */
function QuestionSeal({ sizeClass, qsize, isDark }: { sizeClass: string; qsize: string; isDark: boolean }) {
  return (
    <div
      className={`wcu-seal relative select-none ${sizeClass}`}
      style={{ ["--wc-delay" as string]: "0.18s" }}
      aria-hidden="true"
    >
      <div className="relative h-full w-full" style={{ transform: "rotate(-4deg)" }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.62)" }}
        />
        <div className="absolute inset-[1.5%] rounded-full border" style={{ borderColor: PRIMARY, opacity: 0.4 }} />
        <div className="absolute inset-[11%] rounded-full border border-dashed" style={{ borderColor: PRIMARY, opacity: 0.45 }} />
        <div className="absolute inset-[21%] rounded-full border" style={{ borderColor: SECONDARY, opacity: 0.35 }} />
        <span className="absolute inset-0 flex items-center justify-center pb-[5%]">
          <span
            style={{
              fontSize: qsize,
              lineHeight: 1,
              fontWeight: 800,
              color: "transparent",
              WebkitTextStroke: `1.5px ${PRIMARY}`,
            }}
          >
            ؟
          </span>
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────
   Main — an editorial "manifesto" spread:
   headline block + lead on the reading side,
   the "؟" seal bleeding off the opposite side,
   then the reasons as a numbered index.
   ─────────────────────────────────────── */
export function WhyChooseUsOrbit({ settings }: { settings?: WhyChooseUsSettings }) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const { ref, inView } = useInViewOnce<HTMLElement>({ rootMargin: "0px 0px -40px 0px" });

  const { data } = usePublicWhyChooseUs();
  const src = settings ?? data ?? DEFAULT_WHY_CHOOSE_US;

  const title = src.title?.trim() || "لماذا تختارنا؟";
  const subtitle = src.subtitle?.trim() || DEFAULT_WHY_CHOOSE_US.subtitle;
  const features = buildFeatures(src);

  if (src.isActive === false) return null;

  const ink = isDark ? "#F2EDE6" : "#211B14";
  const muted = isDark ? "#A79E92" : "#6E665C";
  const hairline = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";

  return (
    <section
      ref={ref}
      dir="rtl"
      aria-labelledby="wcu-title"
      className={`section-lazy relative w-full overflow-hidden py-14 sm:py-20 lg:py-28${inView ? " wc-in-view" : ""}`}
      style={{
        background: isDark
          ? "linear-gradient(170deg, #0e0c14 0%, #16121c 55%, #0e0c14 100%)"
          : "linear-gradient(170deg, #fdfbf7 0%, #f7f1e7 55%, #fdfbf7 100%)",
        ["--wcu-muted" as string]: muted,
        ["--wcu-hairline" as string]: hairline,
        ["--wcu-chip-bg" as string]: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)",
      }}
    >
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Editorial header spread ── */}
        <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-8 lg:gap-12">
          {/* Reading side */}
          <div className="max-w-xl md:max-w-none">
            {/* Mobile seal — a compact stamp above the kicker */}
            <div className="mb-7 md:hidden">
              <QuestionSeal sizeClass="h-16 w-16" qsize="1.9rem" isDark={isDark} />
            </div>

            <div className="wc-reveal" style={{ ["--wc-delay" as string]: "0s" }}>
              <span className="inline-flex items-center gap-2.5">
                <span className="h-[3px] w-7 rounded-full" style={{ background: SECONDARY }} />
                <span className="text-xs font-bold tracking-[0.18em]" style={{ color: PRIMARY }}>
                  مميزات المنظومة
                </span>
              </span>
            </div>

            <h2
              id="wcu-title"
              className="wc-reveal mt-4 text-3xl font-extrabold leading-[1.3] text-balance sm:text-4xl lg:text-[2.75rem]"
              style={{ color: ink, ["--wc-delay" as string]: "0.06s" }}
            >
              {title}
            </h2>

            <p
              className="wc-reveal mt-6 border-s-2 ps-5 text-sm leading-loose sm:text-base lg:text-lg"
              style={{ color: muted, borderColor: PRIMARY, ["--wc-delay" as string]: "0.12s" }}
            >
              {subtitle}
            </p>

            <div className="wc-reveal mt-8" style={{ ["--wc-delay" as string]: "0.18s" }}>
              <a
                href="#educational-stages"
                className="group inline-flex items-center gap-2.5 rounded-full py-1.5 pe-1.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
                style={{ color: PRIMARY }}
              >
                استكشف المراحل
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--brand-primary-contrast)] transition-transform duration-300 group-hover:scale-110"
                  style={{ background: PRIMARY, boxShadow: "0 6px 16px rgba(0,0,0,0.16)" }}
                >
                  <ArrowLeft
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                  />
                </span>
              </a>
            </div>
          </div>

          {/* Visual anchor side — the seal bleeds off the end edge */}
          <div className="hidden justify-self-end md:block md:-me-4 lg:-me-8">
            <QuestionSeal sizeClass="w-[min(20rem,36vw)] aspect-square" qsize="7rem" isDark={isDark} />
          </div>
        </div>

        {/* ── The reasons as a numbered editorial index ── */}
        {features.length > 0 ? (
          <ol className="mt-12 border-t sm:mt-16 lg:mt-20" style={{ borderColor: hairline }}>
            {features.map((f, i) => (
              <li
                key={`${f.num}-${i}`}
                className="wcu-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 border-b py-5 sm:gap-x-6 sm:py-6"
                style={{ borderColor: hairline }}
              >
                <span
                  className="wcu-num wc-reveal text-sm font-extrabold tabular-nums sm:text-base"
                  style={{ ["--wc-delay" as string]: `${0.08 + i * 0.05}s` }}
                >
                  {f.num}
                </span>

                <div className="wc-reveal min-w-0" style={{ ["--wc-delay" as string]: `${0.12 + i * 0.05}s` }}>
                  <h3
                    className="wcu-title text-base font-bold leading-snug sm:text-lg"
                    style={{ color: ink }}
                  >
                    {f.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed sm:text-sm" style={{ color: muted }}>
                    {f.desc}
                  </p>
                </div>

                <span
                  className="wcu-chip wc-reveal flex h-9 w-9 items-center justify-center rounded-xl border sm:h-11 sm:w-11"
                  style={{ ["--wc-delay" as string]: `${0.16 + i * 0.05}s` }}
                >
                  <span className="h-5 w-5 opacity-80 transition-opacity duration-300 sm:h-6 sm:w-6">
                    <FeatureIll ill={f.ill} />
                  </span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      {/* Bottom fade to blend into the next section */}
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
