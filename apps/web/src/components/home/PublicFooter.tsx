"use client";

import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  Facebook,
  Youtube,
  Instagram,
  MessageCircle,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Platform footer — a deep, warm terracotta close.
 *
 * Colour logic — the two brand colours never blend:
 *   - Primary (#D87B63): the background, deepened with a neutral dark
 *     tone so the text and gold accents breathe comfortably.
 *   - Secondary (#FFB50E): column headings, the primary button, and the
 *     hover accent on links and icons.
 *
 * A calm, balanced layout: a brand bar, four link columns split by hairline
 * rules, and a quiet legal strip. Hover only recolours text.
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

/* ── Shared styles ─────────────────────────────────────────────── */
const linkClass =
  "inline-flex py-1 text-sm text-white/80 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:text-[var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]";

const headingClass = {
  color: "var(--brand-secondary)",
};

/* ── Column of links ───────────────────────────────────────────── */
function FooterLinkColumn({ heading, links }: FooterNavSection) {
  return (
    <nav aria-label={heading}>
      <h3 className="text-sm font-semibold tracking-wide" style={headingClass}>
        {heading}
      </h3>
      <ul className="mt-4 space-y-1">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
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
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--brand-primary) 80%, #1a0f08)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Brand bar ── */}
        <div className="flex flex-col gap-8 border-b border-white/10 py-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:py-14">
          <div className="flex items-center gap-4">
            {logo ? (
              <span className="flex h-12 shrink-0 items-center rounded-xl bg-white px-3">
                <Image
                  src={logo}
                  alt={tenantName}
                  width={120}
                  height={28}
                  className="h-7 w-auto"
                />
              </span>
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)]">
                <GraduationCap className="h-6 w-6" />
              </span>
            )}
            <div>
              <p className="text-lg font-bold leading-tight text-white">
                {tenantName}
              </p>
              <p className="mt-1 text-xs text-white/65">
                منصة تعليمية عربية متكاملة
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--brand-secondary)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-secondary-contrast)] transition-colors duration-150 hover:bg-white hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              سجّل الآن
            </Link>
            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-white/10 px-6 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition-colors duration-150 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              تواصل معنا
            </a>
          </div>
        </div>

        {/* ── Link columns ── */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-6 lg:gap-0">
          {/* About */}
          <div className="sm:col-span-2 lg:col-span-2 lg:pe-12">
            <h3 className="text-sm font-semibold tracking-wide" style={headingClass}>
              عن المنصة
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/80">
              منصة تعليمية عربية متكاملة تضم الطلاب والمعلمين وأولياء الأمور،
              وتقدّم محتوى دراسيًا منظّمًا لكل المراحل الدراسية.
            </p>
            <ul className="mt-6 flex items-center gap-1">
              {footerSocials.map((social) => {
                const Icon = SOCIAL_ICONS[social.label];
                if (!Icon) return null;
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      aria-label={social.label}
                      title={social.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-[var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {footerNavSections.map((section) => (
            <div
              key={section.heading}
              className="lg:col-span-1 lg:border-s lg:border-white/10 lg:pe-10 lg:ps-8"
            >
              <FooterLinkColumn {...section} />
            </div>
          ))}

          {/* Contact */}
          <div className="sm:col-span-2 lg:col-span-1 lg:border-s lg:border-white/10 lg:ps-8">
            <h3 className="text-sm font-semibold tracking-wide" style={headingClass}>
              التواصل
            </h3>
            <ul className="mt-4 space-y-1">
              <li>
                <a href={footerContact.phoneHref} className={linkClass}>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 opacity-70" />
                    {footerContact.phone}
                  </span>
                </a>
              </li>
              <li>
                <a href={footerContact.emailHref} className={linkClass}>
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 opacity-70" />
                    {footerContact.email}
                  </span>
                </a>
              </li>
              <li className="inline-flex items-start gap-2 py-1 text-sm leading-6 text-white/80">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                <span>{footerContact.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Legal strip ── */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-white/60">
            © {year} {tenantName}. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-1">
            <Link
              href="/marketing/privacy"
              className="inline-flex py-1 text-xs text-white/60 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:text-[var(--brand-secondary)]"
            >
              سياسة الخصوصية
            </Link>
            <span className="mx-1 text-white/25">·</span>
            <Link
              href="/marketing/terms"
              className="inline-flex py-1 text-xs text-white/60 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:text-[var(--brand-secondary)]"
            >
              شروط الاستخدام
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
