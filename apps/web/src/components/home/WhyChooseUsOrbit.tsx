"use client";

import { type CSSProperties, type FC, type ReactNode } from "react";
import { ArrowLeft, Bell, Check, ClipboardCheck, Play, RefreshCw } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { usePublicWhyChooseUs } from "@/features/homepage/why-choose-us/hooks";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import {
  DEFAULT_WHY_CHOOSE_US,
  type WhyChooseUsIll,
  type WhyChooseUsSettings,
} from "@/features/homepage/why-choose-us/types";

/* ───────────────────────────────────────
   Brand palette — CSS variables so every
   tenant resolves its own primary/secondary.
   ─────────────────────────────────────── */
const PRIMARY = "var(--brand-primary)";
const SECONDARY = "var(--brand-secondary)";

const MOD_STATUS = ["متصل", "مفعّل", "نشط", "محدّث", "جاهز", "منظّم"];

const pad = (n: number) => String(n).padStart(2, "0");

interface DisplayFeature {
  num: string;
  title: string;
  desc: string;
  ill: WhyChooseUsIll;
}

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
   Mastery ring — the section's focal seal.
   A gauge of ticks, two brand arcs and a
   graduation-cap core. Purely iconographic:
   no numbers, no factual claims.
   ─────────────────────────────────────── */
function MasteryRing({ delay = "0.25s" }: { delay?: string }) {
  const ticks = Array.from({ length: 48 });
  return (
    <div className="wcu-pop relative aspect-square w-full select-none" style={{ ["--wcu-d" as string]: delay }} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="h-full w-full" style={{ color: "var(--wcu-muted)" }}>
        {ticks.map((_, i) => {
          const major = i % 6 === 0;
          return (
            <line
              key={i}
              x1="100"
              y1="9"
              x2="100"
              y2={major ? "17" : "13.5"}
              stroke="currentColor"
              strokeWidth={major ? "1.4" : "1"}
              opacity={major ? "0.5" : "0.28"}
              transform={`rotate(${(i * 360) / ticks.length} 100 100)`}
            />
          );
        })}
        <circle cx="100" cy="100" r="87" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="68" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="1 3" />
        <circle
          className="wcu-arc"
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke={PRIMARY}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          style={{ ["--wcu-to" as string]: 38, ["--wcu-d" as string]: "0.4s" }}
          transform="rotate(-90 100 100)"
        />
        <circle
          className="wcu-arc"
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke={SECONDARY}
          strokeWidth="4.5"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          style={{ ["--wcu-to" as string]: 78, ["--wcu-d" as string]: "0.55s" }}
          transform="rotate(-38 100 100)"
        />
        <circle
          className="wcu-anim-fade"
          cx="100"
          cy="14"
          r="4.5"
          fill={PRIMARY}
          style={{ ["--wcu-d" as string]: "0.8s" }}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: PRIMARY, boxShadow: "0 8px 18px rgba(0,0,0,0.18)" }}
        >
          <span className="h-6 w-6">
            <IllCap />
          </span>
        </span>
        <span className="mt-2 text-sm font-extrabold" style={{ color: "var(--wcu-ink)" }}>
          إتقان
        </span>
        <span className="text-[10px] font-semibold" style={{ color: "var(--wcu-muted)" }}>
          مسار الطالب
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────
   Core-panel fragments — small product-UI
   snippets around the ring (decorative).
   ─────────────────────────────────────── */
function Frag({
  className,
  delay,
  children,
}: {
  className: string;
  delay: string;
  children: ReactNode;
}) {
  return (
    <div className={`wcu-anim-fade absolute ${className}`} style={{ ["--wcu-d" as string]: delay }}>
      {children}
    </div>
  );
}

function fragShell(isDark: boolean): CSSProperties {
  return {
    borderColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(90,60,30,0.12)",
    background: isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.72)",
    boxShadow: isDark
      ? "0 10px 26px rgba(0,0,0,0.28)"
      : "0 10px 26px rgba(120,90,60,0.10)",
  };
}

function FragVideo({ isDark, ink, muted }: { isDark: boolean; ink: string; muted: string }) {
  return (
    <Frag className="end-[4%] top-[16%]" delay="0.42s">
      <div className="wcu-frag-card flex items-center gap-2.5 rounded-2xl border px-3 py-2.5" style={fragShell(isDark)}>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: PRIMARY, boxShadow: "0 6px 14px rgba(0,0,0,0.16)" }}
        >
          <Play className="h-4 w-4" style={{ color: "var(--brand-primary-contrast)" }} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="text-[9px] font-bold tracking-[0.14em]" style={{ color: muted }}>
            شرح مرئي
          </div>
          <div className="whitespace-nowrap text-xs font-extrabold" style={{ color: ink }}>
            شروحات الفيديو
          </div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[8px] font-extrabold"
          style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: PRIMARY }}
        >
          جودة عالية
        </span>
      </div>
    </Frag>
  );
}

function FragParents({ isDark, ink, muted }: { isDark: boolean; ink: string; muted: string }) {
  return (
    <Frag className="start-[4%] top-[19%]" delay="0.5s">
      <div className="wcu-frag-card flex items-center gap-2.5 rounded-2xl border px-3 py-2.5" style={fragShell(isDark)}>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: SECONDARY, boxShadow: "0 6px 14px rgba(0,0,0,0.14)" }}
        >
          <Bell className="h-4 w-4" style={{ color: "var(--brand-secondary-contrast)" }} aria-hidden="true" />
        </span>
        <div>
          <div className="text-[9px] font-bold tracking-[0.14em]" style={{ color: muted }}>
            متابعة دائمة
          </div>
          <div className="whitespace-nowrap text-xs font-extrabold" style={{ color: ink }}>
            أولياء الأمور
          </div>
        </div>
        <span className="relative ms-1 flex h-2.5 w-2.5 items-center justify-center">
          <span className="absolute h-2.5 w-2.5 rounded-full border" style={{ borderColor: SECONDARY, opacity: 0.5 }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIMARY }} />
        </span>
      </div>
    </Frag>
  );
}

function FragPractice({ isDark, ink, muted }: { isDark: boolean; ink: string; muted: string }) {
  const items = [
    { label: "تمارين تدريجية", done: true },
    { label: "اختبار قصير", done: true },
    { label: "مراجعة نهائية", done: false },
  ];
  return (
    <Frag className="bottom-[13%] end-[6%]" delay="0.58s">
      <div className="wcu-frag-card w-48 rounded-2xl border px-3 py-2.5" style={fragShell(isDark)}>
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: SECONDARY, boxShadow: "0 5px 12px rgba(0,0,0,0.14)" }}
          >
            <ClipboardCheck className="h-3.5 w-3.5" style={{ color: "var(--brand-secondary-contrast)" }} aria-hidden="true" />
          </span>
          <span className="text-[10px] font-extrabold" style={{ color: ink }}>
            تمارين وتدريب
          </span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {items.map((it) => (
            <li key={it.label} className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: muted }}>
              <span
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[5px] border"
                style={
                  it.done
                    ? { background: PRIMARY, borderColor: PRIMARY }
                    : { borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)" }
                }
              >
                {it.done ? (
                  <Check className="h-2.5 w-2.5" style={{ color: "var(--brand-primary-contrast)" }} aria-hidden="true" />
                ) : null}
              </span>
              {it.label}
            </li>
          ))}
        </ul>
      </div>
    </Frag>
  );
}

function FragUpdate({ isDark, ink, muted }: { isDark: boolean; ink: string; muted: string }) {
  return (
    <Frag className="bottom-[17%] start-[6%]" delay="0.66s">
      <div className="wcu-frag-card flex items-center gap-2.5 rounded-2xl border px-3 py-2.5" style={fragShell(isDark)}>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: PRIMARY, boxShadow: "0 6px 14px rgba(0,0,0,0.16)" }}
        >
          <RefreshCw className="h-4 w-4" style={{ color: "var(--brand-primary-contrast)" }} aria-hidden="true" />
        </span>
        <div>
          <div className="text-[9px] font-bold tracking-[0.14em]" style={{ color: muted }}>
            محتوى متجدد
          </div>
          <div className="whitespace-nowrap text-xs font-extrabold" style={{ color: ink }}>
            تحديث المناهج
          </div>
        </div>
        <span className="flex gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 w-1 rounded-full" style={{ background: SECONDARY }} />
          ))}
        </span>
      </div>
    </Frag>
  );
}

/* ───────────────────────────────────────
   The core ecosystem panel (desktop).
   Decorative — real content lives in the
   features rail, so the panel is aria-hidden.
   ─────────────────────────────────────── */
function CorePanel({ isDark, ink, muted }: { isDark: boolean; ink: string; muted: string }) {
  return (
    <div
      className="wcu-anim-fade relative aspect-[16/11] w-full overflow-hidden rounded-[1.75rem] border"
      style={{
        borderColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(90,60,30,0.12)",
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)",
        boxShadow: isDark
          ? "0 28px 70px rgba(0,0,0,0.28)"
          : "0 28px 70px rgba(120,90,60,0.09)",
        ["--wcu-d" as string]: "0.18s",
      }}
      aria-hidden="true"
    >
      {/* inner dot texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${isDark ? "#fff" : "#000"} 0.5px, transparent 0.5px)`,
          backgroundSize: "22px 22px",
          opacity: isDark ? 0.045 : 0.05,
        }}
      />

      {/* top micro header */}
      <div className="absolute start-[7%] top-[7%] flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: PRIMARY }} />
        <span className="text-[10px] font-extrabold tracking-[0.18em]" style={{ color: ink }}>
          المنظومة
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[8px] font-extrabold"
          style={{ background: SECONDARY, color: "var(--brand-secondary-contrast)" }}
        >
          متصلة
        </span>
      </div>

      {/* connectors */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ color: PRIMARY }}
      >
        <path d="M67 40 Q 75 27 83 16" stroke="currentColor" strokeWidth="1" strokeDasharray="1.7 2.1" fill="none" vectorEffect="non-scaling-stroke" opacity="0.32" />
        <path d="M33 41 Q 25 28 17 17" stroke="currentColor" strokeWidth="1" strokeDasharray="1.7 2.1" fill="none" vectorEffect="non-scaling-stroke" opacity="0.32" />
        <path d="M67 60 Q 75 74 82 86" stroke="currentColor" strokeWidth="1" strokeDasharray="1.7 2.1" fill="none" vectorEffect="non-scaling-stroke" opacity="0.32" />
        <path d="M33 59 Q 25 73 18 86" stroke="currentColor" strokeWidth="1" strokeDasharray="1.7 2.1" fill="none" vectorEffect="non-scaling-stroke" opacity="0.32" />
        <circle cx="83" cy="16" r="1.1" fill="currentColor" opacity="0.6" />
        <circle cx="17" cy="17" r="1.1" fill="currentColor" opacity="0.6" />
        <circle cx="82" cy="86" r="1.1" fill="currentColor" opacity="0.6" />
        <circle cx="18" cy="86" r="1.1" fill="currentColor" opacity="0.6" />
      </svg>

      {/* ring core */}
      <div className="absolute left-1/2 top-1/2 w-[44%] -translate-x-1/2 -translate-y-1/2">
        <MasteryRing delay="0.28s" />
      </div>

      {/* fragments */}
      <FragVideo isDark={isDark} ink={ink} muted={muted} />
      <FragParents isDark={isDark} ink={ink} muted={muted} />
      <FragPractice isDark={isDark} ink={ink} muted={muted} />
      <FragUpdate isDark={isDark} ink={ink} muted={muted} />
    </div>
  );
}

/* ───────────────────────────────────────
   Journey ribbon — the student's path,
   anchored under the composition.
   ─────────────────────────────────────── */
const JOURNEY = [
  { n: "01", label: "تعلّم", sub: "شاهد وافهم" },
  { n: "02", label: "تدرّب", sub: "طبّق وتمرّن" },
  { n: "03", label: "تقدّم", sub: "قِس تحسّنك" },
  { n: "04", label: "إنجاز", sub: "احتفل بنجاحك" },
  { n: "05", label: "مجتمع", sub: "شارك وتواصل" },
];

function JourneyRibbon({ isDark, ink, muted, hairline }: { isDark: boolean; ink: string; muted: string; hairline: string }) {
  return (
    <div className="relative mt-12 sm:mt-16 lg:mt-20">
      <div className="wcu-scroll -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <ol className="relative flex min-w-max items-center sm:min-w-0">
          <span
            className="wcu-ribbon-line absolute inset-x-0 top-[13px] h-px"
            style={{ background: hairline, ["--wcu-d" as string]: "0.3s" }}
            aria-hidden="true"
          />
          {JOURNEY.map((s, i) => (
            <li
              key={s.n}
              className="wcu-anim-fade relative flex min-w-[104px] flex-1 flex-col items-center"
              style={{ ["--wcu-d" as string]: `${0.38 + i * 0.07}s` }}
            >
              <span
                className="relative z-10 flex h-[27px] w-[27px] items-center justify-center rounded-full border-2"
                style={
                  i === 2
                    ? { borderColor: SECONDARY, background: SECONDARY, boxShadow: "0 6px 14px rgba(0,0,0,0.18)" }
                    : { borderColor: hairline, background: isDark ? "#16121c" : "#f7f1e7" }
                }
              >
                {i === 2 ? (
                  <Check className="h-3.5 w-3.5" style={{ color: "var(--brand-secondary-contrast)" }} aria-hidden="true" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: i % 2 === 0 ? PRIMARY : SECONDARY }} />
                )}
              </span>
              <span className="mt-2 text-[10px] font-extrabold tabular-nums" style={{ color: muted }}>
                {s.n}
              </span>
              <span className="mt-0.5 text-sm font-extrabold" style={{ color: ink }}>
                {s.label}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold" style={{ color: muted }}>
                {s.sub}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <span className="h-px w-8" style={{ background: hairline }} aria-hidden="true" />
        <span className="text-[10px] font-extrabold tracking-[0.22em]" style={{ color: muted }}>
          رحلة الطالب
        </span>
        <span className="h-px w-8" style={{ background: hairline }} aria-hidden="true" />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────
   Main — an editorial "learning ecosystem"
   spread: reading side + journey rail on the
   start column, mastery-ring core panel on
   the end column, student-path ribbon below.
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
      className={`section-lazy relative w-full overflow-hidden py-14 sm:py-20 lg:py-24${inView ? " wcu-in-view" : ""}`}
      style={{
        background: isDark
          ? "linear-gradient(170deg, #0e0c14 0%, #16121c 55%, #0e0c14 100%)"
          : "linear-gradient(170deg, #fdfbf7 0%, #f7f1e7 55%, #fdfbf7 100%)",
        ["--wcu-ink" as string]: ink,
        ["--wcu-muted" as string]: muted,
        ["--wcu-hairline" as string]: hairline,
        ["--wcu-chip-bg" as string]: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)",
        ["--wcu-mod-hover" as string]: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.4)",
      }}
    >
      {/* ruled-paper + dot-grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: isDark
            ? `repeating-linear-gradient(to bottom, rgba(255,255,255,0.022) 0, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 30px), radial-gradient(rgba(255,255,255,0.035) 0.6px, transparent 0.6px)`
            : `repeating-linear-gradient(to bottom, rgba(120,80,40,0.03) 0, rgba(120,80,40,0.03) 1px, transparent 1px, transparent 30px), radial-gradient(rgba(120,80,40,0.05) 0.6px, transparent 0.6px)`,
          backgroundSize: "100% 100%, 26px 26px",
        }}
      />

      {/* marginal annotations (desktop only) */}
      <span
        aria-hidden="true"
        className="wcu-anim-fade absolute start-[1.5%] top-[34%] hidden items-center gap-2 lg:flex"
        style={{ writingMode: "vertical-rl", color: muted, ["--wcu-d" as string]: "0.5s" }}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SECONDARY }} />
        <span className="text-[9px] font-extrabold tracking-[0.3em]">منظومة الطالب الكاملة</span>
      </span>
      <span
        aria-hidden="true"
        className="wcu-anim-fade absolute bottom-[16%] end-[1.5%] hidden items-center gap-2 lg:flex"
        style={{ writingMode: "vertical-rl", color: muted, ["--wcu-d" as string]: "0.55s" }}
      >
        <span className="text-[9px] font-extrabold tracking-[0.3em]">تعلّم · تدرّب · تقدّم</span>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: PRIMARY }} />
      </span>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Editorial header spread ── */}
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
          {/* Reading side */}
          <div className="max-w-2xl">
            <div className="wcu-anim-rise flex items-center gap-2.5" style={{ ["--wcu-d" as string]: "0s" }}>
              <span className="h-[3px] w-7 rounded-full" style={{ background: SECONDARY }} />
              <span className="text-xs font-bold tracking-[0.18em]" style={{ color: PRIMARY }}>
                المنظومة المتكاملة
              </span>
              {/* mobile counter chip */}
              <span
                className="ms-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tabular-nums lg:hidden"
                style={{ color: PRIMARY, borderColor: hairline, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)" }}
              >
                {pad(features.length)}
                <span className="font-bold" style={{ color: muted }}>
                  أسباب متكاملة
                </span>
              </span>
            </div>

            <h2
              id="wcu-title"
              className="wcu-anim-rise mt-4 text-3xl font-extrabold leading-[1.3] text-balance sm:text-4xl lg:text-[2.75rem]"
              style={{ color: ink, ["--wcu-d" as string]: "0.06s" }}
            >
              {title}
            </h2>

            <p
              className="wcu-anim-rise mt-6 border-s-2 ps-5 text-sm leading-loose sm:text-base lg:text-lg"
              style={{ color: muted, borderColor: PRIMARY, ["--wcu-d" as string]: "0.12s" }}
            >
              {subtitle}
            </p>

            <div className="wcu-anim-rise mt-8" style={{ ["--wcu-d" as string]: "0.18s" }}>
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

          {/* Counter anchor — real feature count, editorial ledger styling */}
          <div className="wcu-anim-rise hidden lg:block" style={{ ["--wcu-d" as string]: "0.1s" }}>
            <div className="border-s-2 ps-5" style={{ borderColor: PRIMARY }}>
              <span className="block text-5xl font-extrabold leading-none tabular-nums" style={{ color: PRIMARY }}>
                {pad(features.length)}
              </span>
              <span className="mt-2 block text-xs font-bold" style={{ color: ink }}>
                أسباب تختارنا
              </span>
              <span className="mt-1 block max-w-[190px] text-[11px] leading-relaxed" style={{ color: muted }}>
                منظومة واحدة متكاملة تغطي رحلة الطالب كاملة
              </span>
            </div>
          </div>
        </div>

        {/* ── Mobile / tablet ring motif ── */}
        <div
          className="wcu-anim-fade mx-auto mt-10 flex w-fit flex-col items-center gap-3 lg:hidden"
          style={{ ["--wcu-d" as string]: "0.15s" }}
        >
          <div className="w-44 sm:w-52">
            <MasteryRing delay="0.2s" />
          </div>
          <p className="text-[11px] font-bold tracking-wide" style={{ color: muted }}>
            كل ميزة مرتبطة بمسار نجاح الطالب
          </p>
        </div>

        {/* ── Main composition: journey rail + ecosystem panel ── */}
        <div className="mt-10 grid items-center gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-12">
          {/* The reasons as an editorial numbered index */}
          {features.length > 0 ? (
            <div className="wcu-rail relative mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
              <span
                aria-hidden="true"
                className="wcu-spine absolute bottom-0 top-0 start-[6px] w-px sm:start-[7px]"
                style={{
                  background:
                    "linear-gradient(to bottom, color-mix(in srgb, var(--brand-secondary) 45%, transparent), color-mix(in srgb, var(--brand-primary) 45%, transparent))",
                  ["--wcu-d" as string]: "0.15s",
                }}
              />
              <ol className="relative">
                {features.map((f, i) => (
                  <li
                    key={`${f.num}-${i}`}
                    className="wcu-mod wcu-anim-rise relative flex items-start gap-3 py-4 ps-6 sm:gap-4 sm:py-5 sm:ps-8"
                    style={{ ["--wcu-d" as string]: `${0.14 + i * 0.06}s` }}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute start-0 top-[30px] h-px w-5 sm:w-7"
                      style={{ background: hairline }}
                    />
                    <span
                      className="wcu-mod-num mt-0.5 w-7 shrink-0 text-sm font-extrabold tabular-nums sm:text-base"
                      style={{ color: muted }}
                    >
                      {f.num}
                    </span>

                    <span
                      className="wcu-mod-ill flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:h-11 sm:w-11"
                      style={{ borderColor: hairline, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.55)" }}
                    >
                      <span className="h-5 w-5 opacity-90 sm:h-6 sm:w-6">
                        <FeatureIll ill={f.ill} />
                      </span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="wcu-mod-title text-[15px] font-extrabold leading-snug sm:text-base" style={{ color: ink }}>
                          {f.title}
                        </h3>
                        <span
                          className="mt-0.5 hidden shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-extrabold sm:inline-flex"
                          style={{ color: ink, borderColor: hairline, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)" }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: i % 2 === 0 ? PRIMARY : SECONDARY }} />
                          {MOD_STATUS[i % MOD_STATUS.length]}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed sm:text-sm" style={{ color: muted }}>
                        {f.desc}
                      </p>
                      <div className="mt-2.5 flex items-center gap-1" aria-hidden="true">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <span
                            key={s}
                            className="wcu-seg h-[3px] w-6 rounded-full sm:w-8"
                            style={{
                              background: s === 4
                                ? "color-mix(in srgb, var(--brand-secondary) 62%, transparent)"
                                : "color-mix(in srgb, var(--brand-primary) 62%, transparent)",
                              ["--wcu-d" as string]: `${(0.2 + i * 0.06 + s * 0.05).toFixed(2)}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {/* The ecosystem panel (desktop) */}
          <div className="hidden lg:block">
            <CorePanel isDark={isDark} ink={ink} muted={muted} />
          </div>
        </div>

        {/* ── Journey ribbon ── */}
        <JourneyRibbon isDark={isDark} ink={ink} muted={muted} hairline={hairline} />
      </div>
    </section>
  );
}
