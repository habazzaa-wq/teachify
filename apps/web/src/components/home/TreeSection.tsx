"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Award, Users, Clock, Briefcase, BarChart3, Headphones } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";

const primary = "#D87B63";
const secondary = "#FFB50E";

const features = [
  {
    icon: Award,
    title: "شهادة معتمدة",
    desc: "احصل على شهادة رسمية عند إتمام كل دورة",
    color: primary,
    bgLight: `${primary}15`,
  },
  {
    icon: Users,
    title: "مجموعات صغيرة",
    desc: "فصول محدودة العدد لضمان تفاعل أفضل",
    color: secondary,
    bgLight: `${secondary}15`,
  },
  {
    icon: Clock,
    title: "جلسات مرونة",
    desc: "اختبر الطريقة التي تناسب جدولك الزمني",
    color: primary,
    bgLight: `${primary}15`,
  },
  {
    icon: Briefcase,
    title: "مشاريع عملية",
    desc: "تطبيقات واقعية تحضّرك لسوق العمل",
    color: secondary,
    bgLight: `${secondary}15`,
  },
  {
    icon: BarChart3,
    title: "متابعة الأداء",
    desc: "لوحة متابعة شخصية لتتبع تقدمك",
    color: primary,
    bgLight: `${primary}15`,
  },
  {
    icon: Headphones,
    title: "دعم مستمر",
    desc: "فريق دعم متخصص جاهز على مدار الساعة",
    color: secondary,
    bgLight: `${secondary}15`,
  },
];

const branches = [
  { d: "M 500 320 C 440 270 320 200 160 140", delay: 0.4 },
  { d: "M 500 320 C 560 270 680 200 840 140", delay: 0.55 },
  { d: "M 500 370 C 380 355 240 350 70 340", delay: 0.7 },
  { d: "M 500 370 C 620 355 760 350 930 340", delay: 0.85 },
  { d: "M 500 420 C 420 450 300 480 140 510", delay: 1.0 },
  { d: "M 500 420 C 580 450 700 480 860 510", delay: 1.15 },
];

const subBranches = [
  { d: "M 420 280 C 380 250 300 230 240 210", delay: 0.6 },
  { d: "M 580 280 C 620 250 700 230 760 210", delay: 0.7 },
  { d: "M 400 360 C 340 370 260 380 200 400", delay: 0.85 },
  { d: "M 600 360 C 660 370 740 380 800 400", delay: 0.95 },
];

const leaves = [
  { cx: 160, cy: 130, r: 4, color: primary, delay: 1.2 },
  { cx: 140, cy: 150, r: 3, color: secondary, delay: 1.3 },
  { cx: 180, cy: 145, r: 3.5, color: primary, delay: 1.25 },
  { cx: 840, cy: 130, r: 4, color: secondary, delay: 1.35 },
  { cx: 860, cy: 150, r: 3, color: primary, delay: 1.4 },
  { cx: 820, cy: 145, r: 3.5, color: secondary, delay: 1.3 },
  { cx: 70, cy: 330, r: 4, color: primary, delay: 1.5 },
  { cx: 50, cy: 350, r: 3, color: secondary, delay: 1.55 },
  { cx: 90, cy: 345, r: 3.5, color: primary, delay: 1.45 },
  { cx: 930, cy: 330, r: 4, color: secondary, delay: 1.6 },
  { cx: 950, cy: 350, r: 3, color: primary, delay: 1.65 },
  { cx: 910, cy: 345, r: 3.5, color: secondary, delay: 1.55 },
  { cx: 140, cy: 500, r: 4, color: primary, delay: 1.7 },
  { cx: 120, cy: 520, r: 3, color: secondary, delay: 1.75 },
  { cx: 160, cy: 515, r: 3.5, color: primary, delay: 1.65 },
  { cx: 860, cy: 500, r: 4, color: secondary, delay: 1.8 },
  { cx: 880, cy: 520, r: 3, color: primary, delay: 1.85 },
  { cx: 840, cy: 515, r: 3.5, color: secondary, delay: 1.75 },
];

const cardPositions = [
  { top: "4%", left: "2%", transform: "translateX(0)" },
  { top: "4%", right: "2%", transform: "translateX(0)" },
  { top: "38%", left: "0%", transform: "translateX(0)" },
  { top: "38%", right: "0%", transform: "translateX(0)" },
  { top: "72%", left: "2%", transform: "translateX(0)" },
  { top: "72%", right: "2%", transform: "translateX(0)" },
];

const mobileCardOrder = [0, 2, 4, 1, 3, 5];

function TreeTrunk({ isDark }: { isDark: boolean }) {
  return (
    <svg
      viewBox="0 0 1000 700"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="trunkGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={isDark ? "#3a2a20" : "#8B6914"} />
          <stop offset="40%" stopColor={isDark ? "#5a3a28" : "#A07828"} />
          <stop offset="100%" stopColor={isDark ? "#7a4a30" : "#B8922E"} />
        </linearGradient>
        <linearGradient id="branchGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={isDark ? "#5a3a28" : "#A07828"} />
          <stop offset="100%" stopColor={isDark ? "#7a4a30" : "#B8922E"} />
        </linearGradient>
        <filter id="trunkGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="leafGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Root system */}
      <motion.path
        d="M 500 620 C 460 640 400 660 320 680"
        fill="none"
        stroke={isDark ? "#4a3020" : "#9A6B18"}
        strokeWidth="8"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 1.2, delay: 0, ease: "easeOut" }}
      />
      <motion.path
        d="M 500 620 C 540 640 600 660 680 680"
        fill="none"
        stroke={isDark ? "#4a3020" : "#9A6B18"}
        strokeWidth="8"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
      />
      <motion.path
        d="M 500 630 C 480 650 450 670 400 690"
        fill="none"
        stroke={isDark ? "#4a3020" : "#9A6B18"}
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
      />
      <motion.path
        d="M 500 630 C 520 650 550 670 600 690"
        fill="none"
        stroke={isDark ? "#4a3020" : "#9A6B18"}
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      />

      {/* Main trunk */}
      <motion.path
        d="M 500 620 C 498 520 496 420 500 320"
        fill="none"
        stroke="url(#trunkGrad)"
        strokeWidth="18"
        strokeLinecap="round"
        filter="url(#trunkGlow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Trunk texture lines */}
      <motion.path
        d="M 494 600 C 493 550 492 480 494 380"
        fill="none"
        stroke={isDark ? "rgba(200,160,100,0.15)" : "rgba(100,70,20,0.12)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: 0.6 }}
      />
      <motion.path
        d="M 506 590 C 507 540 508 470 506 370"
        fill="none"
        stroke={isDark ? "rgba(200,160,100,0.12)" : "rgba(100,70,20,0.10)"}
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: 0.7 }}
      />

      {/* Sub-branches */}
      {subBranches.map((sb, i) => (
        <motion.path
          key={`sub-${i}`}
          d={sb.d}
          fill="none"
          stroke={isDark ? "#5a3a28" : "#A07828"}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 0.8, delay: sb.delay, ease: "easeOut" }}
        />
      ))}

      {/* Main branches */}
      {branches.map((b, i) => (
        <motion.path
          key={`branch-${i}`}
          d={b.d}
          fill="none"
          stroke="url(#branchGrad)"
          strokeWidth={5 - i * 0.3}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.0, delay: b.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      {/* Leaves at branch tips */}
      {leaves.map((l, i) => (
        <motion.circle
          key={`leaf-${i}`}
          cx={l.cx}
          cy={l.cy}
          r={l.r}
          fill={l.color}
          filter="url(#leafGlow)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          transition={{ duration: 0.4, delay: l.delay, type: "spring", stiffness: 300 }}
        />
      ))}

      {/* Glow at trunk base */}
      <motion.ellipse
        cx="500"
        cy="620"
        rx="60"
        ry="15"
        fill={primary}
        initial={{ opacity: 0 }}
        animate={{ opacity: isDark ? 0.15 : 0.25 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </svg>
  );
}

function FloatingLeaves({ isDark }: { isDark: boolean }) {
  const leafParticles = [
    { x: "15%", y: "20%", size: 6, color: primary, duration: 7, delay: 1.5 },
    { x: "85%", y: "18%", size: 5, color: secondary, duration: 8, delay: 2 },
    { x: "10%", y: "50%", size: 4, color: primary, duration: 6, delay: 1.8 },
    { x: "90%", y: "48%", size: 5, color: secondary, duration: 7.5, delay: 2.2 },
    { x: "20%", y: "75%", size: 4, color: primary, duration: 6.5, delay: 2.5 },
    { x: "80%", y: "72%", size: 5, color: secondary, duration: 8.5, delay: 1.7 },
    { x: "35%", y: "12%", size: 3, color: primary, duration: 9, delay: 3 },
    { x: "65%", y: "85%", size: 3, color: secondary, duration: 7, delay: 2.8 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {leafParticles.map((p, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, isDark ? 0.3 : 0.5, isDark ? 0.3 : 0.5, 0],
            y: [0, -20, -35, -50],
            x: [0, i % 2 === 0 ? 10 : -10, i % 2 === 0 ? -5 : 5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function FeatureCard({
  feature,
  index,
  isInView,
}: {
  feature: (typeof features)[number];
  index: number;
  isInView: boolean;
}) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: 1.0 + index * 0.12,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className="group relative"
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5"
        style={{
          boxShadow: `0 8px 32px ${feature.color}15, 0 2px 8px rgba(0,0,0,0.06)`,
        }}
      >
        <div
          className="absolute -top-8 -end-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-35"
          style={{ backgroundColor: feature.color }}
        />

        <div className="relative flex items-start gap-3.5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${feature.color}, ${feature.color}cc)`,
              boxShadow: `0 4px 14px ${feature.color}30`,
            }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 sm:text-base">{feature.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">{feature.desc}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TreeSection() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-10 sm:py-16 lg:py-20"
      dir="rtl"
    >
      {/* Background */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 50% 40%, #121418 0%, #14161a 40%, #16181d 80%, #181a1f 100%)"
            : "radial-gradient(ellipse at 50% 40%, #FAF8F5 0%, #F7F4EF 40%, #F3EFE8 80%, #EFEAE1 100%)",
        }}
      />

      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: isDark
            ? "radial-gradient(circle at 30% 60%, rgba(216,123,99,0.04) 0%, transparent 50%), radial-gradient(circle at 70% 40%, rgba(255,181,14,0.03) 0%, transparent 50%)"
            : "radial-gradient(circle at 30% 60%, rgba(216,123,99,0.05) 0%, transparent 50%), radial-gradient(circle at 70% 40%, rgba(255,181,14,0.04) 0%, transparent 50%)",
        }}
      />

      <FloatingLeaves isDark={isDark} />

      {/* Section title */}
      <div className="relative z-10 mx-auto mb-8 max-w-2xl px-4 text-center sm:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold sm:text-sm"
            style={{
              backgroundColor: `${primary}1a`,
              color: primary,
            }}
          >
            لماذا تختارنا؟
          </span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
        >
          <span style={{ color: primary }}>أكاديمية </span>
          <span style={{ color: secondary }}>تعليمية متكاملة</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base"
        >
          نمنحك تجربة تعليمية متكاملة تساعدك على التعلم بذكاء وتحقيق نتائج ملموسة
        </motion.p>
      </div>

      {/* Tree visualization with cards */}
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Desktop: Tree + Cards layout */}
        <div className="relative hidden min-h-[580px] lg:block">
          <TreeTrunk isDark={isDark} />

          {/* Feature cards positioned at branch endpoints */}
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="absolute w-[220px] xl:w-[250px]"
              style={cardPositions[i]}
            >
              <FeatureCard feature={feature} index={i} isInView={isInView} />
            </div>
          ))}
        </div>

        {/* Mobile/Tablet: Stacked layout */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:hidden">
          {mobileCardOrder.map((originalIndex) => {
            const feature = features[originalIndex];
            return (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={originalIndex}
                isInView={isInView}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-40 w-[600px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(ellipse, ${primary}12, transparent 70%)`,
        }}
      />
    </section>
  );
}
