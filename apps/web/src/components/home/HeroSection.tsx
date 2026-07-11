"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CountUp from "react-countup";
import {
  GraduationCap,
  Play,
  BookOpen,
  Trophy,
  Users,
  CheckCircle,
} from "lucide-react";
import { usePublicHero } from "@/features/homepage/hero/hooks";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";

/* ── Stat counters ── */
const STATS = [
  { end: 2500, suffix: "+", label: "طالب", icon: Users },
  { end: 20, suffix: "", label: "سنة خبرة", icon: BookOpen },
  { end: 98, suffix: "%", label: "نسبة نجاح", icon: Trophy },
];

/* ── Sticky notes (icon + label cards floating around photo) ── */
const STICKY_NOTES = [
  { icon: GraduationCap, text: "أفضل الطلاب", rotate: -5, x: "-5%", y: "8%", accent: "success" as const },
  { icon: CheckCircle, text: "٩٨٪ نجاح", rotate: 4, x: "85%", y: "5%", accent: "warning" as const },
  { icon: Trophy, text: "معلم متميز", rotate: -3, x: "-8%", y: "65%", accent: "success" as const },
  { icon: GraduationCap, text: "هدايا تعليمية", rotate: 6, x: "88%", y: "70%", accent: "warning" as const },
];

/* ── Headline: word-by-word staggered reveal ── */
function HeadlineReveal({ text, isVisible }: { text: string; isVisible: boolean }) {
  const words = text.split(" ");
  return (
    <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="hero-chalk-word inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
        >
          {word}
          {i < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </h1>
  );
}

/* ── Single stat counter ── */
function StatCounter({
  end,
  suffix,
  label,
  icon: Icon,
  delay,
  shouldAnimate,
}: {
  end: number;
  suffix: string;
  label: string;
  icon: React.ElementType;
  delay: number;
  shouldAnimate: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-1"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-success" />
        <span className="text-3xl font-black tabular-nums text-foreground">
          <CountUp end={end} duration={2} delay={delay} separator="," enableScrollSpy scrollSpyOnce />
          {suffix}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </motion.div>
  );
}

/* ── Floating sticky note card ── */
function StickyNote({
  icon: Icon,
  text,
  rotate,
  x,
  y,
  delay,
  accent,
  shouldAnimate,
}: {
  icon: React.ElementType;
  text: string;
  rotate: number;
  x: string;
  y: string;
  delay: number;
  accent: "success" | "warning";
  shouldAnimate: boolean;
}) {
  const accentClasses =
    accent === "success"
      ? "border-success/20 bg-success/5 text-success"
      : "border-warning/20 bg-warning/5 text-warning";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 200, damping: 18 }}
      className="hero-sticky-note absolute z-10"
      style={{ left: x, top: y, "--note-rotate": `${rotate}deg` } as React.CSSProperties}
    >
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur-sm ${accentClasses}`}
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap text-xs font-bold">{text}</span>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   Main HeroSection
   ══════════════════════════════════════════════ */
export function HeroSection() {
  const { data: hero, isLoading } = usePublicHero();
  const { tenant } = useActiveTenant();
  const theme = useUiStore((s) => s.theme);
  const tenantName = tenant?.name ?? "";
  const isDark = theme === "dark";
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  /* Intersection Observer — trigger on first 10% visible, or immediately if already in view */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "100px" },
    );
    observer.observe(el);

    /* Fallback: if already in viewport, reveal immediately */
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100 && rect.bottom > 0) {
      setIsVisible(true);
      observer.disconnect();
    }

    return () => observer.disconnect();
  }, []);

  /* Don't render if explicitly disabled (but DO render while loading) */
  if (hero && !hero.isActive) return null;

  const title = hero?.title || `مرحباً بكم في ${tenantName}`;
  const social = hero?.socialLinks;
  const shouldAnimate = isVisible && !prefersReducedMotion;

  return (
    <section
      ref={sectionRef}
      className="hero-section bg-background relative w-full overflow-hidden transition-colors duration-300"
      dir="rtl"
      style={{ minHeight: 560 }}
    >
      {/* ── Notebook ruled-lines texture ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: isDark ? 0.02 : 0.04,
          backgroundImage: isDark
            ? "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.25) 39px, rgba(255,255,255,0.25) 40px)"
            : "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.08) 39px, rgba(0,0,0,0.08) 40px)",
          backgroundSize: "100% 40px",
        }}
        aria-hidden="true"
      />

      {/* ── Subtle accent glow spots ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 80% 50%, hsl(var(--success) / 0.04), transparent 50%), radial-gradient(ellipse at 20% 60%, hsl(var(--warning) / 0.03), transparent 50%)"
            : "radial-gradient(ellipse at 80% 50%, hsl(var(--success) / 0.05), transparent 50%), radial-gradient(ellipse at 20% 60%, hsl(var(--warning) / 0.04), transparent 50%)",
        }}
        aria-hidden="true"
      />

      {/* ── Content: two-column split ── */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 py-12 sm:px-8 md:flex-row md:items-center md:gap-12 lg:py-16">

        {/* ── Text side (right in RTL) ── */}
        <div className="flex flex-1 flex-col items-center gap-6 text-center md:items-start md:text-right">

          {/* Headline */}
          <HeadlineReveal text={title} isVisible={shouldAnimate} />

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {hero?.subtitle || "تعليم متميز يجمع بين الخبرة والابتكار"}
          </motion.p>

          {/* Stat counters row */}
          <div className="flex items-center gap-6 sm:gap-10">
            {STATS.map((stat, i) => (
              <StatCounter
                key={stat.label}
                end={stat.end}
                suffix={stat.suffix}
                label={stat.label}
                icon={stat.icon}
                delay={0.3 + i * 0.2}
                shouldAnimate={shouldAnimate}
              />
            ))}
          </div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="flex flex-wrap items-center gap-3"
          >
            <a
              href={social?.phone ? `tel:${social.phone}` : "#"}
              className="hero-cta-primary group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/30"
            >
              <BookOpen className="h-4 w-4" />
              <span>احجز حصة تجريبية مجانية</span>
              <span className="hero-chalk-dust pointer-events-none absolute inset-0" aria-hidden="true" />
            </a>
            <a
              href={social?.youtube || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta-ghost inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground transition-all duration-300 hover:scale-[1.03] hover:bg-accent"
            >
              <Play className="h-4 w-4" />
              <span>شاهد نبذة تعريفية</span>
            </a>
          </motion.div>
        </div>

        {/* ── Photo side (left in RTL) ── */}
        <div className="relative flex flex-shrink-0 items-center justify-center py-8">
          {/* Glow behind photo */}
          <div
            className="absolute rounded-full blur-3xl"
            style={{
              width: 360,
              height: 360,
              background: isDark
                ? "radial-gradient(circle, hsl(var(--success) / 0.08), transparent 70%)"
                : "radial-gradient(circle, hsl(var(--success) / 0.10), transparent 70%)",
            }}
          />

          {/* Teacher photo with chalk-frame clip-path */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.7, type: "spring", stiffness: 140, damping: 20 }}
            className="relative"
          >
            <div
              className="hero-photo-frame bg-card border-border relative h-[300px] w-[300px] overflow-hidden border sm:h-[360px] sm:w-[360px]"
              style={{
                clipPath:
                  "polygon(8% 0%, 92% 2%, 98% 10%, 100% 88%, 94% 98%, 6% 100%, 0% 92%, 2% 8%)",
              }}
            >
              {hero?.teacherImage ? (
                <img
                  src={hero.teacherImage}
                  alt={hero?.teacherName || "المعلم"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="bg-muted flex h-full w-full items-center justify-center">
                  <GraduationCap className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}

              {/* Chalk-frame border overlay */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  boxShadow: isDark
                    ? "inset 0 0 0 3px hsl(var(--border) / 0.3), inset 0 0 0 6px hsl(var(--success) / 0.08)"
                    : "inset 0 0 0 3px hsl(var(--border) / 0.4), inset 0 0 0 6px hsl(var(--success) / 0.10)",
                }}
              />
            </div>
          </motion.div>

          {/* ── Floating sticky notes ── */}
          {STICKY_NOTES.map((note, i) => (
            <StickyNote
              key={`${note.text}-${i}`}
              icon={note.icon}
              text={note.text}
              rotate={note.rotate}
              x={note.x}
              y={note.y}
              accent={note.accent}
              delay={0.8 + i * 0.15}
              shouldAnimate={shouldAnimate}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
