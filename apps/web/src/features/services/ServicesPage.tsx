"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpDown,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  CircleHelp,
  GraduationCap,
  Lightbulb,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Target,
  Users,
  X,
} from "lucide-react";
import { api } from "@/services/api/axios";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { formatNumber } from "@/lib/format";

type Service = {
  id: number;
  title: string;
  image_url: string | null;
  summary: string | null;
  description: string | null;
  highlights: string[] | null;
  contact_name: string | null;
  contact_phone: string;
  instructor_tenant_user_id: number | null;
  is_published: boolean;
};

type SortMode = "default" | "title" | "highlights";

interface Palette {
  page: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  borderStrong: string;
  shadow: string;
  hero: string;
  heroFade: string;
  heroGlowPrimary: string;
  heroGlowSecondary: string;
}

function usePalette(): Palette {
  const theme = useUiStore((state) => state.theme);
  const isDark = theme === "dark";

  return useMemo(
    () => ({
      page: isDark ? "#0b0a10" : "#f6f2ea",
      surface: isDark ? "#16141e" : "#ffffff",
      surfaceAlt: isDark
        ? "rgba(255,255,255,0.04)"
        : "rgba(255,255,255,0.76)",
      text: isDark ? "#F0ECE6" : "#1a1510",
      muted: isDark ? "#8a8290" : "#7a7168",
      subtle: isDark ? "#55505c" : "#b3a99c",
      border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
      borderStrong: isDark
        ? "rgba(255,255,255,0.12)"
        : "rgba(0,0,0,0.10)",
      shadow: isDark
        ? "0 24px 60px rgba(0,0,0,0.35)"
        : "0 24px 60px rgba(120,90,60,0.10)",
      hero: isDark
        ? "linear-gradient(170deg, #0e0c14 0%, #171320 55%, #0e0c14 100%)"
        : "linear-gradient(170deg, #faf6ef 0%, #f3e8dc 55%, #faf6ef 100%)",
      heroFade: isDark
        ? "linear-gradient(to top, #0b0a10, transparent)"
        : "linear-gradient(to top, #f6f2ea, transparent)",
      heroGlowPrimary: isDark
        ? "rgba(216,123,99,0.18)"
        : "rgba(216,123,99,0.16)",
      heroGlowSecondary: isDark
        ? "rgba(255,181,14,0.12)"
        : "rgba(255,181,14,0.20)",
    }),
    [isDark],
  );
}

function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  return `https://wa.me/${digits}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "TM";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold"
      style={{
        background: "var(--brand-primary)",
        color: "var(--brand-primary-contrast)",
        boxShadow: "0 10px 24px -14px var(--brand-primary)",
      }}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function Hero({
  tenantName,
  stats,
  loading,
  p,
}: {
  tenantName: string;
  stats: { services: number; features: number; experts: number };
  loading: boolean;
  p: Palette;
}) {
  const statItems = [
    { icon: BriefcaseBusiness, value: stats.services, label: "خدمة متاحة", color: "var(--brand-primary)" },
    { icon: Star, value: stats.features, label: "ميزة واضحة", color: "var(--brand-secondary)" },
    { icon: Users, value: stats.experts, label: "خبير ومسؤول", color: "#22C55E" },
  ];

  return (
    <section dir="rtl" className="relative w-full overflow-hidden" style={{ background: p.hero }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(${p.text} 0.8px, transparent 0.8px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="pointer-events-none absolute -start-40 top-10 h-[420px] w-[420px] rounded-full blur-[130px]"
        style={{ background: p.heroGlowPrimary }}
      />
      <div
        className="pointer-events-none absolute -end-32 bottom-0 h-[360px] w-[360px] rounded-full blur-[120px]"
        style={{ background: p.heroGlowSecondary }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pb-20 lg:pt-12">
        <motion.nav
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          aria-label="مسار التصفح"
          className="mb-8 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm"
        >
          <Link href="/" className="transition-opacity hover:opacity-75" style={{ color: p.muted }}>
            الرئيسية
          </Link>
          <ChevronLeft className="h-3.5 w-3.5" style={{ color: p.subtle }} />
          <span className="font-bold" style={{ color: p.text }}>الخدمات</span>
        </motion.nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:gap-14">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <SectionLabel>خدمات تعليمية مخصصة</SectionLabel>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: p.text }}
            >
              خدماتنا
              <span style={{ color: "var(--brand-primary)" }}>.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 max-w-2xl text-sm leading-8 sm:text-base"
              style={{ color: p.muted }}
            >
              {tenantName
                ? `اكتشف الخدمات التعليمية التي يقدمها ${tenantName}، وتواصل مباشرة مع مقدم الخدمة المناسب لاحتياجك.`
                : "اكتشف خدماتنا التعليمية المصممة لمساعدتك على التقدم، وتواصل مباشرة مع مقدم الخدمة المناسب لك."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              {statItems.map(({ icon: Icon, value, label, color }) => (
                <div
                  key={label}
                  className="flex min-w-[136px] items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: p.surfaceAlt,
                    border: `1px solid ${p.border}`,
                    boxShadow: p.shadow,
                  }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-lg font-extrabold tabular-nums" style={{ color: p.text }}>
                      {loading ? "…" : formatNumber(value)}
                    </p>
                    <p className="text-[11px] font-medium" style={{ color: p.muted }}>{label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="relative mx-auto w-full max-w-lg"
          >
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-[2rem]"
              style={{ border: `1px solid ${p.border}` }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 25% 15%, ${p.heroGlowPrimary}, transparent 55%), radial-gradient(circle at 85% 85%, ${p.heroGlowSecondary}, transparent 50%)`,
                }}
              />
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: `radial-gradient(${p.text} 0.8px, transparent 0.8px)`,
                  backgroundSize: "20px 20px",
                }}
              />

              <div
                className="absolute inset-x-6 inset-y-6 rounded-[1.6rem] p-5 backdrop-blur-xl sm:inset-x-8 sm:p-6"
                style={{
                  background: p.surfaceAlt,
                  border: `1px solid ${p.borderStrong}`,
                  boxShadow: p.shadow,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-extrabold" style={{ color: p.text }}>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
                    >
                      <GraduationCap className="h-4 w-4" />
                    </span>
                    باقة الخدمات
                  </span>
                  <span className="flex gap-1.5">
                    <i className="h-2 w-2 rounded-full" style={{ background: "var(--brand-secondary)" }} />
                    <i className="h-2 w-2 rounded-full" style={{ background: p.borderStrong }} />
                    <i className="h-2 w-2 rounded-full" style={{ background: p.borderStrong }} />
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    { icon: Target, label: "استشارات مخصصة", color: "var(--brand-primary)" },
                    { icon: Lightbulb, label: "جلسات تطويرية", color: "var(--brand-secondary)" },
                    { icon: MessageCircle, label: "متابعة مباشرة", color: "#22C55E" },
                  ].map(({ icon: Icon, label, color }, index) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.25 + index * 0.08 }}
                      className="flex items-center gap-3 rounded-2xl px-3.5 py-3"
                      style={{ background: p.surface, border: `1px solid ${p.border}` }}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-xs font-bold" style={{ color: p.text }}>{label}</span>
                      <span className="h-1.5 w-14 rounded-full" style={{ background: p.border }} />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div
                className="pointer-events-none absolute -end-3 -top-4 h-40 w-40 rounded-full border"
                style={{ borderColor: "var(--brand-secondary)" }}
              />
              <div
                className="pointer-events-none absolute -bottom-8 -start-8 h-44 w-44 rounded-full border"
                style={{ borderColor: "var(--brand-primary)" }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="absolute -bottom-5 -start-3 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg sm:-start-6"
              style={{ background: p.surface, border: `1px solid ${p.border}` }}
            >
              <BadgeCheck className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              <div className="leading-tight">
                <p className="text-[11px] font-extrabold" style={{ color: p.text }}>تواصل مباشر</p>
                <p className="text-[10px]" style={{ color: p.muted }}>بدون خطوات معقدة</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12" style={{ background: p.heroFade }} />
    </section>
  );
}

function ServiceCard({
  service,
  index,
  p,
  onOpen,
}: {
  service: Service;
  index: number;
  p: Palette;
  onOpen: (service: Service) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const highlights = service.highlights ?? [];
  const hasImage = Boolean(service.image_url) && !imageFailed;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -6 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem]"
      style={{ background: p.surface, border: `1px solid ${p.border}`, boxShadow: p.shadow }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-80 transition-opacity group-hover:opacity-100"
        style={{ background: "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))" }}
      />

      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.image_url!}
            alt={service.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${p.heroGlowPrimary}, transparent 60%), radial-gradient(circle at 80% 80%, ${p.heroGlowSecondary}, transparent 55%)`,
            }}
          >
            <span
              className="flex h-20 w-20 items-center justify-center rounded-3xl backdrop-blur-md"
              style={{ background: p.surfaceAlt, border: `1px solid ${p.borderStrong}`, color: "var(--brand-primary)" }}
            >
              <BriefcaseBusiness className="h-9 w-9" />
            </span>
          </div>
        )}

        <span
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-extrabold tabular-nums backdrop-blur-md"
          style={{ background: p.surfaceAlt, color: p.text, border: `1px solid ${p.border}` }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: `linear-gradient(to top, ${p.surface}, transparent)` }} />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="text-lg font-extrabold leading-snug" style={{ color: p.text }}>{service.title}</h2>

        {service.summary && (
          <p className="mt-2 line-clamp-2 text-sm leading-7" style={{ color: p.muted }}>
            {service.summary}
          </p>
        )}

        {highlights.length > 0 && (
          <ul className="mt-4 space-y-2">
            {highlights.slice(0, 3).map((highlight, i) => (
              <li key={`${service.id}-${i}`} className="flex items-start gap-2 text-xs leading-6" style={{ color: p.text }}>
                <span
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "color-mix(in srgb, var(--brand-primary) 14%, transparent)", color: "var(--brand-primary)" }}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="line-clamp-1">{highlight}</span>
              </li>
            ))}
            {highlights.length > 3 && (
              <li className="pe-6 text-[11px] font-semibold" style={{ color: "var(--brand-primary)" }}>
                و {formatNumber(highlights.length - 3)} ميزة أخرى
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto pt-5">
          <div
            className="mb-4 flex items-center gap-3 rounded-2xl px-3 py-2.5"
            style={{ background: p.surfaceAlt, border: `1px solid ${p.border}` }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold"
              style={{ background: "color-mix(in srgb, var(--brand-secondary) 22%, transparent)", color: p.text }}
            >
              {initials(service.contact_name ?? "فريق الخدمات")}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-xs font-bold" style={{ color: p.text }}>
                {service.contact_name || "فريق الخدمات"}
              </span>
              <span className="block truncate text-[10px]" style={{ color: p.muted }} dir="ltr">
                {service.contact_phone}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpen(service)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-transform hover:scale-[1.02]"
              style={{ background: p.surface, color: p.text, border: `1px solid ${p.borderStrong}` }}
            >
              عرض التفاصيل
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <a
              href={whatsappLink(service.contact_phone)}
              target="_blank"
              rel="noreferrer"
              aria-label={`تواصل واتساب بخصوص ${service.title}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform hover:scale-105"
              style={{ background: "#25D366", boxShadow: "0 8px 20px -10px #25D366" }}
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ServiceDialog({
  service,
  p,
  onClose,
}: {
  service: Service;
  p: Palette;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const highlights = service.highlights ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-dialog-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem]"
        style={{ background: p.surface, border: `1px solid ${p.borderStrong}`, boxShadow: p.shadow }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق التفاصيل"
          className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition hover:scale-105"
          style={{ background: p.surfaceAlt, color: p.text, border: `1px solid ${p.border}` }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative h-56 overflow-hidden sm:h-64">
          {service.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={service.image_url} alt={service.title} className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${p.heroGlowPrimary}, ${p.heroGlowSecondary})` }}
            >
              <BriefcaseBusiness className="h-16 w-16" style={{ color: "var(--brand-primary)" }} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: `linear-gradient(to top, ${p.surface}, transparent)` }} />
        </div>

        <div className="relative -mt-8 px-5 pb-6 sm:px-8 sm:pb-8">
          <SectionLabel>تفاصيل الخدمة</SectionLabel>
          <h2 id="service-dialog-title" className="mt-4 text-2xl font-extrabold" style={{ color: p.text }}>
            {service.title}
          </h2>

          {service.summary && (
            <p className="mt-3 text-sm leading-8" style={{ color: p.muted }}>{service.summary}</p>
          )}
          {service.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-8" style={{ color: p.text }}>
              {service.description}
            </p>
          )}

          {highlights.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-extrabold" style={{ color: p.text }}>ما الذي ستحصل عليه؟</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {highlights.map((highlight, i) => (
                  <div
                    key={`${service.id}-detail-${i}`}
                    className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-6"
                    style={{ background: p.surfaceAlt, border: `1px solid ${p.border}`, color: p.text }}
                  >
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand-primary)" }} />
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="mt-6 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: p.surfaceAlt, border: `1px solid ${p.border}` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold"
                style={{ background: "color-mix(in srgb, var(--brand-secondary) 22%, transparent)", color: p.text }}
              >
                {initials(service.contact_name ?? "فريق الخدمات")}
              </span>
              <div className="leading-tight">
                <p className="text-xs font-extrabold" style={{ color: p.text }}>
                  {service.contact_name || "فريق الخدمات"}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold" style={{ color: p.muted }} dir="ltr">
                  {service.contact_phone}
                </p>
              </div>
            </div>
            <a
              href={whatsappLink(service.contact_phone)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold text-white"
              style={{ background: "#25D366", boxShadow: "0 10px 24px -12px #25D366" }}
            >
              <Send className="h-4 w-4" />
              ابدأ المحادثة
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ServicesSkeleton({ p }: { p: Palette }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[1.75rem]"
          style={{ background: p.surface, border: `1px solid ${p.border}` }}
        >
          <div className="h-44 animate-pulse" style={{ background: p.surfaceAlt }} />
          <div className="space-y-3 p-6">
            <div className="h-4 w-2/3 animate-pulse rounded-full" style={{ background: p.surfaceAlt }} />
            <div className="h-3 w-full animate-pulse rounded-full" style={{ background: p.surfaceAlt }} />
            <div className="h-3 w-4/5 animate-pulse rounded-full" style={{ background: p.surfaceAlt }} />
            <div className="h-10 animate-pulse rounded-xl" style={{ background: p.surfaceAlt }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  filtered,
  p,
  onReset,
}: {
  filtered: boolean;
  p: Palette;
  onReset: () => void;
}) {
  const tracks = [
    { icon: Target, title: "استشارات مخصصة", desc: "جلسات مركّزة تحل مشكلتك وتضع خطة واضحة." },
    { icon: Lightbulb, title: "ورش تطويرية", desc: "محتوى عملي يرفع مهاراتك خطوة بخطوة." },
    { icon: Users, title: "متابعة فردية", desc: "دعم مستمر مع مختص يتابع تقدمك عن قرب." },
  ];

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:px-10 sm:py-16"
        style={{ background: p.surface, border: `1px solid ${p.border}`, boxShadow: p.shadow }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(${p.text} 0.8px, transparent 0.8px)`,
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto max-w-xl">
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem]"
            style={{
              background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
              color: "var(--brand-primary)",
              border: "1px solid var(--brand-primary)",
            }}
          >
            {filtered ? <Search className="h-9 w-9" /> : <Sparkles className="h-9 w-9" />}
          </motion.span>

          <h2 className="mt-6 text-2xl font-extrabold sm:text-3xl" style={{ color: p.text }}>
            {filtered ? "لم نجد خدمة مطابقة" : "نجهّز لك تجربة تليق بطموحك"}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-8" style={{ color: p.muted }}>
            {filtered
              ? "جرّب كلمة أخرى أو امسح البحث لعرض كل الخدمات المتاحة."
              : "فريقنا يعمل على إطلاق باقة خدمات تعليمية مخصصة. تابع هذه المساحة لتكتشف الجديد قريباً."}
          </p>

          {filtered && (
            <button
              type="button"
              onClick={onReset}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold"
              style={{ background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
            >
              <RefreshCw className="h-4 w-4" />
              مسح البحث
            </button>
          )}
        </div>
      </div>

      {!filtered && (
        <div className="grid gap-4 md:grid-cols-3">
          {tracks.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl p-5"
              style={{ background: p.surface, border: `1px solid ${p.border}` }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: "color-mix(in srgb, var(--brand-secondary) 14%, transparent)",
                  color: "var(--brand-primary)",
                }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="mt-4 flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold" style={{ color: p.text }}>{title}</h3>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: p.surfaceAlt, color: p.muted }}>
                  قريباً
                </span>
              </div>
              <p className="mt-2 text-xs leading-6" style={{ color: p.muted }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProcessSection({ p }: { p: Palette }) {
  const steps = [
    { icon: Search, title: "اختر خدمتك", desc: "تصفّح الخدمات واقرأ المميزات بوضوح قبل أي خطوة." },
    { icon: MessageCircle, title: "تواصل مباشرة", desc: "اضغط زر واتساب وتحدث مع المسؤول عن الخدمة فوراً." },
    { icon: BadgeCheck, title: "ابدأ الخطة", desc: "اتفق على التفاصيل مع مقدم الخدمة بمساحة عمل واضحة." },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {steps.map(({ icon: Icon, title, desc }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="relative rounded-2xl p-5"
          style={{ background: p.surfaceAlt, border: `1px solid ${p.border}` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold"
              style={{ background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
            >
              {i + 1}
            </span>
            <Icon className="h-5 w-5" style={{ color: "var(--brand-secondary)" }} />
          </div>
          <h3 className="mt-4 text-sm font-extrabold" style={{ color: p.text }}>{title}</h3>
          <p className="mt-1.5 text-xs leading-6" style={{ color: p.muted }}>{desc}</p>
        </motion.div>
      ))}
    </section>
  );
}

export function ServicesPage() {
  const { tenant } = useActiveTenant();
  const p = usePalette();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("default");
  const [selected, setSelected] = useState<Service | null>(null);

  const {
    data: services = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<Service[]>({
    queryKey: ["public-services"],
    queryFn: async () => {
      const { data } = await api.get<{ services?: Service[] }>("/public/services");
      return data.services ?? [];
    },
    staleTime: 60_000,
    retry: 1,
  });

  const error = queryError
    ? "تعذر تحميل الخدمات حالياً. تحقق من اتصالك وحاول مرة أخرى."
    : "";

  const stats = useMemo(
    () => ({
      services: services.length,
      features: services.reduce((total, service) => total + (service.highlights?.length ?? 0), 0),
      experts: new Set(
        services.map((service) => service.contact_name || service.contact_phone).filter(Boolean),
      ).size,
    }),
    [services],
  );

  const visibleServices = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const result = services.filter((service) => {
      if (!term) return true;
      const haystack = [
        service.title,
        service.summary,
        service.description,
        service.contact_name,
        ...(service.highlights ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(term);
    });

    if (sort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title, "ar"));
    } else if (sort === "highlights") {
      result.sort((a, b) => (b.highlights?.length ?? 0) - (a.highlights?.length ?? 0));
    }
    return result;
  }, [services, query, sort]);

  const supportPhone = services.find((service) => service.contact_phone)?.contact_phone ?? "";

  return (
    <div dir="rtl" className="relative min-h-screen" style={{ background: p.page }}>
      <Hero tenantName={tenant?.name ?? ""} stats={stats} loading={loading} p={p} />

      <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <section id="services" className="pt-12 sm:pt-16">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl" style={{ color: p.text }}>
                ما الذي نقدّمه؟
              </h2>
              <p className="mt-2 text-sm leading-7" style={{ color: p.muted }}>
                كل خدمة مصممة لتكون خطوة عملية نحو هدفك، مع تواصل مباشر وشفاف من البداية.
              </p>
            </div>

            {!loading && services.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block">
                  <Search
                    className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: p.muted }}
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ابحث عن خدمة..."
                    className="h-11 w-full rounded-xl pe-10 ps-4 text-sm outline-none placeholder:text-[color:var(--placeholder-color)] focus:ring-2 sm:w-64"
                    style={
                      {
                        background: p.surface,
                        color: p.text,
                        border: `1px solid ${p.border}`,
                        "--placeholder-color": p.muted,
                      } as CSSProperties
                    }
                  />
                </label>

                <label className="relative block">
                  <ArrowUpDown
                    className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: p.muted }}
                  />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortMode)}
                    aria-label="ترتيب الخدمات"
                    className="h-11 w-full appearance-none rounded-xl pe-10 ps-8 text-xs font-bold outline-none focus:ring-2 sm:w-44"
                    style={{
                      background: p.surface,
                      color: p.text,
                      border: `1px solid ${p.border}`,
                      colorScheme: p.page === "#0b0a10" ? "dark" : "light",
                    }}
                  >
                    <option value="default">الترتيب الافتراضي</option>
                    <option value="title">أبجدياً</option>
                    <option value="highlights">الأكثر تفصيلاً</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {!loading && services.length > 0 && (
            <div className="mb-5 flex items-center gap-2 text-xs" style={{ color: p.muted }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-primary)" }} />
              {formatNumber(visibleServices.length)} من {formatNumber(services.length)} خدمة معروضة
            </div>
          )}

          {error ? (
            <div
              className="flex flex-col items-center gap-4 rounded-[1.75rem] px-6 py-14 text-center"
              style={{ background: p.surface, border: `1px solid ${p.border}` }}
            >
              <CircleHelp className="h-10 w-10" style={{ color: "var(--brand-primary)" }} />
              <div>
                <h2 className="text-lg font-extrabold" style={{ color: p.text }}>حدث خطأ أثناء التحميل</h2>
                <p className="mt-2 text-sm" style={{ color: p.muted }}>{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void refetch()}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold"
                style={{ background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </button>
            </div>
          ) : loading ? (
            <ServicesSkeleton p={p} />
          ) : visibleServices.length === 0 ? (
            <EmptyState filtered={query.trim().length > 0 || services.length === 0} p={p} onReset={() => { setQuery(""); setSort("default"); }} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visibleServices.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    p={p}
                    onOpen={setSelected}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {!loading && !error && (
          <>
            <div className="my-12 h-px" style={{ background: p.border }} />
            <section>
              <div className="mb-6 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "color-mix(in srgb, var(--brand-secondary) 16%, transparent)", color: "var(--brand-primary)" }}
                >
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold" style={{ color: p.text }}>كيف تعمل الخدمات؟</h2>
                  <p className="text-xs" style={{ color: p.muted }}>ثلاث خطوات بسيطة تفصلك عن الهدف.</p>
                </div>
              </div>
              <ProcessSection p={p} />
            </section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45 }}
              className="relative mt-12 overflow-hidden rounded-[2rem] px-6 py-10 text-center sm:px-10 sm:py-14"
              style={{
                background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                color: "var(--brand-primary-contrast)",
              }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-2xl font-extrabold sm:text-3xl">
                  {supportPhone ? "لديك سؤال قبل أن تبدأ؟" : "ابحث عن خطوتك التالية في رحلتك التعليمية"}
                </h2>
                <p className="mt-3 text-sm leading-8 opacity-90">
                  {supportPhone
                    ? "تواصل مع فريق الخدمات مباشرة وسنجيبك على الفور ونحدد معك الأنسب لاحتياجك."
                    : "استكشف دوراتنا ومحتوانا التعليمي، وابنِ مهاراتك مع منصة تضعك أولاً."}
                </p>
                <a
                  href={supportPhone ? whatsappLink(supportPhone) : "/courses"}
                  target={supportPhone ? "_blank" : undefined}
                  rel={supportPhone ? "noreferrer" : undefined}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/95 px-6 py-3 text-xs font-extrabold text-[#1a1510] transition-transform hover:scale-105"
                >
                  {supportPhone ? <MessageCircle className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                  {supportPhone ? "تحدث معنا الآن" : "استكشف الكورسات"}
                  <ArrowLeft className="h-4 w-4" />
                </a>
              </div>
            </motion.section>
          </>
        )}
      </div>

      <AnimatePresence>
        {selected && <ServiceDialog service={selected} p={p} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
