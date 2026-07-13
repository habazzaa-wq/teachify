"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  Laptop,
  GraduationCap,
  Users,
  UserCheck,
  Rocket,
  BarChart3,
  Headphones,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";

/* ═══════════════════════════════════════════
   Palette — cohesive teal/blue family
   ═══════════════════════════════════════════ */
const PALLETTE = [
  { icon: "#0D9488", ring: "#14B8A6", glow: "#14B8A6" },
  { icon: "#0891B2", ring: "#22D3EE", glow: "#22D3EE" },
  { icon: "#2563EB", ring: "#60A5FA", glow: "#60A5FA" },
  { icon: "#7C3AED", ring: "#A78BFA", glow: "#A78BFA" },
  { icon: "#4F46E5", ring: "#818CF8", glow: "#818CF8" },
  { icon: "#0E7490", ring: "#67E8F9", glow: "#67E8F9" },
];

/* ═══════════════════════════════════════════
   Content
   ═══════════════════════════════════════════ */
const REASONS: {
  num: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  colorIdx: number;
}[] = [
  {
    num: "01",
    title: "شهادة معتمدة عند إتمام الدورة",
    desc: "احصل على شهادة رسمية معتمدة تُثبت إتقانك للمادة",
    icon: GraduationCap,
    colorIdx: 0,
  },
  {
    num: "02",
    title: "مجموعات صغيرة لضمان التفاعل",
    desc: "فصول محدودة العدد تمنح كل طالب اهتمامه الكامل",
    icon: Users,
    colorIdx: 1,
  },
  {
    num: "03",
    title: "جلسات أونلاين وأوفلاين مرنة",
    desc: "اختر الطريقة التي تناسبك لمتابعة الدورات بسهولة",
    icon: UserCheck,
    colorIdx: 2,
  },
  {
    num: "04",
    title: "مشاريع عملية لكل مستوى",
    desc: "تطبيقات واقعية تُثري خبرتك وتهيك لسوق العمل",
    icon: Rocket,
    colorIdx: 3,
  },
  {
    num: "05",
    title: "حساب خاص لكل طالب لمتابعة أدائه",
    desc: "لوحة متابعة شخصية تتابع تقدمك وتحدد نقاط القوة والتحسين",
    icon: BarChart3,
    colorIdx: 4,
  },
  {
    num: "06",
    title: "دعم فني ومتابعة مستمرة",
    desc: "فريق دعم متخصص جاهز للإجابة على استفساراتك على مدار الساعة",
    icon: Headphones,
    colorIdx: 5,
  },
];

/* ═══════════════════════════════════════════
   Timing
   ═══════════════════════════════════════════ */
const HUB_DELAY = 0;
const RING_DELAY = 0.2;
const LINE_BASE = 0.45;
const LINE_STAGGER = 0.07;
const LINE_DUR = 0.35;
const CARD_BASE = 0.75;
const CARD_STAGGER = 0.07;

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */
export function WhyChooseUsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.12 });
  const [hovered, setHovered] = useState<number | null>(null);

  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;

  const animate = reducedMotion ? true : isInView;

  const [bp, setBp] = useState<"lg" | "md" | "sm">("lg");
  const [sectionW, setSectionW] = useState(1200);

  const measure = useCallback(() => {
    const w = window.innerWidth;
    setSectionW(w);
    setBp(w >= 1024 ? "lg" : w >= 768 ? "md" : "sm");
  }, []);

  const measuredRef = useCallback(
    (node: HTMLDivElement | null) => {
      (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
      if (node) {
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(node);
        return () => ro.disconnect();
      }
    },
    [measure],
  );

  /* ── Theme tokens ── */
  const bg = isDark ? "#14161a" : "#F7F8FA";
  const text = isDark ? "#F5F0EB" : "#1E293B";
  const muted = isDark ? "#94A3B8" : "#64748B";
  const cardBg = isDark ? "rgba(30,41,59,0.88)" : "rgba(255,255,255,0.96)";
  const cardBorder = isDark
    ? "rgba(148,163,184,0.10)"
    : "rgba(15,23,42,0.06)";
  const cardShadow = isDark
    ? "0 4px 24px rgba(0,0,0,0.32)"
    : "0 4px 24px rgba(15,23,42,0.06)";
  const cardShadowHover = isDark
    ? "0 16px 48px rgba(0,0,0,0.48)"
    : "0 16px 48px rgba(15,23,42,0.10)";

  /* ── Hub position ── */
  const hubX = sectionW * 0.5;
  const hubY = 70;

  /* ── Card positions (badges in section %) ── */
  const cardPos = useMemo(() => {
    if (bp === "lg") {
      return [
        { l: 24, t: 185, badgeSide: "right" as const },
        { l: 76, t: 185, badgeSide: "left" as const },
        { l: 10, t: 340, badgeSide: "right" as const },
        { l: 90, t: 340, badgeSide: "left" as const },
        { l: 30, t: 490, badgeSide: "right" as const },
        { l: 70, t: 490, badgeSide: "left" as const },
      ];
    }
    if (bp === "md") {
      return [
        { l: 24, t: 155, badgeSide: "right" as const },
        { l: 76, t: 155, badgeSide: "left" as const },
        { l: 12, t: 295, badgeSide: "right" as const },
        { l: 88, t: 295, badgeSide: "left" as const },
        { l: 30, t: 435, badgeSide: "right" as const },
        { l: 70, t: 435, badgeSide: "left" as const },
      ];
    }
    return [];
  }, [bp]);

  /* ── Compute connector lines (hub-center → badge-center) ── */
  const lines = useMemo(() => {
    if (bp === "sm") return [];
    const badgeR = bp === "lg" ? 22 : 18;
    return cardPos.map((pos, i) => {
      const bx = (pos.l / 100) * sectionW;
      const by = (pos.t / 100) * sectionW;
      const angle = Math.atan2(by - hubY, bx - hubX) * (180 / Math.PI);
      const dx = bx - hubX;
      const dy = by - hubY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const len = Math.max(0, dist - badgeR - 50);
      return { angle, len, idx: i };
    });
  }, [bp, cardPos, sectionW, hubX]);

  /* ── Animation helpers ── */
  const ease = [0.25, 0.1, 0.25, 1] as const;
  const hubA = animate
    ? { opacity: 1, scale: 1 }
    : { opacity: 0, scale: 0.6 };
  const hubT = {
    duration: reducedMotion ? 0 : 0.5,
    delay: reducedMotion ? 0 : HUB_DELAY,
    ease,
  };
  const ringA = animate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 };
  const ringT = {
    duration: reducedMotion ? 0 : 0.6,
    delay: reducedMotion ? 0 : RING_DELAY,
    ease,
  };

  return (
    <section
      ref={measuredRef}
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{ background: bg }}
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ═══════════════════════════════════
            Decorative background blobs
            ═══════════════════════════════════ */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full opacity-[0.035]"
            style={{
              background:
                "radial-gradient(circle, #14B8A6 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-24 -left-24 h-[320px] w-[320px] rounded-full opacity-[0.03]"
            style={{
              background:
                "radial-gradient(circle, #60A5FA 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute right-1/4 top-1/3 h-[180px] w-[180px] rounded-full opacity-[0.02]"
            style={{
              background:
                "radial-gradient(circle, #A78BFA 0%, transparent 70%)",
            }}
          />
        </div>

        {/* ═══════════════════════════════════
            Heading
            ═══════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={animate ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{
            duration: reducedMotion ? 0 : 0.55,
            delay: reducedMotion ? 0 : 0.08,
            ease,
          }}
          className="pt-12 text-center sm:pt-16"
        >
          <h2
            className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl"
            style={{ fontFamily: "'Cairo', sans-serif", color: text }}
          >
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "#14B8A6" }}
              />
              لماذا{" "}
              <span style={{ color: "#0D9488" }}>أكاديمية حازم عصام</span>؟
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "#14B8A6" }}
              />
            </span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-lg text-xs leading-relaxed sm:text-sm"
            style={{ color: muted }}
          >
            نمنحك تجربة تعليمية متكاملة تساعدك على التعلم بذكاء وتحقيق نتائج
            ملموسة
          </p>
        </motion.div>

        {/* ═══════════════════════════════════
            DESKTOP + TABLET: Radial layout
            ═══════════════════════════════════ */}
        {bp !== "sm" && (
          <div
            className="relative mx-auto mt-4"
            style={{
              maxWidth: 1100,
              height: bp === "lg" ? 560 : 510,
            }}
          >
            {/* ── SVG overlay: hub + guide ring + connectors ── */}
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              style={{
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: sectionW,
                height: bp === "lg" ? 560 : 510,
              }}
              viewBox={`0 0 ${sectionW} ${bp === "lg" ? 560 : 510}`}
              aria-hidden="true"
            >
              <defs>
                {REASONS.map((r, i) => (
                  <linearGradient
                    key={`lg${i}`}
                    id={`lineGrad${i}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={PALLETTE[r.colorIdx]!.ring} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={PALLETTE[r.colorIdx]!.icon} stopOpacity={0.9} />
                  </linearGradient>
                ))}
                <radialGradient id="hubGlow" cx="50%" cy="42%" r="50%">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
                </radialGradient>
              </defs>

              {/* Guide ring — faint dotted circle */}
              <motion.circle
                cx={hubX}
                cy={hubY}
                r={bp === "lg" ? 115 : 95}
                fill="none"
                stroke={isDark ? "rgba(148,163,184,0.08)" : "rgba(15,23,42,0.06)"}
                strokeWidth={1}
                strokeDasharray="4 6"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={ringA}
                transition={ringT}
                style={{ transformOrigin: `${hubX}px ${hubY}px` }}
              />

              {/* Hub glow */}
              <motion.circle
                cx={hubX}
                cy={hubY}
                r={bp === "lg" ? 62 : 50}
                fill="url(#hubGlow)"
                initial={{ opacity: 0 }}
                animate={animate ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.7,
                  delay: reducedMotion ? 0 : 0.2,
                }}
              />

              {/* Hub — gradient ring */}
              <motion.circle
                cx={hubX}
                cy={hubY}
                r={bp === "lg" ? 38 : 32}
                fill="none"
                stroke="url(#hubRingGrad)"
                strokeWidth={2.5}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={hubA}
                transition={hubT}
                style={{ transformOrigin: `${hubX}px ${hubY}px` }}
              />
              <defs>
                <linearGradient id="hubRingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#14B8A6" />
                  <stop offset="50%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>

              {/* Hub — white fill */}
              <motion.circle
                cx={hubX}
                cy={hubY}
                r={bp === "lg" ? 34 : 28}
                fill={isDark ? "#1E293B" : "#FFFFFF"}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={hubA}
                transition={hubT}
                style={{ transformOrigin: `${hubX}px ${hubY}px` }}
              />

              {/* Hub icon */}
              <motion.g
                initial={{ opacity: 0, scale: 0.4 }}
                animate={hubA}
                transition={hubT}
                style={{ transformOrigin: `${hubX}px ${hubY}px` }}
              >
                <foreignObject
                  x={hubX - 14}
                  y={hubY - 14}
                  width={28}
                  height={28}
                >
                  <Laptop
                    size={28}
                    color="#0D9488"
                    strokeWidth={1.8}
                  />
                </foreignObject>
              </motion.g>

              {/* Connector lines */}
              {lines.map(({ angle, len, idx }) => {
                if (len <= 0) return null;
                const delay = reducedMotion
                  ? 0
                  : LINE_BASE + idx * LINE_STAGGER;
                const dur = reducedMotion ? 0 : LINE_DUR;
                return (
                  <motion.line
                    key={idx}
                    x1={hubX}
                    y1={hubY}
                    x2={hubX + len * Math.cos((angle * Math.PI) / 180)}
                    y2={hubY + len * Math.sin((angle * Math.PI) / 180)}
                    stroke={`url(#lineGrad${idx})`}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                      animate
                        ? { pathLength: 1, opacity: 1 }
                        : { pathLength: 0, opacity: 0 }
                    }
                    transition={{
                      pathLength: {
                        duration: dur,
                        delay,
                        ease,
                      },
                      opacity: {
                        duration: dur * 0.4,
                        delay,
                      },
                    }}
                  />
                );
              })}
            </svg>

            {/* ── Cards ── */}
            {REASONS.map((reason, i) => {
              const pos = cardPos[i]!;
              const isLeft = pos.badgeSide === "left";
              const Icon = reason.icon;
              const c = PALLETTE[reason.colorIdx]!;
              const isHov = hovered === i;

              const cardDelay = reducedMotion
                ? 0
                : CARD_BASE + i * CARD_STAGGER;

              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    [isLeft ? "left" : "right"]: `${pos.l}%`,
                    top: pos.t,
                    width: bp === "lg" ? 220 : 195,
                    zIndex: isHov ? 20 : 10,
                    transform: "translateX(-50%)",
                  }}
                  initial={{ opacity: 0, y: 22 }}
                  animate={
                    animate
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 22 }
                  }
                  transition={{
                    duration: reducedMotion ? 0 : 0.4,
                    delay: cardDelay,
                    ease,
                  }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className="relative cursor-default rounded-2xl transition-all duration-300 ease-out"
                    style={{
                      background: cardBg,
                      border: `1px solid ${isHov ? `${c.icon}30` : cardBorder}`,
                      boxShadow: isHov ? cardShadowHover : cardShadow,
                      backdropFilter: "blur(12px)",
                      padding: bp === "lg" ? "18px 16px 16px" : "14px 12px 12px",
                      transform: isHov ? "translateY(-3px)" : "translateY(0)",
                    }}
                  >
                    {/* Number */}
                    <div
                      className="absolute"
                      style={{
                        [isLeft ? "left" : "right"]: 12,
                        top: 10,
                        direction: "ltr",
                      }}
                    >
                      <span
                        className="text-[10px] font-bold tracking-wider"
                        style={{
                          color: muted,
                          opacity: 0.45,
                          fontFamily:
                        "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
                        }}
                      >
                        {reason.num}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="mb-1 font-bold leading-snug"
                      style={{
                        fontFamily: "'Cairo', sans-serif",
                        color: text,
                        fontSize: bp === "lg" ? "13.5px" : "12.5px",
                        textAlign: isLeft ? "right" : "left",
                      }}
                    >
                      {reason.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="leading-relaxed"
                      style={{
                        color: muted,
                        fontSize: bp === "lg" ? "11.5px" : "10.5px",
                        textAlign: isLeft ? "right" : "left",
                      }}
                    >
                      {reason.desc}
                    </p>

                    {/* Icon badge */}
                    <div
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        [isLeft ? "left" : "right"]: -8,
                        bottom: 14,
                        width: bp === "lg" ? 44 : 36,
                        height: bp === "lg" ? 44 : 36,
                        background: `linear-gradient(135deg, ${c.icon}, ${c.ring})`,
                        boxShadow: isHov
                          ? `0 0 24px ${c.glow}55, 0 4px 16px rgba(0,0,0,0.22)`
                          : `0 4px 14px rgba(0,0,0,0.14)`,
                        transform: isHov ? "scale(1.12)" : "scale(1)",
                        transition:
                          "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
                      }}
                    >
                      <Icon
                        size={bp === "lg" ? 20 : 17}
                        color="#FFFFFF"
                        strokeWidth={1.9}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════
            MOBILE: Vertical stacked list
            ═══════════════════════════════════ */}
        {bp === "sm" && (
          <div className="relative mt-8 space-y-3 pb-6">
            {/* Vertical spine */}
            <div
              className="absolute bottom-6 top-0 w-px"
              style={{
                right: 31,
                background: `linear-gradient(to bottom, ${PALLETTE[0]!.ring}00 0%, ${PALLETTE[0]!.icon}50 5%, ${PALLETTE[5]!.icon}50 95%, ${PALLETTE[5]!.ring}00 100%)`,
              }}
              aria-hidden="true"
            />

            {REASONS.map((reason, i) => {
              const Icon = reason.icon;
              const c = PALLETTE[reason.colorIdx]!;
              const delay = reducedMotion ? 0 : 0.08 + i * 0.055;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={
                    animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }
                  }
                  transition={{
                    duration: reducedMotion ? 0 : 0.32,
                    delay,
                    ease,
                  }}
                  className="relative"
                >
                  {/* Spine dot */}
                  <div
                    className="absolute z-10"
                    style={{
                      right: 27,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c.icon}, ${c.ring})`,
                      boxShadow: `0 0 8px ${c.glow}40`,
                    }}
                  />

                  {/* Card */}
                  <div
                    className="rounded-xl p-4 pr-12"
                    style={{
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      boxShadow: cardShadow,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Inline icon badge */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${c.icon}, ${c.ring})`,
                          boxShadow: `0 3px 12px ${c.glow}28`,
                        }}
                      >
                        <Icon size={18} color="#FFFFFF" strokeWidth={1.9} />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className="mb-0.5 text-sm font-bold leading-snug"
                          style={{
                            fontFamily: "'Cairo', sans-serif",
                            color: text,
                          }}
                        >
                          {reason.title}
                        </h3>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: muted }}
                        >
                          {reason.desc}
                        </p>
                      </div>

                      {/* Number */}
                      <span
                        className="shrink-0 text-[10px] font-bold tracking-wider"
                        style={{
                          color: muted,
                          opacity: 0.4,
                          fontFamily:
                            "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
                        }}
                      >
                        {reason.num}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-12 sm:h-16" />
      </div>
    </section>
  );
}
