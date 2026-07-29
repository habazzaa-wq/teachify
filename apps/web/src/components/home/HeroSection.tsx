"use client";

import { useState } from "react";
import Image from "next/image";
import { LazyMotion, m, domAnimation, AnimatePresence } from "framer-motion";
import {
  Facebook,
  Youtube,
  Phone,
  PhoneCall,
  Star,
  Award,
  Clock,
  MessageCircle,
  Gift,
} from "lucide-react";
import { usePublicHero } from "@/features/homepage/hero/hooks";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const primary = "#D87B63";
const secondary = "#FFB50E";

const mathSymbols = [
  { char: "π", x: "8%", y: "15%", size: 28, rotate: -12, duration: 9, delay: 0 },
  { char: "∫", x: "88%", y: "18%", size: 24, rotate: 8, duration: 11, delay: 1.5 },
  { char: "∑", x: "5%", y: "65%", size: 22, rotate: -5, duration: 10, delay: 0.8 },
  { char: "√", x: "90%", y: "70%", size: 26, rotate: 15, duration: 8, delay: 2 },
  { char: "Δ", x: "15%", y: "85%", size: 20, rotate: -20, duration: 12, delay: 1 },
  { char: "∞", x: "82%", y: "82%", size: 24, rotate: 10, duration: 9.5, delay: 0.5 },
  { char: "x²", x: "3%", y: "40%", size: 18, rotate: -8, duration: 11, delay: 2.5 },
  { char: "÷", x: "93%", y: "42%", size: 20, rotate: 12, duration: 10, delay: 1.8 },
  { char: "θ", x: "12%", y: "30%", size: 16, rotate: -15, duration: 13, delay: 3 },
  { char: "±", x: "85%", y: "55%", size: 18, rotate: 6, duration: 8.5, delay: 0.3 },
];

const orbs = [
  { x: "10%", y: "20%", size: 140, color: primary, opacity: 0.22, duration: 14, delay: 0 },
  { x: "80%", y: "15%", size: 120, color: secondary, opacity: 0.20, duration: 16, delay: 2 },
  { x: "5%", y: "75%", size: 100, color: secondary, opacity: 0.18, duration: 12, delay: 1 },
  { x: "85%", y: "72%", size: 130, color: primary, opacity: 0.20, duration: 15, delay: 3 },
  { x: "45%", y: "88%", size: 90, color: primary, opacity: 0.16, duration: 18, delay: 1.5 },
  { x: "50%", y: "5%", size: 80, color: secondary, opacity: 0.17, duration: 13, delay: 0.5 },
];

const shapes = [
  { x: "18%", y: "12%", size: 14, color: primary, shape: "circle" as const, duration: 15, delay: 0 },
  { x: "78%", y: "25%", size: 12, color: secondary, shape: "diamond" as const, duration: 18, delay: 1 },
  { x: "7%", y: "52%", size: 13, color: primary, shape: "square" as const, duration: 14, delay: 2 },
  { x: "92%", y: "48%", size: 10, color: secondary, shape: "circle" as const, duration: 16, delay: 0.5 },
  { x: "22%", y: "78%", size: 12, color: primary, shape: "diamond" as const, duration: 13, delay: 1.5 },
  { x: "75%", y: "85%", size: 14, color: secondary, shape: "square" as const, duration: 17, delay: 3 },
  { x: "35%", y: "8%", size: 10, color: primary, shape: "circle" as const, duration: 19, delay: 2.5 },
  { x: "65%", y: "90%", size: 12, color: secondary, shape: "diamond" as const, duration: 12, delay: 0.8 },
  { x: "2%", y: "35%", size: 10, color: primary, shape: "square" as const, duration: 14, delay: 1.2 },
  { x: "96%", y: "65%", size: 11, color: secondary, shape: "circle" as const, duration: 16, delay: 2.2 },
];

const dots = [
  { x: "14%", y: "22%", size: 5, color: primary, duration: 6, delay: 0 },
  { x: "86%", y: "20%", size: 6, color: secondary, duration: 7, delay: 1 },
  { x: "10%", y: "58%", size: 5, color: secondary, duration: 5.5, delay: 0.5 },
  { x: "90%", y: "55%", size: 5, color: primary, duration: 6.5, delay: 1.5 },
  { x: "20%", y: "90%", size: 6, color: primary, duration: 7.5, delay: 2 },
  { x: "78%", y: "88%", size: 5, color: secondary, duration: 5, delay: 0.8 },
  { x: "30%", y: "10%", size: 4, color: primary, duration: 8, delay: 3 },
  { x: "70%", y: "12%", size: 5, color: secondary, duration: 6, delay: 2.5 },
  { x: "6%", y: "45%", size: 4, color: primary, duration: 7, delay: 1.2 },
  { x: "94%", y: "38%", size: 5, color: secondary, duration: 5.5, delay: 0.3 },
  { x: "40%", y: "92%", size: 4, color: primary, duration: 6, delay: 1.8 },
  { x: "55%", y: "6%", size: 5, color: secondary, duration: 8, delay: 2.8 },
];

function ShapeElement({ shape, size, color }: { shape: "circle" | "diamond" | "square"; size: number; color: string }) {
  if (shape === "circle") {
    return <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />;
  }
  if (shape === "diamond") {
    return <div style={{ width: size, height: size, backgroundColor: color, transform: "rotate(45deg)" }} />;
  }
  return <div className="rounded-sm" style={{ width: size, height: size, backgroundColor: color }} />;
}

export function HeroSection() {
  const { data: hero } = usePublicHero();
  const { tenant } = useActiveTenant();
  const theme = useUiStore((s) => s.theme);
  const [phoneHovered, setPhoneHovered] = useState(false);
  const tenantName = tenant?.name ?? "";
  const isDark = theme === "dark";

  const title = hero?.title || `مرحباً بكم في ${tenantName}`;
  const social = hero?.socialLinks;
  const icons = hero?.icons;

  const heroImage = hero?.teacherImage || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=800&fit=crop&crop=face";
  const heroName = hero?.teacherName || "المعلم";

  if (hero && !hero.isActive) return null;

  const lightBg =
    "radial-gradient(ellipse at 50% 30%, #FAF8F5 0%, #F7F4EF 40%, #F3EFE8 80%, #EFEAE1 100%)";
  const darkBg =
    "radial-gradient(ellipse at 50% 30%, #121418 0%, #14161a 40%, #16181d 80%, #181a1f 100%)";

  return (
    <LazyMotion features={domAnimation}>
    <section
      className="hero-section relative w-full overflow-hidden"
      dir="rtl"
      style={{ minHeight: 560 }}
    >
      {/* ── Background ── */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ background: isDark ? darkBg : lightBg }}
      />
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: isDark
            ? "radial-gradient(circle at 30% 70%, rgba(216,123,99,0.03) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,181,14,0.02) 0%, transparent 50%)"
            : "radial-gradient(circle at 30% 70%, rgba(216,123,99,0.03) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,181,14,0.03) 0%, transparent 50%)",
        }}
      />

      {/* ── Gradient orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {orbs.map((orb, i) => (
          <div
            key={`orb-${i}`}
            className="hero-bg-orb absolute rounded-full"
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
              opacity: isDark ? orb.opacity * 0.6 : orb.opacity,
              filter: isDark ? "blur(30px)" : "blur(25px)",
              "--orb-duration": `${orb.duration}s`,
              "--orb-delay": `${orb.delay}s`,
              "--orb-opacity": isDark ? orb.opacity * 0.6 : orb.opacity,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Ring outlines ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="hero-bg-orb absolute rounded-full border"
          style={{
            left: "8%", top: "18%", width: 60, height: 60,
            borderColor: isDark ? "rgba(216,123,99,0.10)" : "rgba(216,123,99,0.18)",
            "--orb-duration": "18s", "--orb-delay": "1s",
          } as React.CSSProperties}
        />
        <div
          className="hero-bg-orb absolute rounded-full border"
          style={{
            right: "6%", top: "22%", width: 44, height: 44,
            borderColor: isDark ? "rgba(255,181,14,0.08)" : "rgba(255,181,14,0.16)",
            "--orb-duration": "22s", "--orb-delay": "3s",
          } as React.CSSProperties}
        />
        <div
          className="hero-bg-orb absolute rounded-full border-2"
          style={{
            left: "4%", bottom: "20%", width: 52, height: 52,
            borderColor: isDark ? "rgba(255,181,14,0.08)" : "rgba(255,181,14,0.14)",
            "--orb-duration": "16s", "--orb-delay": "0s",
          } as React.CSSProperties}
        />
        <div
          className="hero-bg-orb absolute rounded-full border"
          style={{
            right: "3%", bottom: "18%", width: 36, height: 36,
            borderColor: isDark ? "rgba(216,123,99,0.08)" : "rgba(216,123,99,0.16)",
            "--orb-duration": "20s", "--orb-delay": "2s",
          } as React.CSSProperties}
        />
        <div
          className="hero-bg-orb absolute rounded-full border border-dashed"
          style={{
            left: "48%", top: "6%", width: 40, height: 40,
            borderColor: isDark ? "rgba(200,170,140,0.06)" : "rgba(160,130,100,0.12)",
            "--orb-duration": "25s", "--orb-delay": "4s",
          } as React.CSSProperties}
        />
        <div
          className="hero-bg-orb absolute rounded-full border border-dashed"
          style={{
            left: "46%", bottom: "8%", width: 48, height: 48,
            borderColor: isDark ? "rgba(200,170,140,0.05)" : "rgba(160,130,100,0.10)",
            "--orb-duration": "28s", "--orb-delay": "1.5s",
          } as React.CSSProperties}
        />
      </div>

      {/* ── Geometric shapes ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {shapes.map((s, i) => (
          <div
            key={`shape-${i}`}
            className="hero-bg-shape absolute"
            style={{
              left: s.x,
              top: s.y,
              opacity: isDark ? 0.18 : 0.35,
              "--shape-duration": `${s.duration}s`,
              "--shape-delay": `${s.delay}s`,
            } as React.CSSProperties}
          >
            <ShapeElement shape={s.shape} size={s.size} color={s.color} />
          </div>
        ))}
      </div>

      {/* ── Math symbols ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {mathSymbols.map((m, i) => (
          <span
            key={`math-${i}`}
            className="hero-bg-math absolute select-none font-bold"
            style={{
              left: m.x,
              top: m.y,
              fontSize: m.size,
              color: isDark ? "rgba(200,170,140,0.15)" : "rgba(140,110,80,0.22)",
              "--math-duration": `${m.duration}s`,
              "--math-delay": `${m.delay}s`,
              "--math-rotate": `${m.rotate}deg`,
              "--math-opacity": isDark ? 0.15 : 0.22,
            } as React.CSSProperties}
          >
            {m.char}
          </span>
        ))}
      </div>

      {/* ── Dots ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {dots.map((d, i) => (
          <div
            key={`dot-${i}`}
            className="hero-bg-dot absolute rounded-full"
            style={{
              left: d.x,
              top: d.y,
              width: d.size,
              height: d.size,
              backgroundColor: d.color,
              opacity: isDark ? 0.18 : 0.35,
              "--dot-duration": `${d.duration}s`,
              "--dot-delay": `${d.delay}s`,
              "--dot-opacity": isDark ? 0.18 : 0.35,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── SVG curved lines ── */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M 0 200 Q 200 100 400 180 T 800 160"
          fill="none"
          stroke={isDark ? "rgba(200,170,140,0.10)" : "rgba(160,130,100,0.28)"}
          strokeWidth="1.5"
          strokeDasharray="8 12"
          className="hero-bg-line"
          style={{ "--line-duration": "20s", "--line-delay": "0s" } as React.CSSProperties}
        />
        <path
          d="M 0 350 Q 300 280 600 340 T 1200 300"
          fill="none"
          stroke={isDark ? "rgba(255,181,14,0.08)" : "rgba(216,123,99,0.22)"}
          strokeWidth="1.2"
          strokeDasharray="6 10"
          className="hero-bg-line"
          style={{ "--line-duration": "25s", "--line-delay": "3s" } as React.CSSProperties}
        />
        <path
          d="M 200 0 Q 150 180 350 280 T 700 500"
          fill="none"
          stroke={isDark ? "rgba(200,170,140,0.06)" : "rgba(160,130,100,0.20)"}
          strokeWidth="1.2"
          strokeDasharray="4 8"
          className="hero-bg-line"
          style={{ "--line-duration": "30s", "--line-delay": "5s" } as React.CSSProperties}
        />
        <path
          d="M 900 0 Q 850 150 750 300 T 600 560"
          fill="none"
          stroke={isDark ? "rgba(255,181,14,0.05)" : "rgba(216,123,99,0.18)"}
          strokeWidth="1.2"
          strokeDasharray="5 9"
          className="hero-bg-line"
          style={{ "--line-duration": "22s", "--line-delay": "2s" } as React.CSSProperties}
        />
      </svg>

      {/* ── Galaxy orbital ellipses ── */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" style={{ overflow: "visible" }}>
        <ellipse
          cx="50%" cy="50%" rx="42%" ry="18%"
          fill="none"
          stroke={isDark ? "rgba(216,123,99,0.08)" : "rgba(216,123,99,0.24)"}
          strokeWidth="1"
          strokeDasharray="6 10"
          className="hero-bg-line"
          style={{ "--line-duration": "40s", "--line-delay": "0s" } as React.CSSProperties}
        />
        <ellipse
          cx="50%" cy="50%" rx="38%" ry="24%"
          fill="none"
          stroke={isDark ? "rgba(255,181,14,0.06)" : "rgba(255,181,14,0.20)"}
          strokeWidth="0.8"
          strokeDasharray="4 8"
          transform="rotate(-20 500 280)"
          className="hero-bg-line"
          style={{ "--line-duration": "50s", "--line-delay": "2s" } as React.CSSProperties}
        />
        <ellipse
          cx="50%" cy="50%" rx="46%" ry="14%"
          fill="none"
          stroke={isDark ? "rgba(200,170,140,0.05)" : "rgba(160,130,100,0.18)"}
          strokeWidth="0.8"
          strokeDasharray="3 7"
          transform="rotate(35 500 280)"
          className="hero-bg-line"
          style={{ "--line-duration": "55s", "--line-delay": "4s" } as React.CSSProperties}
        />
        <ellipse
          cx="50%" cy="50%" rx="34%" ry="28%"
          fill="none"
          stroke={isDark ? "rgba(216,123,99,0.04)" : "rgba(216,123,99,0.16)"}
          strokeWidth="0.7"
          strokeDasharray="5 9"
          transform="rotate(-45 500 280)"
          className="hero-bg-line"
          style={{ "--line-duration": "60s", "--line-delay": "1s" } as React.CSSProperties}
        />
      </svg>

      {/* ── Concentric center rings ── */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        {[240, 300, 380].map((size, i) => (
          <div
            key={`ring-${i}`}
            className="hero-bg-orb absolute rounded-full border"
            style={{
              width: size,
              height: size,
              borderColor: isDark
                ? `rgba(216,123,99,${0.06 - i * 0.01})`
                : `rgba(216,123,99,${0.22 - i * 0.04})`,
              borderWidth: i === 0 ? 1.5 : 1,
              "--orb-duration": `${30 + i * 10}s`,
              "--orb-delay": `${i * 2}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Stars (4-pointed SVG) ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { x: "12%", y: "10%", size: 14, color: primary, dur: 8, del: 0 },
          { x: "85%", y: "8%", size: 12, color: secondary, dur: 9, del: 1.5 },
          { x: "6%", y: "48%", size: 10, color: primary, dur: 7, del: 0.8 },
          { x: "92%", y: "40%", size: 13, color: secondary, dur: 10, del: 2 },
          { x: "18%", y: "82%", size: 11, color: primary, dur: 8.5, del: 1 },
          { x: "80%", y: "78%", size: 14, color: secondary, dur: 7.5, del: 0.5 },
          { x: "30%", y: "5%", size: 9, color: primary, dur: 11, del: 3 },
          { x: "68%", y: "92%", size: 10, color: secondary, dur: 9.5, del: 2.5 },
          { x: "2%", y: "25%", size: 8, color: primary, dur: 12, del: 1.2 },
          { x: "96%", y: "60%", size: 11, color: secondary, dur: 8, del: 0.3 },
          { x: "42%", y: "3%", size: 7, color: primary, dur: 10, del: 3.5 },
          { x: "58%", y: "95%", size: 9, color: secondary, dur: 9, del: 1.8 },
        ].map((s, i) => (
          <div
            key={`star-${i}`}
            className="hero-bg-math absolute"
            style={{
              left: s.x,
              top: s.y,
              opacity: isDark ? 0.18 : 0.32,
              "--math-duration": `${s.dur}s`,
              "--math-delay": `${s.del}s`,
              "--math-rotate": "0deg",
              "--math-opacity": isDark ? 0.18 : 0.32,
            } as React.CSSProperties}
          >
            <svg width={s.size} height={s.size} viewBox="0 0 16 16">
              <path
                d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z"
                fill={s.color}
              />
            </svg>
          </div>
        ))}
      </div>

      {/* ── Spiral galaxy arms (SVG) ── */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M 500 280 Q 450 200 350 150 Q 250 100 150 130 Q 50 160 20 250"
          fill="none"
          stroke={isDark ? "rgba(216,123,99,0.08)" : "rgba(216,123,99,0.26)"}
          strokeWidth="1.5"
          strokeDasharray="4 8"
          className="hero-bg-line"
          style={{ "--line-duration": "35s", "--line-delay": "0s" } as React.CSSProperties}
        />
        <path
          d="M 500 280 Q 550 360 650 410 Q 750 460 850 430 Q 950 400 980 310"
          fill="none"
          stroke={isDark ? "rgba(255,181,14,0.06)" : "rgba(255,181,14,0.22)"}
          strokeWidth="1.2"
          strokeDasharray="3 7"
          className="hero-bg-line"
          style={{ "--line-duration": "38s", "--line-delay": "3s" } as React.CSSProperties}
        />
        <path
          d="M 500 280 Q 400 350 300 400 Q 200 450 100 420 Q 30 395 10 320"
          fill="none"
          stroke={isDark ? "rgba(200,170,140,0.05)" : "rgba(160,130,100,0.20)"}
          strokeWidth="1"
          strokeDasharray="3 6"
          className="hero-bg-line"
          style={{ "--line-duration": "42s", "--line-delay": "5s" } as React.CSSProperties}
        />
        <path
          d="M 500 280 Q 600 200 700 160 Q 800 120 900 150 Q 970 175 990 250"
          fill="none"
          stroke={isDark ? "rgba(255,181,14,0.04)" : "rgba(216,123,99,0.18)"}
          strokeWidth="1"
          strokeDasharray="2 6"
          className="hero-bg-line"
          style={{ "--line-duration": "45s", "--line-delay": "7s" } as React.CSSProperties}
        />
      </svg>

      {/* ── Galaxy dust particles ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { x: "25%", y: "30%", s: 2 }, { x: "72%", y: "28%", s: 2 }, { x: "35%", y: "65%", s: 3 },
          { x: "65%", y: "68%", s: 2 }, { x: "15%", y: "40%", s: 2 }, { x: "82%", y: "45%", s: 3 },
          { x: "40%", y: "15%", s: 2 }, { x: "58%", y: "82%", s: 2 }, { x: "8%", y: "70%", s: 3 },
          { x: "90%", y: "30%", s: 2 }, { x: "28%", y: "88%", s: 2 }, { x: "75%", y: "10%", s: 3 },
          { x: "50%", y: "45%", s: 2 }, { x: "20%", y: "55%", s: 2 }, { x: "78%", y: "55%", s: 2 },
          { x: "45%", y: "75%", s: 2 }, { x: "55%", y: "20%", s: 2 }, { x: "32%", y: "42%", s: 2 },
        ].map((p, i) => (
          <div
            key={`dust-${i}`}
            className="hero-bg-dot absolute rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: p.s,
              height: p.s,
              backgroundColor: i % 3 === 0 ? primary : i % 3 === 1 ? secondary : "#c8a88c",
              opacity: isDark ? 0.20 : 0.38,
              "--dot-duration": `${5 + (i % 5)}s`,
              "--dot-delay": `${(i * 0.4) % 4}s`,
              "--dot-opacity": isDark ? 0.20 : 0.38,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Plus / cross marks ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { x: "20%", y: "15%", size: 10, rotate: 0 },
          { x: "75%", y: "12%", size: 8, rotate: 45 },
          { x: "12%", y: "60%", size: 9, rotate: 20 },
          { x: "88%", y: "58%", size: 10, rotate: -15 },
          { x: "35%", y: "85%", size: 8, rotate: 30 },
          { x: "62%", y: "88%", size: 9, rotate: -10 },
        ].map((p, i) => (
          <div
            key={`plus-${i}`}
            className="hero-bg-shape absolute"
            style={{
              left: p.x,
              top: p.y,
              opacity: isDark ? 0.12 : 0.22,
              transform: `rotate(${p.rotate}deg)`,
              "--shape-duration": `${14 + i * 2}s`,
              "--shape-delay": `${i * 0.7}s`,
            } as React.CSSProperties}
          >
            <svg width={p.size} height={p.size} viewBox="0 0 10 10">
              <line x1="5" y1="0" x2="5" y2="10" stroke={primary} strokeWidth="1.2" />
              <line x1="0" y1="5" x2="10" y2="5" stroke={primary} strokeWidth="1.2" />
            </svg>
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex flex-col items-center px-4 pt-0 pb-6 sm:pb-10">

        {/* ── Floating badge pills ── */}
        {hero?.badge2Text && (
          <m.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="absolute top-3 start-3 z-20 sm:top-4 sm:start-4 lg:top-5 lg:start-6"
          >
            <div
              className={`group flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-xl sm:px-4 sm:py-2.5 sm:text-xs ${
                isDark
                  ? "border-white/10 bg-white/10"
                  : "border-white/50 bg-white/80"
              }`}
              style={{
                boxShadow: isDark
                  ? `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`
                  : `0 8px 32px rgba(255,181,14,0.18), inset 0 1px 0 rgba(255,255,255,0.8)`,
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl sm:h-8 sm:w-8"
                style={{
                  background: `linear-gradient(135deg, ${secondary}, ${secondary}cc)`,
                  boxShadow: `0 4px 12px ${secondary}40`,
                }}
              >
                <Clock className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
              </div>
              <span style={{ color: secondary }}>{hero.badge2Text}</span>
            </div>
          </m.div>
        )}

        {hero?.badge1Text && (
          <m.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="absolute bottom-3 end-3 z-20 sm:bottom-4 sm:end-4 lg:bottom-5 lg:end-6"
          >
            <div
              className={`group flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-xl sm:px-4 sm:py-2.5 sm:text-xs ${
                isDark
                  ? "border-white/10 bg-white/10"
                  : "border-white/50 bg-white/80"
              }`}
              style={{
                boxShadow: isDark
                  ? `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`
                  : `0 8px 32px rgba(216,123,99,0.18), inset 0 1px 0 rgba(255,255,255,0.8)`,
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl sm:h-8 sm:w-8"
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                  boxShadow: `0 4px 12px ${primary}40`,
                }}
              >
                <Award className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
              </div>
              <span style={{ color: primary }}>{hero.badge1Text}</span>
            </div>
          </m.div>
        )}

        {/* ── Title ── */}
        <m.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 max-w-lg text-center text-2xl font-extrabold leading-relaxed sm:text-3xl lg:text-4xl"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          {(() => {
            const fullTitle = title;
            const parts = fullTitle.split(/ في | إلى /);
            if (parts.length >= 2) {
              const separator = fullTitle.includes(" في ") ? " في " : " إلى ";
              return (
                <>
                  <span style={{ color: primary }}>{parts[0] + separator}</span>
                  <br />
                  <span style={{ color: secondary }}>{parts.slice(1).join(separator)}</span>
                </>
              );
            }
            return <span style={{ color: primary }}>{fullTitle}</span>;
          })()}
        </m.h1>

        {/* ── Profile circle wrapper: 340×340 ── */}
        <m.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 180, damping: 20 }}
          className="relative mx-auto h-[340px] w-[340px]"
        >
          {/* Glow behind image */}
          <div
            className="absolute rounded-full blur-3xl"
            style={{
              inset: -40,
              background: `radial-gradient(circle, ${secondary}18, transparent 70%)`,
            }}
          />

          {/* Profile image */}
          <div className="hero-avatar-ring absolute inset-0 overflow-hidden rounded-full border-4 border-orange-400 shadow-2xl">
            <Image
              src={heroImage}
              alt={heroName}
              fill
              priority
              sizes="340px"
              className="object-cover"
            />
          </div>

          {/* ── Desktop orbiting icons ── */}
          <div className="hidden md:block">
          {/* ── Icon 1: الهدايا — 15° ── */}
          {icons?.gifts?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 208px), calc(-50% + 56px))" }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: primary, borderColor: "#F0B8A8" }}>
                <Gift className="h-5 w-5 text-white" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${primary}dd` }}>
                {icons?.gifts?.label || "الهدايا"}
              </span>
            </m.div>
          </div>
          )}

          {/* ── Icon 2: فيس بوك — 45° ── */}
          {icons?.facebook?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 152px), calc(-50% + 152px))" }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex flex-col items-center"
            >
              <a href={social?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: secondary, borderColor: "#FFE0A0" }}>
                  <Facebook className="h-5 w-5 text-white" />
                </div>
                <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${secondary}dd` }}>
                  {icons?.facebook?.label || "فيس بوك"}
                </span>
              </a>
            </m.div>
          </div>
          )}

          {/* ── Icon 3: محادثة مباشرة — 75° ── */}
          {icons?.chat?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 56px), calc(-50% + 208px))" }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: primary, borderColor: "#F0B8A8" }}>
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${primary}dd` }}>
                {icons?.chat?.label || "محادثة مباشرة"}
              </span>
            </m.div>
          </div>
          )}

          {/* ── Icon 4: يوتيوب — 105° ── */}
          {icons?.youtube?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 56px), calc(-50% + 208px))" }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex flex-col items-center"
            >
              <a href={social?.youtube || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: secondary, borderColor: "#FFE0A0" }}>
                  <Youtube className="h-5 w-5 text-white" />
                </div>
                <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${secondary}dd` }}>
                  {icons?.youtube?.label || "يوتيوب"}
                </span>
              </a>
            </m.div>
          </div>
          )}

          {/* ── Icon 5: أفضل الطلاب — 135° ── */}
          {icons?.bestStudents?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 152px), calc(-50% + 152px))" }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: primary, borderColor: "#F0B8A8" }}>
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${primary}dd` }}>
                {icons?.bestStudents?.label || "أفضل الطلاب"}
              </span>
            </m.div>
          </div>
          )}

          {/* ── Icon 6: رقم الهاتف — 165° ── */}
          {icons?.phone?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 208px), calc(-50% + 56px))" }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setPhoneHovered(true)}
              onMouseLeave={() => setPhoneHovered(false)}
            >
              <div className="flex flex-col items-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer"
                  style={{
                    backgroundColor: secondary,
                    borderColor: "#FFE0A0",
                    boxShadow: phoneHovered
                      ? `0 0 20px ${secondary}60, 0 8px 25px rgba(0,0,0,0.3)`
                      : undefined,
                  }}
                >
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <span
                  className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md transition-all duration-300"
                  style={{
                    backgroundColor: phoneHovered ? secondary : `${secondary}dd`,
                  }}
                >
                  {icons?.phone?.label || "رقم الهاتف"}
                </span>
              </div>

              <AnimatePresence>
                {phoneHovered && (
                  <m.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full mt-3 min-w-[220px] overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl"
                    style={{
                      direction: "rtl",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)",
                    }}
                  >
                    <a
                      href={social?.phone ? `tel:${social.phone}` : "#"}
                      className="group flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-gradient-to-l hover:from-amber-50 hover:to-orange-50"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: `${secondary}20` }}
                      >
                        <PhoneCall className="h-5 w-5" style={{ color: secondary }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">اتصل بنا</span>
                        <span className="text-[11px] text-gray-500">دعم فني مباشر</span>
                      </div>
                    </a>

                    <div className="mx-4 h-px bg-gradient-to-l from-transparent via-gray-200 to-transparent" />

                    <a
                      href={social?.whatsapp ? `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, "")}` : social?.phone ? `https://wa.me/${social.phone.replace(/[^0-9]/g, "")}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-gradient-to-l hover:from-green-50 hover:to-emerald-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 transition-transform duration-200 group-hover:scale-110">
                        <WhatsAppIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">محادثة واتساب</span>
                        <span className="text-[11px] text-gray-500">راسلنا على الواتساب</span>
                      </div>
                    </a>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
           </div>
          )}
          </div>
         </m.div>
       </div>

     </section>
    </LazyMotion>
  );
}
