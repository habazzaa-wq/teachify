"use client";

import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Facebook, Youtube, Instagram, MessageCircle, Clock, Phone, Mail } from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Platform footer — calm, editorial, unmistakably ours.
 *
 * Color rule: the two brand colours are never blended.
 *   - Primary (#D87B63): link hovers, the nav-column accent mark.
 *   - Secondary (#FFB50E): the single "تواصل معنا" button.
 *   - Neutrals: warm page background (matches the homepage) + ink.
 *
 * Hover rule: each element flips to the opposite brand colour —
 * the gold button turns terracotta, neutral links turn terracotta.
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

/* ── Shared link style: neutral → primary on hover ─────────────── */
const inkLink =
  "text-sm text-foreground/70 transition-colors duration-150 hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]";

/* ── Sub-component: one nav column ─────────────────────────────── */
function FooterNavColumn({ section }: { section: FooterNavSection }) {
  return (
    <nav aria-label={section.heading}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span
          aria-hidden
          className="h-4 w-[3px] rounded-full"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        {section.heading}
      </h3>
      <ul className="mt-4 space-y-3">
        {section.links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={inkLink}>
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
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        {/* ── Header row: brand + description + CTA ── */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              {logo ? (
                <span className="flex h-10 items-center rounded-lg bg-white px-2.5 shadow-sm ring-1 ring-border/70">
                  <Image src={logo} alt={tenantName} width={104} height={24} className="h-6 w-auto" />
                </span>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
                  <GraduationCap className="h-5 w-5" />
                </span>
              )}
              <span
                className="text-lg font-extrabold tracking-tight"
                style={{ color: "var(--brand-primary)" }}
              >
                {tenantName}
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              منصة تعليمية عربية متكاملة تضم الطلاب والمعلمين وأولياء الأمور، وتقدّم محتوى
              دراسيًا منظّمًا لكل المراحل الدراسية.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {/* Primary CTA — flips to secondary on hover */}
            <Link
              href="/student/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-primary-contrast)] transition-colors duration-150 hover:bg-[var(--brand-secondary)] hover:text-[var(--brand-secondary-contrast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
            >
              سجّل الآن
            </Link>

            {/* Secondary CTA — gold, flips to primary on hover */}
            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-[var(--brand-secondary)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-secondary-contrast)] transition-colors duration-150 hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-contrast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              تواصل معنا
            </a>
          </div>
        </div>

        {/* ── Middle row: nav columns + contact ── */}
        <div className="mt-12 grid grid-cols-1 gap-10 border-t border-border/70 pt-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          {footerNavSections.map((section) => (
            <div key={section.heading} className="lg:col-span-3">
              <FooterNavColumn section={section} />
            </div>
          ))}

          {/* Contact block */}
          <div className="lg:col-span-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span
                aria-hidden
                className="h-4 w-[3px] rounded-full"
                style={{ backgroundColor: "var(--brand-primary)" }}
              />
              التواصل
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-foreground/70">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-foreground/40" />
                <a href={footerContact.phoneHref} className="transition-colors duration-150 hover:text-[var(--brand-primary)]">
                  {footerContact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-foreground/40" />
                <a href={footerContact.emailHref} className="transition-colors duration-150 hover:text-[var(--brand-primary)]">
                  {footerContact.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-foreground/40" />
                <span>{footerContact.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar: hairline divider, muted legal + social ── */}
        <div className="mt-12 flex flex-col gap-5 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {tenantName}. جميع الحقوق محفوظة.
            <span className="mx-2 opacity-50">|</span>
            <Link href="/marketing/privacy" className="text-muted-foreground transition-colors duration-150 hover:text-[var(--brand-primary)] hover:underline underline-offset-4">
              سياسة الخصوصية
            </Link>
            <span className="mx-2 opacity-50">|</span>
            <Link href="/marketing/terms" className="text-muted-foreground transition-colors duration-150 hover:text-[var(--brand-primary)] hover:underline underline-offset-4">
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
                  className="flex h-9 w-9 items-center justify-center rounded-md text-foreground/50 transition-colors duration-150 hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
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
