"use client";

import { Fragment, useState } from "react";
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
} from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Platform footer — "الختام": the page closes like a poster, not a template.
 *
 * A single oversized wordmark drawn in the Amiri display face dominates the
 * whole footer and carries the tenant brand off-screen — the same way a book
 * ends, or a film's closing credits fade. Everything else stays quiet and on
 * one line so the typography does the talking.
 *
 * Composition (desktop, RTL):
 *   1. A closing CTA band that restates the pitch before the page ends.
 *   2. The full-bleed giant wordmark + colophon line.
 *   3. A low nav rail: nav groups as inline breadcrumbs separated by dots,
 *      plus one compact contact group — no tall link columns.
 *   4. A single legal line with the socials and a return-to-top.
 *
 * Colour logic — the deep terracotta stays the frame:
 *   - Primary (#D87B63): the backdrop, deepened with a neutral dark tone.
 *   - Secondary (#FFB50E): small tracked labels, micro-rules, the closing CTA
 *     accent, breadcrumb hovers and the legal socials. Never loud, always at
 *     the caption level so the giant wordmark stays the star.
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

/* ── Background: layered warm glow + dot texture + faint letters ── */
function FooterBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Warm glow bleeding in from the top, echoing the gold above */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 60% at 50% -20%, color-mix(in srgb, var(--brand-secondary) 16%, transparent) 0%, transparent 55%)",
        }}
      />
      {/* Deep primary caste rising from the bottom corner */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 80% at 100% 110%, color-mix(in srgb, var(--brand-primary) 30%, transparent) 0%, transparent 62%)",
        }}
      />
      {/* Dot texture, matching the editorial sections above */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 0.6px, transparent 0.6px)",
          backgroundSize: "26px 26px",
        }}
      />
      {/* Barely-there Arabic letters, a whisper of the hero's decor */}
      <span
        className="absolute bottom-16 start-[2%] hidden select-none text-8xl font-bold text-white/5 lg:block"
        style={{ fontFamily: "var(--font-display, serif)", transform: "rotate(9deg)" }}
      >
        أ
      </span>
      <span
        className="absolute top-24 end-[3%] hidden select-none text-6xl font-bold text-white/5 lg:block"
        style={{ fontFamily: "var(--font-display, serif)", transform: "rotate(-11deg)" }}
      >
        ف
      </span>
      <span
        className="absolute bottom-24 end-[26%] hidden select-none text-5xl font-bold text-white/5 lg:block"
        style={{ fontFamily: "var(--font-display, serif)", transform: "rotate(12deg)" }}
      >
        س
      </span>
    </div>
  );
}

/* ── Brand mark: logo chip with a graceful fallback tile ───────── */
function BrandMark({ logo, tenantName }: { logo: string | null; tenantName: string }) {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[var(--brand-secondary)]">
        <GraduationCap className="h-5 w-5" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={tenantName}
      onError={() => setFailed(true)}
      className="h-9 w-auto max-w-[160px] object-contain"
    />
  );
}

/* ── Socials as a set-text row, separated by hairlines ─────────── */
function SocialsRow() {
  return (
    <div className="flex flex-wrap items-center gap-x-0.5 gap-y-2">
      {footerSocials.map((social, i) => {
        const Icon = SOCIAL_ICONS[social.label];
        if (!Icon) return null;
        const isExternal = social.href.startsWith("http");
        return (
          <Fragment key={social.label}>
            <a
              href={social.href}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={social.label}
              title={social.label}
              className="group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-colors duration-200 hover:text-[var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              <Icon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
              {social.label}
            </a>
            {i < footerSocials.length - 1 && (
              <span aria-hidden="true" className="mx-1 h-3 w-px bg-white/15" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ── Closing CTA band: restates the pitch before the page ends ─── */
function ClosingCta({ tenantName }: { tenantName: string }) {
  return (
    <div className="border-b border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-10 pt-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:pb-12 lg:pt-16">
        <div className="max-w-xl">
          <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.18em] text-white/50">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--brand-secondary)" }}
            />
            تعلّم · تدرّب · تقدّم
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.25] tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-[1.2]">
            جاهز تبدأ <span className="text-[var(--brand-secondary)]">رحلتك</span> التعليمية؟
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/60 sm:text-base">
            انضم إلى {tenantName} الآن، شاهد الشروحات، تدرّب على التمارين وتابع
            تقدّمك خطوة بخطوة.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-secondary)] px-7 py-3 text-sm font-bold text-[var(--brand-secondary-contrast)] transition-colors duration-200 hover:bg-white hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            style={{
              boxShadow: "0 10px 30px color-mix(in srgb, var(--brand-secondary) 35%, transparent)",
            }}
          >
            سجّل الآن
          </Link>
          <a
            href={DEVELOPER_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-white/5 px-7 py-3 text-sm font-bold text-white ring-1 ring-white/25 transition-colors duration-200 hover:bg-white/10 hover:ring-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
          >
            تواصل معنا
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── The star: full-bleed giant wordmark + colophon line ───────── */
function GiantWordmark({ logo, tenantName }: { logo: string | null; tenantName: string }) {
  return (
    <div className="w-full overflow-hidden px-4 pt-9 sm:px-7 lg:px-14 lg:pt-10">
      <div className="flex items-center gap-3">
        <BrandMark logo={logo} tenantName={tenantName} />
        <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--brand-secondary)]">
          منظومة تعليمية متكاملة
        </span>
      </div>

      <h2
        className="mt-6 bg-clip-text text-balance text-transparent leading-[0.95] tracking-tight text-white"
        style={{
          fontFamily: "var(--font-display, var(--font-sans))",
          fontSize: "clamp(3rem, 9vw, 7.5rem)",
          backgroundImage: "linear-gradient(to bottom, #ffffff 55%, rgba(255,255,255,0.55))",
        }}
      >
        {tenantName}
      </h2>

      <span
        aria-hidden="true"
        className="mt-6 block h-[3px] w-24 rounded-full"
        style={{ background: "var(--brand-secondary)" }}
      />
    </div>
  );
}

/* ── One nav group as an inline breadcrumb row (not a column) ──── */
function NavGroup({ section }: { section: FooterNavSection }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-white/55">
        <span
          aria-hidden="true"
          className="h-[3px] w-5 shrink-0 rounded-full"
          style={{ background: "var(--brand-secondary)" }}
        />
        {section.heading}
      </h3>
      <ul className="mt-4 flex flex-wrap items-center gap-y-2">
        {section.links.map((link, i, arr) => (
          <Fragment key={link.label}>
            <li>
              <Link
                href={link.href}
                className="inline-flex rounded py-0.5 text-sm text-white/75 transition-colors duration-200 hover:text-[var(--brand-secondary)] focus-visible:text-[var(--brand-secondary)]"
              >
                {link.label}
              </Link>
            </li>
            {i < arr.length - 1 && (
              <li aria-hidden="true" className="px-1.5 text-white/25">
                ·
              </li>
            )}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}

/* ── Compact contact group, one line per entry ─────────────────── */
function ContactGroup() {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-white/55">
        <span
          aria-hidden="true"
          className="h-[3px] w-5 shrink-0 rounded-full"
          style={{ background: "var(--brand-secondary)" }}
        />
        التواصل
      </h3>
      <ul className="mt-4 space-y-2.5">
        <li>
          <a
            href={footerContact.phoneHref}
            className="inline-flex items-center gap-2 rounded text-sm text-white/75 transition-colors duration-200 hover:text-[var(--brand-secondary)]"
          >
            <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--brand-secondary)]" />
            <span className="dir-ltr">{footerContact.phone}</span>
          </a>
        </li>
        <li>
          <a
            href={footerContact.emailHref}
            className="inline-flex items-center gap-2 rounded text-sm text-white/75 transition-colors duration-200 hover:text-[var(--brand-secondary)]"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--brand-secondary)]" />
            <span className="dir-ltr">{footerContact.email}</span>
          </a>
        </li>
        <li>
          <span className="inline-flex items-start gap-2 text-sm leading-6 text-white/75">
            <Clock className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--brand-secondary)]" />
            {footerContact.hours}
          </span>
        </li>
      </ul>
    </div>
  );
}

/* ── Low nav rail: everything sits on a single line ────────────── */
function NavRail() {
  return (
    <div className="border-y border-white/10">
      <div className="mx-auto grid max-w-7xl gap-x-8 gap-y-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {footerNavSections.map((section, i) => (
          <div key={section.heading} className={i > 0 ? "lg:border-s lg:border-white/10 lg:ps-8" : ""}>
            <NavGroup section={section} />
          </div>
        ))}
        <div className="lg:border-s lg:border-white/10 lg:ps-8">
          <ContactGroup />
        </div>
      </div>
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
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors duration-200 hover:border-transparent hover:bg-[var(--brand-secondary)] hover:text-[var(--brand-secondary-contrast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
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
    <footer
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: "color-mix(in srgb, var(--brand-primary) 78%, #1a0f08)",
      }}
    >
      <FooterBackdrop />

      <div className="relative z-10">
        <ClosingCta tenantName={tenantName} />

        <GiantWordmark logo={logo} tenantName={tenantName} />

        <NavRail />

        {/* ── Legal line ── */}
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-7 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p className="text-xs leading-relaxed text-white/50">
            © {year} {tenantName}. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-3">
            <SocialsRow />
            <span aria-hidden="true" className="mx-1 h-4 w-px bg-white/15" />
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}