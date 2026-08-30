"use client";

import Link from "next/link";
import Image from "next/image";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useBrandColors } from "@/hooks/useBrandColors";
import {
  GraduationCap, ArrowUp, Heart, Facebook,
  Instagram, Youtube, Twitter, Linkedin, MessageCircle, BookOpen, Layers,
  Home, LayoutDashboard, HelpCircle, ShieldCheck, Phone,
} from "lucide-react";

const DEVELOPER_WHATSAPP = "https://wa.me/201011245565";

const socials = [
  { label: "فيسبوك", icon: Facebook, href: "#" },
  { label: "إنستغرام", icon: Instagram, href: "#" },
  { label: "يوتيوب", icon: Youtube, href: "#" },
  { label: "إكس (تويتر)", icon: Twitter, href: "#" },
  { label: "لينكد إن", icon: Linkedin, href: "#" },
  { label: "واتساب", icon: MessageCircle, href: DEVELOPER_WHATSAPP },
];

const linkGroups = [
  {
    title: "روابط سريعة",
    links: [
      { label: "الرئيسية", href: "/", icon: Home },
      { label: "المراحل الدراسية", href: "/#educational-stages", icon: Layers },
      { label: "الكورسات", href: "/courses", icon: BookOpen },
      { label: "لوحة الطالب", href: "/student/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "الدعم",
    links: [
      { label: "تواصل معنا", href: "#", icon: Phone },
      { label: "مركز المساعدة", href: "#", icon: HelpCircle },
      { label: "الأسئلة الشائعة", href: "#", icon: HelpCircle },
      { label: "سياسة الخصوصية", href: "#", icon: ShieldCheck },
    ],
  },
];

export function PublicFooter() {
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const platformBranding = useTenantStore((s) => s.platformBranding);
  const { primary, secondary } = useBrandColors();

  const brandLogo = platformBranding?.logo ?? tenant?.branding?.logo ?? null;
  const logo = theme === "dark"
    ? platformBranding?.darkLogo ?? tenant?.branding?.dark_logo ?? brandLogo
    : platformBranding?.lightLogo ?? tenant?.branding?.light_logo ?? brandLogo;
  const tenantName = platformBranding?.name ?? tenant?.name ?? "أكاديميتي";

  const year = new Date().getFullYear();

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="community-theme relative isolate overflow-hidden">
      {/* Solid secondary base — the footer carries ONE brand color, no blending */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: secondary }}
      />
      {/* Gentle depth overlay for a professional, even surface */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "rgba(10, 10, 12, 0.45)" }}
      />
      {/* Subtle dotted texture */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-dot opacity-[0.06]" />

      {/* Primary accent bar across the top edge — color used on its own */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 -z-10"
        style={{ background: primary }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Main ── */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-6">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              {logo ? (
                <span className="flex h-10 items-center rounded-xl bg-white/95 px-2.5 shadow-sm backdrop-blur transition-transform duration-300 group-hover:scale-[1.04]">
                  <Image src={logo} alt={tenantName} width={120} height={28} className="h-7 w-auto" />
                </span>
              ) : (
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
                >
                  <GraduationCap className="h-5 w-5" style={{ color: primary }} />
                </span>
              )}
              <span className="text-xl font-extrabold tracking-tight text-white">{tenantName}</span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              منصة تعليمية متكاملة تقدّم رحلة تعلّم هادفة عبر مراحل دراسية منظّمة
              وكورسات احترافية مع متابعة أكاديمية تواكب احتياج كل طالب.
            </p>

            {/* Social */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 text-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 hover:border-white hover:bg-white hover:text-[var(--brand-primary)]"
                  >
                    <Icon className="relative z-10 h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {linkGroups.map((group) => (
            <nav key={group.title} className="lg:col-span-3" aria-label={group.title}>
              <h3 className="relative mb-4 ps-3 text-sm font-bold text-white">
                <span
                  className="absolute inset-y-1 start-0 w-1 rounded-full"
                  style={{ background: primary }}
                />
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 transition-all duration-300 hover:bg-white/10 hover:ps-3 hover:text-white"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-white/40 transition-colors duration-300 group-hover:text-[var(--brand-secondary)]" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-center gap-4 border-t border-white/15 py-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/60">
            © {year} {tenantName}. جميع الحقوق محفوظة.
          </p>

          <p className="flex items-center gap-1.5 text-xs text-white/70">
            <span>طُوّر بكل شغف بواسطة</span>
            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-white transition-opacity duration-300 hover:opacity-80"
            >
              Mahmoud Habazza
              <MessageCircle className="h-3.5 w-3.5" style={{ color: "#25D366" }} />
            </a>
            <Heart className="h-3.5 w-3.5 fill-current" style={{ color: primary }} />
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="العودة إلى الأعلى"
            className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 hover:border-white hover:bg-white hover:text-[var(--brand-primary)]"
          >
            <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
