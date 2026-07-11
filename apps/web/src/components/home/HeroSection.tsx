"use client";

import { motion } from "framer-motion";
import {
  Facebook,
  Youtube,
  Phone,
  Star,
  MessageCircle,
  Gift,
  Pencil,
  Lightbulb,
  HelpCircle,
  Globe,
  GraduationCap,
} from "lucide-react";
import { usePublicHero } from "@/features/homepage/hero/hooks";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";

const primary = "#D87B63";
const secondary = "#FFB50E";

const watermarkLetters = [
  { char: "ص", x: "5%", y: "12%", size: 72, rotate: -15 },
  { char: "ب", x: "88%", y: "8%", size: 64, rotate: 12 },
  { char: "س", x: "10%", y: "75%", size: 56, rotate: -8 },
  { char: "ق", x: "82%", y: "80%", size: 68, rotate: 20 },
  { char: "خ", x: "3%", y: "45%", size: 52, rotate: -25 },
  { char: "ل", x: "92%", y: "50%", size: 60, rotate: 18 },
];

const doodleIcons = [
  { Icon: Pencil, x: "15%", y: "20%", size: 20, rotate: -20 },
  { Icon: Lightbulb, x: "80%", y: "22%", size: 18, rotate: 15 },
  { Icon: HelpCircle, x: "12%", y: "82%", size: 16, rotate: 10 },
  { Icon: Globe, x: "85%", y: "78%", size: 18, rotate: -12 },
  { Icon: GraduationCap, x: "20%", y: "55%", size: 16, rotate: 25 },
  { Icon: Pencil, x: "78%", y: "60%", size: 14, rotate: -30 },
];

export function HeroSection() {
  const { data: hero } = usePublicHero();
  const { tenant } = useActiveTenant();
  const theme = useUiStore((s) => s.theme);
  const tenantName = tenant?.name ?? "";
  const isDark = theme === "dark";

  if (!hero?.isActive) return null;

  const title = hero.title || `مرحباً بكم في ${tenantName}`;
  const social = hero.socialLinks;

  const lightBg =
    "radial-gradient(ellipse at 50% 30%, #FFFCF8 0%, #FFF8F0 30%, #FFF3E8 60%, #FFEDD9 100%)";
  const darkBg =
    "radial-gradient(ellipse at 50% 30%, #1a1412 0%, #1c1513 35%, #1e1714 70%, #201916 100%)";

  return (
    <section
      className="hero-section relative w-full overflow-hidden"
      dir="rtl"
      style={{ minHeight: 560 }}
    >
      {/* ── Background ── */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: isDark ? darkBg : lightBg,
        }}
      />
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: isDark
            ? "radial-gradient(circle at 30% 70%, rgba(216,123,99,0.04) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,181,14,0.03) 0%, transparent 50%)"
            : "radial-gradient(circle at 30% 70%, rgba(216,123,99,0.04) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,181,14,0.04) 0%, transparent 50%)",
        }}
      />

      {/* ── Watermark letters ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {watermarkLetters.map((item, i) => (
          <span
            key={`wm-${i}`}
            className="hero-deco-icon absolute select-none font-extrabold"
            style={{
              left: item.x,
              top: item.y,
              fontSize: item.size,
              color: isDark ? "rgba(200,170,140,0.05)" : "rgba(180,150,120,0.04)",
              transform: `rotate(${item.rotate}deg)`,
              fontFamily: "'Cairo', sans-serif",
              "--hero-delay": `${i * 0.8}s`,
              "--hero-duration": `${7 + i}s`,
            } as React.CSSProperties}
          >
            {item.char}
          </span>
        ))}
      </div>

      {/* ── Doodle icons ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {doodleIcons.map(({ Icon, x, y, size, rotate }, i) => (
          <div
            key={`doodle-${i}`}
            className="hero-deco-icon absolute"
            style={{
              left: x,
              top: y,
              "--hero-delay": `${i * 1.2}s`,
              "--hero-duration": `${8 + i}s`,
            } as React.CSSProperties}
          >
            <Icon
              style={{
                width: size,
                height: size,
                color: isDark ? "rgba(200,170,140,0.06)" : "rgba(180,150,120,0.05)",
                transform: `rotate(${rotate}deg)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex flex-col items-center px-4 pt-6 pb-10 sm:pt-8 sm:pb-14">

        {/* ── Floating badge pills ── */}
        {hero.badge1Text && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute top-5 end-4 z-20 sm:top-6 sm:end-10 lg:end-20"
          >
            <div
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-lg backdrop-blur-sm sm:px-4 sm:py-2 sm:text-xs ${
                isDark
                  ? "border-white/10 bg-white/10"
                  : "border-white/60 bg-white/85"
              }`}
              style={{
                color: primary,
                boxShadow: isDark
                  ? `0 4px 20px rgba(0,0,0,0.3)`
                  : `0 4px 20px rgba(216,123,99,0.15)`,
              }}
            >
              {hero.badge1Text}
            </div>
          </motion.div>
        )}

        {hero.badge2Text && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="absolute top-5 start-4 z-20 sm:top-6 sm:start-10 lg:start-20"
          >
            <div
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-lg backdrop-blur-sm sm:px-4 sm:py-2 sm:text-xs ${
                isDark
                  ? "border-white/10 bg-white/10"
                  : "border-white/60 bg-white/85"
              }`}
              style={{
                color: primary,
                boxShadow: isDark
                  ? `0 4px 20px rgba(0,0,0,0.3)`
                  : `0 4px 20px rgba(255,181,14,0.15)`,
              }}
            >
              {hero.badge2Text}
            </div>
          </motion.div>
        )}

        {/* ── Title ── */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 max-w-lg text-center text-lg font-extrabold leading-snug sm:text-xl lg:text-2xl"
          style={{
            color: primary,
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {title}
        </motion.h1>

        {/* ── Profile circle wrapper: 380×380 ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.6, type: "spring", stiffness: 180, damping: 20 }}
          className="relative mx-auto h-[380px] w-[380px]"
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
            {hero.teacherImage ? (
              <img
                src={hero.teacherImage}
                alt={hero.teacherName || "المعلم"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${primary}15, ${secondary}15)`,
                }}
              >
                <GraduationCap className="h-24 w-24" style={{ color: `${primary}40` }} />
              </div>
            )}
          </div>

          {/* ── Icon 1: الهدايا — top-left ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 18 }}
            className="absolute -left-7 top-[28%] z-10 flex flex-col items-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: primary }}>
              <Gift className="h-6 w-6 text-white" />
            </div>
            <span className="mt-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white shadow-md" style={{ backgroundColor: `${primary}dd` }}>
              الهدايا
            </span>
          </motion.div>

          {/* ── Icon 2: فيس بوك — top-right ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.58, type: "spring", stiffness: 300, damping: 18 }}
            className="absolute -right-7 top-[28%] z-10 flex flex-col items-center"
          >
            <a href={social?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: secondary }}>
                <Facebook className="h-6 w-6 text-white" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white shadow-md" style={{ backgroundColor: `${secondary}dd` }}>
                فيس بوك
              </span>
            </a>
          </motion.div>

          {/* ── Icon 3: محادثة مباشرة — left, lower ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.66, type: "spring", stiffness: 300, damping: 18 }}
            className="absolute -left-9 top-[60%] z-10 flex flex-col items-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: secondary }}>
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="mt-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white shadow-md" style={{ backgroundColor: `${secondary}dd` }}>
              محادثة مباشرة
            </span>
          </motion.div>

          {/* ── Icon 4: يوتيوب — right, lower ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.74, type: "spring", stiffness: 300, damping: 18 }}
            className="absolute -right-9 top-[60%] z-10 flex flex-col items-center"
          >
            <a href={social?.youtube || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: secondary }}>
                <Youtube className="h-6 w-6 text-white" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white shadow-md" style={{ backgroundColor: `${secondary}dd` }}>
                يوتيوب
              </span>
            </a>
          </motion.div>

          {/* ── Icon 5: أفضل الطلاب — bottom-left ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.82, type: "spring", stiffness: 300, damping: 18 }}
            className="absolute left-[22%] -bottom-10 z-10 flex flex-col items-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: primary }}>
              <Star className="h-6 w-6 text-white" />
            </div>
            <span className="mt-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white shadow-md" style={{ backgroundColor: `${primary}dd` }}>
              أفضل الطلاب
            </span>
          </motion.div>

          {/* ── Icon 6: رقم الهاتف — bottom-right ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 300, damping: 18 }}
            className="absolute right-[22%] -bottom-10 z-10 flex flex-col items-center"
          >
            <a href={social?.phone ? `tel:${social.phone}` : "#"} className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: secondary }}>
                <Phone className="h-6 w-6 text-white" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white shadow-md" style={{ backgroundColor: `${secondary}dd` }}>
                رقم الهاتف
              </span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
