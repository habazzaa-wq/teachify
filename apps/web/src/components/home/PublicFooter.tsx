"use client";

import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Facebook, Youtube, Instagram, MessageCircle, Phone, Mail, Clock } from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Platform footer — a warm terracotta (brand primary) close.
 *
 * Colour logic — the two brand colours never blend:
 *   - Primary (#D87B63): the footer's solid background.
 *   - Secondary (#FFB50E): the card borders, column accents, and the
 *     hover fill that flips each interactive element's background to gold.
 *
 * Hover rule: every interactive element is a defined box with a border;
 * on hover its background flips to the opposite brand colour (gold),
 * and its text flips to dark for contrast.
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

/* ── Shared hover-fill style: neutral box → gold background ────── */
const goldFill =
  "block w-full rounded-md px-3.5 py-2.5 text-sm text-white/90 transition-colors duration-150 hover:bg-[var(--brand-secondary)] hover:text-[var(--brand-secondary-contrast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]";

/* ── Sub-component: one nav card ───────────────────────────────── */
function FooterNavCard({ section }: { section: FooterNavSection }) {
  return (
    <section
      className="rounded-xl p-5"
      style={{
        backgroundColor: "rgb(0 0 0 / 0.12)",
        border: "1px solid color-mix(in srgb, var(--brand-secondary) 45%, transparent)",
      }}
      aria-label={section.heading}
    >
      <h3
        className="text-sm font-semibold"
        style={{ color: "var(--brand-secondary)" }}
      >
        {section.heading}
      </h3>
      <ul className="mt-3 space-y-1">
        {section.links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={goldFill}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
    <footer style={{ backgroundColor: "var(--brand-primary)" }}>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        {/* ── Header: brand + description + CTAs ── */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              {logo ? (
                <span className="flex h-10 items-center rounded-lg bg-white px-2.5 shadow-sm">
                  <Image src={logo} alt={tenantName} width={104} height={24} className="h-6 w-auto" />
                </span>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[var(--brand-primary)]">
                  <GraduationCap className="h-5 w-5" />
                </span>
              )}
              <span className="text-lg font-extrabold tracking-tight text-white">
                {tenantName}
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/85">
              منصة تعليمية عربية متكاملة تضم الطلاب والمعلمين وأولياء الأمور، وتقدّم محتوى
              دراسيًا منظّمًا لكل المراحل الدراسية.
            </p>
          </div>

          {/* CTAs — gold fills, hover flips to a defined contrast fill */}
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-[var(--brand-secondary)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-secondary-contrast)] transition-colors duration-150 hover:bg-white hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              سجّل الآن
            </Link>

            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/40 transition-colors duration-150 hover:bg-[var(--brand-secondary)] hover:text-[var(--brand-secondary-contrast)] hover:ring-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              تواصل معنا
            </a>
          </div>
        </div>

        {/* ── Middle: nav cards + contact card ── */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {footerNavSections.map((section) => (
            <FooterNavCard key={section.heading} section={section} />
          ))}

          {/* Contact card */}
          <section
            className="rounded-xl p-5"
            aria-label="التواصل"
            style={{
              backgroundColor: "rgb(0 0 0 / 0.12)",
              border: "1px solid color-mix(in srgb, var(--brand-secondary) 45%, transparent)",
            }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--brand-secondary)" }}>
              التواصل
            </h3>
            <ul className="mt-3 space-y-1">
              <li>
                <a
                  href={footerContact.phoneHref}
                  className="flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm text-white/90 transition-colors duration-150 hover:bg-[var(--brand-secondary)] hover:text-[var(--brand-secondary-contrast)]"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  {footerContact.phone}
                </a>
              </li>
              <li>
                <a
                  href={footerContact.emailHref}
                  className="flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm text-white/90 transition-colors duration-150 hover:bg-[var(--brand-secondary)] hover:text-[var(--brand-secondary-contrast)]"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {footerContact.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm text-white/90">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{footerContact.hours}</span>
              </li>
            </ul>
          </section>
        </div>

        {/* ── Bottom bar: hairline divider, muted legal + social ── */}
        <div className="mt-12 flex flex-col gap-5 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/75">
            © {year} {tenantName}. جميع الحقوق محفوظة.
            <span className="mx-2 opacity-50">|</span>
            <Link href="/marketing/privacy" className="transition-colors duration-150 hover:text-[var(--brand-secondary)] hover:underline underline-offset-4">
              سياسة الخصوصية
            </Link>
            <span className="mx-2 opacity-50">|</span>
            <Link href="/marketing/terms" className="transition-colors duration-150 hover:text-[var(--brand-secondary)] hover:underline underline-offset-4">
              شروط الاستخدام
            </Link>
          </p>

          <div className="flex items-center gap-1.5">
            {footerSocials.map((social) => {
              const Icon = SOCIAL_ICONS[social.label];
              if (!Icon) return null;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-white/75 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
