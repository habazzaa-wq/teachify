"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import {
  Facebook,
  Youtube,
  Phone,
  Star,
  MessageCircle,
  Gift,
  GraduationCap,
  BookOpen,
  Trophy,
  Users,
  CheckCircle,
  Pencil,
  Lightbulb,
  Atom,
  Brain,
  Zap,
  RefreshCw,
  Clock,
} from "lucide-react";
import { usePublicHero } from "@/features/homepage/hero/hooks";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";

/* ══════════════════════════════════════════════
   DESIGN TOKENS — "The Learning Orbit"
   ══════════════════════════════════════════════ */
const C = {
  orange: "#DD815B",
  gold: "#FFB50E",
  plum: "#2B1B2E",
  cream: "#FFF9F2",
  teal: "#3EC6C6",
  plumLight: "#3D2A40",
};

/* ── Platform features ── */
const FEATURES = [
  { icon: Zap, text: "دروس مباشرة تفاعلية", color: C.teal },
  { icon: RefreshCw, text: "محتوى محدث باستمرار", color: C.orange },
  { icon: Clock, text: "دعم طلابي على مدار الساعة", color: C.gold },
];

/* ── 6 floating icon badges ── */
const ICON_BADGES = [
  { icon: Gift, label: "الهدايا", gradient: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, x: "-18%", y: "10%", size: 52, delay: 0.8 },
  { icon: Facebook, label: "فيس بوك", gradient: "linear-gradient(135deg, #1877F2, #42A5F5)", x: "105%", y: "8%", size: 48, delay: 0.9 },
  { icon: MessageCircle, label: "محادثة", gradient: `linear-gradient(135deg, ${C.teal}, #2BA8A8)`, x: "-22%", y: "55%", size: 46, delay: 1.0 },
  { icon: Youtube, label: "يوتيوب", gradient: "linear-gradient(135deg, #FF0000, #FF4444)", x: "108%", y: "52%", size: 48, delay: 1.1 },
  { icon: Star, label: "أفضل الطلاب", gradient: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, x: "15%", y: "-18%", size: 44, delay: 1.2 },
  { icon: Phone, label: "الهاتف", gradient: `linear-gradient(135deg, ${C.teal}, ${C.gold})`, x: "75%", y: "-15%", size: 44, delay: 1.3 },
];

/* ── Background doodle icons (line art) ── */
const DOODLES = [
  { Icon: BookOpen, x: "8%", y: "18%", size: 28, rotate: -15, delay: 0.5 },
  { Icon: Pencil, x: "88%", y: "15%", size: 24, rotate: 20, delay: 0.8 },
  { Icon: Atom, x: "5%", y: "75%", size: 30, rotate: 10, delay: 1.1 },
  { Icon: Lightbulb, x: "90%", y: "72%", size: 26, rotate: -20, delay: 1.4 },
  { Icon: GraduationCap, x: "15%", y: "45%", size: 22, rotate: 25, delay: 0.7 },
  { Icon: Brain, x: "82%", y: "42%", size: 24, rotate: -12, delay: 1.0 },
  { Icon: Star, x: "50%", y: "5%", size: 18, rotate: 30, delay: 1.3 },
  { Icon: CheckCircle, x: "45%", y: "92%", size: 20, rotate: -8, delay: 0.9 },
];

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════ */

/* ── Headline: bouncy word-by-word reveal ── */
function Headline({ text, show }: { text: string; show: boolean }) {
  const words = text.split(" ");
  return (
    <h1
      className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl"
      style={{ fontFamily: "var(--font-display), 'Cairo', sans-serif" }}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={show ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{
            delay: 0.2 + i * 0.1,
            type: "spring",
            stiffness: 200,
            damping: 12,
          }}
        >
          {w}
          {i < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </h1>
  );
}

/* ── Feature pill ── */
function FeaturePill({
  icon: Icon,
  text,
  color,
  delay,
  show,
}: {
  icon: React.ElementType;
  text: string;
  color: string;
  delay: number;
  show: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, type: "spring", stiffness: 180, damping: 14 }}
      className="flex items-center gap-2.5 rounded-full border px-4 py-2.5 shadow-sm backdrop-blur-sm"
      style={{
        borderColor: `${color}25`,
        backgroundColor: `${color}08`,
      }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <span className="whitespace-nowrap text-sm font-semibold text-foreground">{text}</span>
    </motion.div>
  );
}

/* ── 3D floating icon badge ── */
function IconBadge({
  icon: Icon,
  label,
  gradient,
  x,
  y,
  size,
  delay,
  show,
}: {
  icon: React.ElementType;
  label: string;
  gradient: string;
  x: string;
  y: string;
  size: number;
  delay: number;
  show: boolean;
}) {
  const dur = 4 + (size % 3);
  const iconSize = size * 0.4;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -15 }}
      animate={show ? { opacity: 1, scale: 1, rotate: 0 } : {}}
      transition={{ delay, type: "spring", stiffness: 220, damping: 12 }}
      className="hero-badge absolute z-20"
      style={{
        left: x,
        top: y,
        "--badge-dur": `${dur}s`,
      } as React.CSSProperties}
    >
      <motion.div
        whileHover={{ scale: 1.18, y: -6, rotateZ: 3 }}
        className="group relative cursor-pointer"
      >
        {/* Outer glow on hover */}
        <div
          className="absolute -inset-1 rounded-2xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
          style={{ background: gradient }}
          aria-hidden="true"
        />
        {/* Main badge body */}
        <div
          className="relative flex items-center justify-center rounded-2xl backdrop-blur-sm transition-all duration-300 group-hover:brightness-110"
          style={{
            width: size,
            height: size,
            background: gradient,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.3),
              0 1px 3px rgba(0,0,0,0.2),
              inset 0 1px 1px rgba(255,255,255,0.3),
              inset 0 -1px 2px rgba(0,0,0,0.15)
            `,
          }}
        >
          {/* Inner highlight (top-left shine) */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)",
            }}
            aria-hidden="true"
          />
          {/* Icon */}
          <Icon className="relative z-10 text-white drop-shadow-sm" style={{ width: iconSize, height: iconSize }} />
        </div>
        {/* Tooltip label */}
        <div
          className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9"
          style={{
            backgroundColor: C.plum,
            boxShadow: `0 4px 12px ${C.plum}60`,
          }}
        >
          {label}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Sparkle burst on CTA click ── */
function SparkleBurst({ onDone }: { onDone: () => void }) {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i * 60) + Math.random() * 30 - 15,
    distance: 30 + Math.random() * 20,
    size: 4 + Math.random() * 4,
    color: [C.gold, C.orange, C.teal][i % 3],
  }));

  return (
    <AnimatePresence onExitComplete={onDone}>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        return (
          <motion.span
            key={p.id}
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(rad) * p.distance,
              y: Math.sin(rad) * p.distance,
              opacity: 0,
              scale: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        );
      })}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════
   MAIN HERO SECTION
   ══════════════════════════════════════════════ */
export function HeroSection() {
  const { data: hero } = usePublicHero();
  const { tenant } = useActiveTenant();
  const theme = useUiStore((s) => s.theme);
  const tenantName = tenant?.name ?? "";
  const isDark = theme === "dark";
  const prefersReducedMotion = useReducedMotion();
  const [show, setShow] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  /* Intersection Observer with immediate fallback */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) { setShow(true); obs.disconnect(); }
      },
      { threshold: 0.05, rootMargin: "100px" },
    );
    obs.observe(el);
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight + 100 && r.bottom > 0) {
      setShow(true);
      obs.disconnect();
    }
    return () => obs.disconnect();
  }, []);

  const onSparkleDone = useCallback(() => setSparkle(false), []);

  if (hero && !hero.isActive) return null;

  const title = hero?.title || `رحلة تعليمية ممتعة تبدأ من هنا`;
  const social = hero?.socialLinks;
  const shouldAnimate = show && !prefersReducedMotion;

  /* ── Background colors per theme ── */
  const bgBase = isDark ? C.plum : C.cream;
  const bgGradient = isDark
    ? `radial-gradient(ellipse at 20% 30%, ${C.plumLight} 0%, ${C.plum} 50%, #1a1018 100%)`
    : `radial-gradient(ellipse at 20% 30%, #FFF5EB 0%, ${C.cream} 50%, #FFF0E0 100%)`;

  return (
    <section
      ref={sectionRef}
      className="hero-section relative w-full overflow-hidden"
      dir="rtl"
      style={{ minHeight: 640, background: bgGradient }}
    >
      {/* ── Background gradient orbs ── */}
      <motion.div
        className="pointer-events-none absolute rounded-full blur-[100px]"
        style={{
          width: 500, height: 500, top: "-10%", right: "-5%",
          background: isDark
            ? `radial-gradient(circle, ${C.orange}15, transparent 70%)`
            : `radial-gradient(circle, ${C.orange}12, transparent 70%)`,
        }}
        animate={shouldAnimate ? { scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -10, 0] } : {}}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute rounded-full blur-[100px]"
        style={{
          width: 400, height: 400, bottom: "-5%", left: "-5%",
          background: isDark
            ? `radial-gradient(circle, ${C.teal}10, transparent 70%)`
            : `radial-gradient(circle, ${C.teal}10, transparent 70%)`,
        }}
        animate={shouldAnimate ? { scale: [1.1, 1, 1.1], x: [0, -15, 0] } : {}}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute rounded-full blur-[80px]"
        style={{
          width: 300, height: 300, top: "40%", left: "30%",
          background: isDark
            ? `radial-gradient(circle, ${C.gold}08, transparent 70%)`
            : `radial-gradient(circle, ${C.gold}10, transparent 70%)`,
        }}
        animate={shouldAnimate ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />

      {/* ── Background doodle icons (line art) ── */}
      {DOODLES.map(({ Icon, x, y, size, rotate, delay }, i) => (
        <motion.div
          key={`doodle-${i}`}
          className="pointer-events-none absolute"
          style={{ left: x, top: y }}
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: isDark ? 0.05 : 0.07 } : {}}
          transition={{ delay: delay + 0.3, duration: 0.8 }}
        >
          <motion.div
            animate={shouldAnimate ? { y: [0, -6, 0], rotate: [rotate, rotate + 5, rotate] } : {}}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          >
            <Icon
              style={{
                width: size,
                height: size,
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(43,27,46,0.4)",
                strokeWidth: 1.5,
              }}
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── Content grid ── */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-14 sm:px-8 md:flex-row md:items-center md:gap-12 lg:py-20">

        {/* ── Text column ── */}
        <div className="flex flex-1 flex-col items-center gap-5 text-center md:items-start md:text-right">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{
              backgroundColor: `${C.teal}15`,
              border: `1px solid ${C.teal}30`,
            }}
          >
            <GraduationCap className="h-3.5 w-3.5" style={{ color: C.teal }} />
            <span className="text-xs font-semibold" style={{ color: C.teal }}>
              منصة تعليمية للابتدائي والثانوي
            </span>
          </motion.div>

          {/* Headline */}
          <Headline text={title} show={shouldAnimate} />

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="max-w-md text-base leading-relaxed sm:text-lg"
            style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(43,27,46,0.6)" }}
          >
            {hero?.subtitle || "تعليم متميز يجمع بين الخبرة والابتكار لبناء مستقبل مشرق لطلابنا"}
          </motion.p>

          {/* Features row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={shouldAnimate ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
          >
            {FEATURES.map((f, i) => (
              <FeaturePill
                key={f.text}
                icon={f.icon}
                text={f.text}
                color={f.color}
                delay={0.6 + i * 0.15}
                show={shouldAnimate}
              />
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {/* Primary CTA */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (social?.phone) window.location.href = `tel:${social.phone}`;
                setSparkle(true);
              }}
              className="hero-cta-shine relative overflow-hidden rounded-2xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-shadow hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`,
                boxShadow: `0 4px 20px ${C.orange}40`,
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                ابدأ رحلتك التعليمية
              </span>
              {/* Shimmer sweep */}
              <span className="pointer-events-none absolute inset-0" aria-hidden="true" />
              {/* Sparkle particles */}
              {sparkle && <SparkleBurst onDone={onSparkleDone} />}
            </motion.button>

            {/* Secondary CTA */}
            <motion.a
              href={social?.youtube || "#"}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-2xl border px-7 py-3.5 text-sm font-bold backdrop-blur-sm transition-colors"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.15)" : `${C.plum}20`,
                color: isDark ? "rgba(255,255,255,0.8)" : C.plum,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
              }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: `${C.orange}15` }}
              >
                <Youtube className="h-3 w-3" style={{ color: C.orange }} />
              </div>
              شاهد الكورسات
            </motion.a>
          </motion.div>
        </div>

        {/* ── Photo + badges column ── */}
        <div className="relative flex flex-shrink-0 items-center justify-center py-8">

          {/* ── 3D depth blobs behind photo ── */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 320, height: 320, top: 20, left: -10,
              background: `linear-gradient(135deg, ${C.gold}20, ${C.orange}15)`,
              filter: "blur(30px)",
              borderRadius: "42% 58% 65% 35% / 45% 40% 60% 55%",
            }}
            animate={shouldAnimate ? { rotate: [0, 8, 0], scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 280, height: 280, top: 40, left: 20,
              background: `linear-gradient(135deg, ${C.teal}15, ${C.gold}10)`,
              filter: "blur(25px)",
              borderRadius: "55% 45% 40% 60% / 50% 55% 45% 50%",
            }}
            animate={shouldAnimate ? { rotate: [0, -6, 0], scale: [1.05, 1, 1.05] } : {}}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />

          {/* ── Glow ring ── */}
          <motion.div
            className="absolute"
            style={{
              width: 380, height: 380,
              borderRadius: "42% 58% 65% 35% / 45% 40% 60% 55%",
              border: `2px solid ${C.gold}25`,
            }}
            animate={shouldAnimate
              ? { boxShadow: [`0 0 20px ${C.gold}10`, `0 0 40px ${C.gold}20`, `0 0 20px ${C.gold}10`] }
              : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />

          {/* ── Teacher photo (3D tilt on desktop) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={shouldAnimate ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.9, type: "spring", stiffness: 100, damping: 16 }}
            className="relative"
          >
            <Tilt
              tiltMaxAngleX={12}
              tiltMaxAngleY={12}
              perspective={1000}
              scale={1.02}
              transitionSpeed={400}
              gyroscope={false}
            >
              <div
                className="hero-photo-frame relative h-[280px] w-[280px] overflow-hidden sm:h-[340px] sm:w-[340px]"
                style={{
                  borderRadius: "42% 58% 65% 35% / 45% 40% 60% 55%",
                  boxShadow: `8px 8px 24px rgba(0,0,0,0.2), -4px -4px 12px rgba(255,255,255,0.1) inset`,
                }}
              >
                {hero?.teacherImage ? (
                  <img
                    src={hero.teacherImage}
                    alt={hero?.teacherName || "المعلم"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=600&fit=crop&crop=face"
                    alt="المعلم"
                    className="h-full w-full object-cover"
                  />
                )}
                {/* Gradient overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
              </div>
            </Tilt>
          </motion.div>

          {/* ── 6 Floating icon badges ── */}
          {ICON_BADGES.map((b) => (
            <IconBadge
              key={b.label}
              icon={b.icon}
              label={b.label}
              gradient={b.gradient}
              x={b.x}
              y={b.y}
              size={b.size}
              delay={b.delay}
              show={shouldAnimate}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
