"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Facebook,
  Youtube,
  Instagram,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  ArrowUp,
  ArrowLeft,
} from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Platform footer — a floating brand panel built from the public surface's own
 * design tokens instead of a stock template:
 *   - a rounded, deep terracotta "flight card" over the page background, with
 *     the signature gradient hairline along its top edge,
 *   - nav links as glass chips (the same chip language as the navbar / mobile
 *     nav), not bare text columns,
 *   - contact + socials as the hero's icon circles (3px brand border fills),
 *   - the tenant's dynamic font (`--font-sans`) is inherited from the body —
 *     the footer never overrides it.
 */

const DEVELOPER_WHATSAPP = "https://wa.me/201011245565";

/* ── Types ─────────────────────────────────────────────────────── */
export type FooterLink = { label: string; href: string };
export type FooterNavSection = { heading: string; links: FooterLink[] };
export type FooterSocial = { label: string; href: string };

/* ── Content (data-driven) ─────────────────────────────────────── */
export const footerNavSections: FooterNavSection[] = [
  {
    heading: "المراحل الدراسية",
    links: [
      { label: "المراحل الدراسية", href: "/stages" },
      { label: "الكورسات", href: "/courses" },
      { label: "لوحة الطالب", href: "/student/dashboard" },
      { label: "تفاعل الطلاب", href: "/community" },
    ],
  },
  {
    heading: "الدعم والمساعدة",
    links: [
      { label: "تواصل معنا", href: "#" },
      { label: "مركز المساعدة", href: "#" },
      { label: "الأسئلة الشائعة", href: "#" },
    ],
  },
  {
    heading: "روابط عامة",
    links: [
      { label: "سياسة الخصوصية", href: "/marketing/privacy" },
      { label: "شروط الاستخدام", href: "/marketing/terms" },
    ],
  },
];

export const footerContact = {
  phone: "+20 10 1124 5565",
  phoneHref: "tel:+201011245565",
  email: "hello@academy.example",
  emailHref: "mailto:hello@academy.example",
  hours: "السبت — الخميس، ٨ صباحًا حتى ٦ مساءً",
};

export const footerSocials: FooterSocial[] = [
  { label: "فيسبوك", href: "#" },
  { label: "يوتيوب", href: "#" },
  { label: "انستغرام", href: "#" },
  { label: "واتساب", href: DEVELOPER_WHATSAPP },
];

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  فيسبوك: Facebook,
  يوتيوب: Youtube,
  انستغرام: Instagram,
  واتساب: MessageCircle,
};

const PRIMARY = "var(--brand-primary)";
const SECONDARY = "var(--brand-secondary)";
const CONTRAST = (isPrimary: boolean) =>
  isPrimary ? "var(--brand-primary-contrast)" : "var(--brand-secondary-contrast)";

/* ── Card surface: brand depth + warm glows + dot texture ──────── */
function CardSurface() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span
        className="absolute inset-x-8 top-0 h-px opacity-70"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--brand-primary), var(--brand-secondary), var(--brand-primary), transparent)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 55% at 50% -15%, color-mix(in srgb, var(--brand-secondary) 16%, transparent) 0%, transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 70% at 100% 110%, color-mix(in srgb, var(--brand-primary) 32%, transparent) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 0.6px, transparent 0.6px)",
          backgroundSize: "26px 26px",
        }}
      />
    </div>
  );
}

/* ── Brand mark: logo chip with a graceful fallback tile ───────── */
function BrandMark({ logo, tenantName }: { logo: string | null; tenantName: string }) {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) {
    return (
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--brand-primary)] shadow-soft-md"
      >
        <GraduationCap className="h-6 w-6" />
      </span>
    );
  }
  return (
    <span className="flex h-12 shrink-0 items-center rounded-2xl bg-white px-3 shadow-soft-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={tenantName}
        onError={() => setFailed(true)}
        className="h-7 w-auto max-w-[160px] object-contain"
      />
    </span>
  );
}

/* ── Group heading: gradient micro-rule + label ────────────────── */
function GroupHeading({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="h-[3px] w-6 shrink-0 rounded-full"
        style={{ background: `linear-gradient(90deg, ${SECONDARY}, ${PRIMARY})` }}
      />
      <h3 className="text-[13px] font-bold text-white/85">{text}</h3>
    </div>
  );
}

/* ── A nav link as a glass chip (the site's chip language) ─────── */
function NavLinkChip({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex w-full items-center justify-between gap-2 rounded-xl bg-white/5 px-3.5 py-2.5 text-[13px] font-medium text-white/80 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white hover:ring-[var(--brand-secondary)] hover:shadow-soft-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
      >
        <span className="truncate">{label}</span>
        <ArrowLeft
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 -translate-x-1 text-[var(--brand-secondary)] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        />
      </Link>
    </li>
  );
}

/* ── One nav group rendered as wrapping glass chips ────────────── */
function NavGroup({ section }: { section: FooterNavSection }) {
  return (
    <div>
      <GroupHeading text={section.heading} />
      <ul className="mt-4 flex flex-wrap gap-2">
        {section.links.map((link) => (
          <NavLinkChip key={link.label} label={link.label} href={link.href} />
        ))}
      </ul>
    </div>
  );
}

/* ── Socials as the hero's icon circles ────────────────────────── */
function SocialIcons() {
  return (
    <ul className="flex items-center gap-2">
      {footerSocials.map((social, i) => {
        const Icon = SOCIAL_ICONS[social.label];
        if (!Icon) return null;
        const isPrimary = i % 2 === 0;
        const color = isPrimary ? PRIMARY : SECONDARY;
        const isExternal = social.href.startsWith("http");
        return (
          <li key={social.label}>
            <a
              href={social.href}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={social.label}
              title={social.label}
              className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] transition-all duration-300 hover:scale-110 hover:shadow-brand-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
              style={{ backgroundColor: color, borderColor: color }}
            >
              <Icon className="h-[17px] w-[17px]" style={{ color: CONTRAST(isPrimary) }} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* ── About block: short intro + socials ────────────────────────── */
function AboutBlock() {
  return (
    <div>
      <GroupHeading text="عن المنصة" />
      <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
        منصة تعليمية عربية متكاملة تضم الطلاب والمعلمين وأولياء الأمور، وتقدّم
        محتوى دراسيًا منظّمًا لكل المراحل الدراسية.
      </p>
      <div className="mt-6">
        <SocialIcons />
      </div>
    </div>
  );
}

/* ── Contact entries as the hero's icon tiles ──────────────────── */
const CONTACT_ROWS = [
  { label: "اتصل بنا", value: footerContact.phone, href: footerContact.phoneHref, icon: Phone },
  { label: "راسلنا", value: footerContact.email, href: footerContact.emailHref, icon: Mail },
  { label: "ساعات العمل", value: footerContact.hours, href: null, icon: Clock },
] as const;

function ContactStrip() {
  return (
    <div className="mt-12 border-t border-white/10 pt-8">
      <ul className="flex flex-wrap items-center gap-x-9 gap-y-5">
        {CONTACT_ROWS.map((row, i) => {
          const Icon = row.icon;
          const isPrimary = i % 2 === 0;
          const color = isPrimary ? PRIMARY : SECONDARY;
          return (
            <li key={row.label} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] shadow-md"
                style={{ backgroundColor: color, borderColor: color }}
              >
                <Icon className="h-[18px] w-[18px]" style={{ color: CONTRAST(isPrimary) }} />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold text-white/45">{row.label}</span>
                {row.href ? (
                  <a
                    href={row.href}
                    className="mt-0.5 block truncate text-sm font-semibold text-white/85 transition-colors duration-200 hover:text-[var(--brand-secondary)]"
                  >
                    <span className="dir-ltr">{row.value}</span>
                  </a>
                ) : (
                  <span className="mt-0.5 block text-sm font-semibold leading-6 text-white/85">
                    {row.value}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Return-to-top, tucked into the legal line ─────────────────── */
function BackToTop() {
  const scrollToTop = () => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      title="العودة للأعلى"
      aria-label="العودة للأعلى"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 ring-1 ring-white/20 transition-colors duration-200 hover:bg-[var(--brand-secondary)] hover:text-[var(--brand-secondary-contrast)] hover:ring-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}

/* ── Main footer ───────────────────────────────────────────────── */
export function PublicFooter() {
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const platformBranding = useTenantStore((s) => s.platformBranding);

  const brandLogo = platformBranding?.logo ?? tenant?.branding?.logo ?? null;
  const logo =
    theme === "dark"
      ? platformBranding?.darkLogo ?? tenant?.branding?.dark_logo ?? brandLogo
      : platformBranding?.lightLogo ?? tenant?.branding?.light_logo ?? brandLogo;
  const tenantName = platformBranding?.name ?? tenant?.name ?? "أكاديميتي";
  const year = new Date().getFullYear();

  return (
    <footer dir="rtl" className="relative w-full py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── The flight card ── */}
        <div
          className="relative overflow-hidden rounded-3xl shadow-brand-md"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              "linear-gradient(165deg, color-mix(in srgb, var(--brand-primary) 70%, #1a0f08) 0%, color-mix(in srgb, var(--brand-primary) 85%, #1a0f08) 50%, color-mix(in srgb, var(--brand-primary) 80%, #120a06) 100%)",
          }}
        >
          <CardSurface />

          <div className="relative px-5 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            {/* ── Brand bar ── */}
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <BrandMark logo={logo} tenantName={tenantName} />
                <div>
                  <p className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
                    {tenantName}
                  </p>
                  <p className="mt-1 text-xs text-white/60">منظومة تعليمية متكاملة</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/student/dashboard"
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--brand-secondary)] px-6 py-3 text-sm font-bold text-[var(--brand-secondary-contrast)] transition-colors duration-200 hover:bg-white hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                  style={{
                    boxShadow:
                      "0 12px 28px -10px color-mix(in srgb, var(--brand-secondary) 55%, transparent)",
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <GraduationCap className="h-4 w-4" />
                  <span className="relative">سجّل الآن</span>
                </Link>
                <a
                  href={DEVELOPER_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-white/5 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/25 transition-colors duration-200 hover:bg-white/10 hover:ring-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                >
                  تواصل معنا
                </a>
              </div>
            </div>

            {/* ── Content spread ── */}
            <div className="mt-12 grid gap-x-10 gap-y-11 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <AboutBlock />
              </div>
              <div className="lg:col-span-8">
                <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {footerNavSections.map((section) => (
                    <NavGroup key={section.heading} section={section} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Contact + legal ── */}
            <ContactStrip />

            <div className="flex flex-col items-center gap-4 border-t border-white/10 py-6 sm:flex-row sm:justify-between">
              <p className="text-xs leading-relaxed text-white/50">
                © {year} {tenantName}. جميع الحقوق محفوظة.
              </p>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
                <Link
                  href="/marketing/privacy"
                  className="inline-flex py-1 text-xs text-white/50 transition-colors duration-150 hover:text-[var(--brand-secondary)]"
                >
                  سياسة الخصوصية
                </Link>
                <span aria-hidden="true" className="text-white/20">
                  ·
                </span>
                <Link
                  href="/marketing/terms"
                  className="inline-flex py-1 text-xs text-white/50 transition-colors duration-150 hover:text-[var(--brand-secondary)]"
                >
                  شروط الاستخدام
                </Link>
                <span aria-hidden="true" className="mx-1.5 h-4 w-px bg-white/15" />
                <BackToTop />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}