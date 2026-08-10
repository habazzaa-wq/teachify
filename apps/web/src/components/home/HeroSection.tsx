"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
  User,
} from "lucide-react";
import { usePublicHero } from "@/features/homepage/hero/hooks";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { toAbsoluteAssetUrl } from "@/lib/url";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PhoneIconWithTooltip({ social, icons }: { social: import("@/features/homepage/hero/types").HeroSocialLinks | undefined; icons: import("@/features/homepage/hero/types").HeroIcons | undefined }) {
  return (
    <div className="absolute z-10" style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 208px), calc(-50% + 56px))" }}>
      <div className="home-enter-pop relative flex flex-col items-center group/phone" style={{ animationDelay: "0.45s" }}>
        <div className="flex flex-col items-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer group-hover/phone:shadow-[0_0_20px_rgba(255,181,14,0.38),0_8px_25px_rgba(0,0,0,0.3)]"
            style={{
              backgroundColor: secondary,
              borderColor: "#FFE0A0",
            }}
          >
            <Phone className="h-5 w-5 text-white" />
          </div>
          <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md transition-all duration-300 group-hover/phone:bg-[#FFB50E]" style={{ backgroundColor: `${secondary}dd` }}>
            {icons?.phone?.label || "رقم الهاتف"}
          </span>
        </div>
        <div
          className="pointer-events-none absolute top-full mt-3 min-w-[220px] overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl opacity-0 invisible translate-y-2 scale-95 transition-all duration-200 ease-out group-hover/phone:pointer-events-auto group-hover/phone:visible group-hover/phone:translate-y-0 group-hover/phone:opacity-100 group-hover/phone:scale-100"
          style={{ direction: "rtl", boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)" }}
        >
          <a href={social?.phone ? `tel:${social.phone}` : "#"} className="group flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-gradient-to-l hover:from-amber-50 hover:to-orange-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: `${secondary}20` }}>
              <PhoneCall className="h-5 w-5" style={{ color: secondary }} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800">اتصل بنا</span>
              <span className="text-[11px] text-gray-500">دعم فني مباشر</span>
            </div>
          </a>
          <div className="mx-4 h-px bg-gradient-to-l from-transparent via-gray-200 to-transparent" />
          <a href={social?.whatsapp ? `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, "")}` : social?.phone ? `https://wa.me/${social.phone.replace(/[^0-9]/g, "")}` : "#"} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-gradient-to-l hover:from-green-50 hover:to-emerald-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 transition-transform duration-200 group-hover:scale-110">
              <WhatsAppIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800">محادثة واتساب</span>
              <span className="text-[11px] text-gray-500">راسلنا على الواتساب</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

const primary = "#D87B63";
const secondary = "#FFB50E";

function ShapeElement({ shape, size, color }: { shape: "circle" | "diamond" | "square"; size: number; color: string }) {
  if (shape === "circle") {
    return <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />;
  }
  if (shape === "diamond") {
    return <div style={{ width: size, height: size, backgroundColor: color, transform: "rotate(45deg)" }} />;
  }
  return <div className="rounded-sm" style={{ width: size, height: size, backgroundColor: color }} />;
}

/* ─────────────────────────────────────────────────────────────────────────
   Background decorations.

   Renders two layers:
   - desktop (hidden md:block): the richer background, but reduced by ~70%
     compared to the previous 95-element version. Only the 4 blurred orbs
     keep a slow continuous animation — everything else is static.
   - mobile (md:hidden): a simplified background with a handful of static
     accents and zero animations.
   ───────────────────────────────────────────────────────────────────────── */
const DESKTOP_ORBS = [
  { x: "10%", y: "20%", size: 140, color: primary, opacity: 0.22, duration: 14, delay: 0 },
  { x: "80%", y: "15%", size: 120, color: secondary, opacity: 0.2, duration: 16, delay: 2 },
  { x: "5%", y: "75%", size: 100, color: secondary, opacity: 0.18, duration: 12, delay: 1 },
  { x: "85%", y: "72%", size: 130, color: primary, opacity: 0.2, duration: 15, delay: 3 },
];

const DESKTOP_SHAPES = [
  { x: "18%", y: "12%", size: 14, color: primary, shape: "circle" as const },
  { x: "78%", y: "25%", size: 12, color: secondary, shape: "diamond" as const },
  { x: "22%", y: "78%", size: 12, color: primary, shape: "diamond" as const },
  { x: "75%", y: "85%", size: 14, color: secondary, shape: "square" as const },
];

const DESKTOP_MATH = [
  { char: "π", x: "8%", y: "15%", size: 28, rotate: -12 },
  { char: "∑", x: "90%", y: "70%", size: 26, rotate: 15 },
  { char: "√", x: "15%", y: "85%", size: 22, rotate: -20 },
  { char: "∞", x: "3%", y: "40%", size: 20, rotate: 10 },
];

const DESKTOP_DOTS = [
  { x: "14%", y: "22%", size: 5, color: primary },
  { x: "86%", y: "20%", size: 6, color: secondary },
  { x: "10%", y: "58%", size: 5, color: secondary },
  { x: "90%", y: "55%", size: 5, color: primary },
  { x: "20%", y: "90%", size: 6, color: primary },
  { x: "78%", y: "88%", size: 5, color: secondary },
];

const DESKTOP_STARS = [
  { x: "12%", y: "10%", size: 14, color: primary },
  { x: "85%", y: "8%", size: 12, color: secondary },
];

const DESKTOP_PLUS = [
  { x: "20%", y: "15%", size: 10, rotate: 0 },
  { x: "62%", y: "88%", size: 9, rotate: -10 },
];

const MOBILE_DECOR = {
  orbs: [
    { x: "-20%", y: "-10%", size: 160, color: primary, opacity: 0.2 },
    { x: "78%", y: "58%", size: 120, color: secondary, opacity: 0.16 },
  ],
  dots: [
    { x: "12%", y: "24%", size: 5, color: primary },
    { x: "86%", y: "18%", size: 6, color: secondary },
    { x: "8%", y: "70%", size: 5, color: secondary },
  ],
  shapes: [
    { x: "78%", y: "25%", size: 10, color: secondary, shape: "diamond" as const },
    { x: "16%", y: "80%", size: 12, color: primary, shape: "circle" as const },
  ],
  math: [{ char: "π", x: "88%", y: "68%", size: 22, rotate: 8 }],
};

function HeroBackground({ isDark }: { isDark: boolean }) {
  return (
    <>
      {/* Desktop — richer background, heavily reduced element count */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block" aria-hidden="true">
        {/* Blurred gradient orbs — the only continuously animated elements */}
        {DESKTOP_ORBS.map((orb, i) => (
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

        {/* Static ring outlines */}
        <div
          className="absolute rounded-full border"
          style={{ left: "8%", top: "18%", width: 60, height: 60, borderColor: isDark ? "rgba(216,123,99,0.10)" : "rgba(216,123,99,0.18)" }}
        />
        <div
          className="absolute rounded-full border border-dashed"
          style={{ left: "46%", bottom: "8%", width: 48, height: 48, borderColor: isDark ? "rgba(200,170,140,0.05)" : "rgba(160,130,100,0.10)" }}
        />

        {/* Static geometric shapes */}
        {DESKTOP_SHAPES.map((s, i) => (
          <div key={`shape-${i}`} className="absolute" style={{ left: s.x, top: s.y, opacity: isDark ? 0.18 : 0.35 }}>
            <ShapeElement shape={s.shape} size={s.size} color={s.color} />
          </div>
        ))}

        {/* Static math symbols */}
        {DESKTOP_MATH.map((m, i) => (
          <span
            key={`math-${i}`}
            className="absolute select-none font-bold"
            style={{
              left: m.x,
              top: m.y,
              fontSize: m.size,
              transform: `rotate(${m.rotate}deg)`,
              color: isDark ? "rgba(200,170,140,0.15)" : "rgba(140,110,80,0.22)",
            }}
          >
            {m.char}
          </span>
        ))}

        {/* Static dots */}
        {DESKTOP_DOTS.map((d, i) => (
          <div
            key={`dot-${i}`}
            className="absolute rounded-full"
            style={{
              left: d.x,
              top: d.y,
              width: d.size,
              height: d.size,
              backgroundColor: d.color,
              opacity: isDark ? 0.18 : 0.35,
            }}
          />
        ))}

        {/* Static curved lines */}
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path
            d="M 0 200 Q 200 100 400 180 T 800 160"
            fill="none"
            stroke={isDark ? "rgba(200,170,140,0.10)" : "rgba(160,130,100,0.28)"}
            strokeWidth="1.5"
            strokeDasharray="8 12"
          />
          <path
            d="M 200 0 Q 150 180 350 280 T 700 500"
            fill="none"
            stroke={isDark ? "rgba(200,170,140,0.06)" : "rgba(160,130,100,0.20)"}
            strokeWidth="1.2"
            strokeDasharray="4 8"
          />
        </svg>

        {/* Static concentric center rings */}
        {[240, 300].map((size, i) => (
          <div
            key={`ring-${i}`}
            className="absolute rounded-full border"
            style={{
              width: size,
              height: size,
              borderColor: isDark
                ? `rgba(216,123,99,${0.06 - i * 0.01})`
                : `rgba(216,123,99,${0.22 - i * 0.04})`,
              borderWidth: i === 0 ? 1.5 : 1,
            }}
          />
        ))}

        {/* Static stars */}
        {DESKTOP_STARS.map((s, i) => (
          <div key={`star-${i}`} className="absolute" style={{ left: s.x, top: s.y, opacity: isDark ? 0.18 : 0.32 }}>
            <svg width={s.size} height={s.size} viewBox="0 0 16 16">
              <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" fill={s.color} />
            </svg>
          </div>
        ))}

        {/* Static plus marks */}
        {DESKTOP_PLUS.map((p, i) => (
          <div key={`plus-${i}`} className="absolute" style={{ left: p.x, top: p.y, opacity: isDark ? 0.12 : 0.22, transform: `rotate(${p.rotate}deg)` }}>
            <svg width={p.size} height={p.size} viewBox="0 0 10 10">
              <line x1="5" y1="0" x2="5" y2="10" stroke={primary} strokeWidth="1.2" />
              <line x1="0" y1="5" x2="10" y2="5" stroke={primary} strokeWidth="1.2" />
            </svg>
          </div>
        ))}
      </div>

      {/* Mobile — simplified background, fully static */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden md:hidden" aria-hidden="true">
        {MOBILE_DECOR.orbs.map((orb, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full"
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
              opacity: isDark ? orb.opacity * 0.6 : orb.opacity,
              filter: isDark ? "blur(30px)" : "blur(25px)",
            }}
          />
        ))}
        {MOBILE_DECOR.dots.map((d, i) => (
          <div
            key={`dot-${i}`}
            className="absolute rounded-full"
            style={{
              left: d.x,
              top: d.y,
              width: d.size,
              height: d.size,
              backgroundColor: d.color,
              opacity: isDark ? 0.18 : 0.35,
            }}
          />
        ))}
        {MOBILE_DECOR.shapes.map((s, i) => (
          <div key={`shape-${i}`} className="absolute" style={{ left: s.x, top: s.y, opacity: isDark ? 0.18 : 0.35 }}>
            <ShapeElement shape={s.shape} size={s.size} color={s.color} />
          </div>
        ))}
        {MOBILE_DECOR.math.map((m, i) => (
          <span
            key={`math-${i}`}
            className="absolute select-none font-bold"
            style={{
              left: m.x,
              top: m.y,
              fontSize: m.size,
              transform: `rotate(${m.rotate}deg)`,
              color: isDark ? "rgba(200,170,140,0.15)" : "rgba(140,110,80,0.22)",
            }}
          >
            {m.char}
          </span>
        ))}
      </div>
    </>
  );
}

export function HeroSection() {
  const { data: hero } = usePublicHero();
  const { tenant } = useActiveTenant();
  const theme = useUiStore((s) => s.theme);
  const tenantName = tenant?.name ?? "";
  const isDark = theme === "dark";

  const sectionRef = useRef<HTMLElement>(null);
  const [heroOffscreen, setHeroOffscreen] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroOffscreen(!(entry?.isIntersecting ?? true)),
      { rootMargin: "200px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const title = hero?.title || `مرحباً بكم في ${tenantName}`;
  const social = hero?.socialLinks;
  const icons = hero?.icons;

  const heroImage = toAbsoluteAssetUrl(hero?.teacherImage);
  const heroName = hero?.teacherName || "المعلم";

  if (hero && !hero.isActive) return null;

  const lightBg =
    "radial-gradient(ellipse at 50% 30%, #FAF8F5 0%, #F7F4EF 40%, #F3EFE8 80%, #EFEAE1 100%)";
  const darkBg =
    "radial-gradient(ellipse at 50% 30%, #121418 0%, #14161a 40%, #16181d 80%, #181a1f 100%)";

  return (
    <section
      ref={sectionRef}
      className={`hero-section relative w-full overflow-hidden${heroOffscreen ? " hero-anim-paused" : ""}`}
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

      <HeroBackground isDark={isDark} />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex flex-col items-center px-4 pt-0 pb-6 sm:pb-10">

        {/* ── Floating badge pills ── */}
        {hero?.badge2Text && (
          <div
            className="home-enter-badge-top absolute top-3 start-3 z-20 sm:top-4 sm:start-4 lg:top-5 lg:start-6"
            style={{ animationDelay: "0.1s" }}
          >
            <div
              className={`glass-touch-solid group flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-xl sm:px-4 sm:py-2.5 sm:text-xs ${
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
          </div>
        )}

        {hero?.badge1Text && (
          <div
            className="home-enter-badge-bottom absolute bottom-3 end-3 z-20 sm:bottom-4 sm:end-4 lg:bottom-5 lg:end-6"
            style={{ animationDelay: "0.2s" }}
          >
            <div
              className={`glass-touch-solid group flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-xl sm:px-4 sm:py-2.5 sm:text-xs ${
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
          </div>
        )}

        {/* ── Title ── */}
        <h1
          className="home-enter-up mb-5 max-w-lg text-center text-2xl font-extrabold leading-relaxed sm:text-3xl lg:text-4xl"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {(() => {
            const fullTitle = title;
            const parts = fullTitle.split(/ في | إلى /);
            if (parts.length >= 2) {
              const separator = fullTitle.includes(" في ") ? " في " : " إلى ";
              const rest = parts.slice(1).join(separator);
              return (
                <>
                  <span style={{ color: primary }}>{parts[0] + separator}</span>
                  {rest && (
                    <>
                      <br />
                      <span style={{ color: secondary }}>{rest}</span>
                    </>
                  )}
                </>
              );
            }
            return <span style={{ color: primary }}>{fullTitle}</span>;
          })()}
        </h1>

        {hero?.subtitle && (
          <p
            className="home-enter-up mb-6 max-w-lg text-center text-2xl font-extrabold leading-relaxed sm:text-3xl lg:text-4xl"
            style={{ color: secondary, fontFamily: "var(--font-sans)", animationDelay: "0.15s" }}
          >
            {hero.subtitle}
          </p>
        )}

        {/* ── Profile circle wrapper: 340×340 ── */}
        <div className="home-enter-pop-soft relative mx-auto h-[340px] w-[340px]" style={{ animationDelay: "0.25s" }}>
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
            {heroImage ? (
              <Image
                src={heroImage}
                alt={heroName}
                fill
                priority
                sizes="340px"
                className="object-cover"
                fetchPriority="high"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/10">
                <User className="h-24 w-24 text-white/25" />
              </div>
            )}
          </div>

          {/* ── Desktop orbiting icons ── */}
          <div className="hidden md:block">
          {/* ── Icon 1: الهدايا — 15° ── */}
          {icons?.gifts?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 208px), calc(-50% + 56px))" }}
          >
            <div
              className="home-enter-pop flex flex-col items-center"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: primary, borderColor: "#F0B8A8" }}>
                <Gift className="h-5 w-5 text-white" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${primary}dd` }}>
                {icons?.gifts?.label || "الهدايا"}
              </span>
            </div>
          </div>
          )}

          {/* ── Icon 2: فيس بوك — 45° ── */}
          {icons?.facebook?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 152px), calc(-50% + 152px))" }}
          >
            <div
              className="home-enter-pop flex flex-col items-center"
              style={{ animationDelay: "0.36s" }}
            >
              <a href={social?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: secondary, borderColor: "#FFE0A0" }}>
                  <Facebook className="h-5 w-5 text-white" />
                </div>
                <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${secondary}dd` }}>
                  {icons?.facebook?.label || "فيس بوك"}
                </span>
              </a>
            </div>
          </div>
          )}

          {/* ── Icon 3: محادثة مباشرة — 75° ── */}
          {icons?.chat?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 56px), calc(-50% + 208px))" }}
          >
            <div
              className="home-enter-pop flex flex-col items-center"
              style={{ animationDelay: "0.42s" }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: primary, borderColor: "#F0B8A8" }}>
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${primary}dd` }}>
                {icons?.chat?.label || "محادثة مباشرة"}
              </span>
            </div>
          </div>
          )}

          {/* ── Icon 4: يوتيوب — 105° ── */}
          {icons?.youtube?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 56px), calc(-50% + 208px))" }}
          >
            <div
              className="home-enter-pop flex flex-col items-center"
              style={{ animationDelay: "0.48s" }}
            >
              <a href={social?.youtube || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: secondary, borderColor: "#FFE0A0" }}>
                  <Youtube className="h-5 w-5 text-white" />
                </div>
                <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${secondary}dd` }}>
                  {icons?.youtube?.label || "يوتيوب"}
                </span>
              </a>
            </div>
          </div>
          )}

          {/* ── Icon 5: أفضل الطلاب — 135° ── */}
          {icons?.bestStudents?.visible !== false && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 152px), calc(-50% + 152px))" }}
          >
            <div
              className="home-enter-pop flex flex-col items-center"
              style={{ animationDelay: "0.54s" }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer" style={{ backgroundColor: primary, borderColor: "#F0B8A8" }}>
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: `${primary}dd` }}>
                {icons?.bestStudents?.label || "أفضل الطلاب"}
              </span>
            </div>
          </div>
          )}

          {/* ── Icon 6: رقم الهاتف — 165° ── */}
          {icons?.phone?.visible !== false && <PhoneIconWithTooltip social={social} icons={icons} />}
          </div>
         </div>
       </div>

     </section>
  );
}
