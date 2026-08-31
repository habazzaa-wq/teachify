"use client";

import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Facebook, Youtube, Instagram, MessageCircle, Phone, Mail, Clock } from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Platform footer — a warm, flat terracotta (brand primary) close.
 *
 * Colour logic — the two brand colours never blend:
 *   - Primary (#D87B63): the footer's flat solid background.
 *   - Secondary (#FFB50E): column headings and the hover accent colour
 *     that warms every interactive element (links, icons, buttons).
 *
 * Layout is flat and quiet: text columns separated by hairline rules,
 * no cards, no shadows, no gradients. Hover only recolours text.
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

/* ── Column heading: quiet gold uppercase label ─────────────────── */
function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-sm font-semibold tracking-wide"
      style={{ color: "var(--brand-secondary)" }}
    >
      {children}
    </h3>
  );
}

/* ── Column link: text that warms to gold on hover ──────────────── */
const columnLink =
  "inline-flex rounded-sm py-1 text-sm text-white/85 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]";

/* ── Sub-component: one text column of links ────────────────────── */
function FooterLinkColumn({ section }: { section: FooterNavSection }) {
  return (
    <section aria-label={section.heading}>
      <ColumnHeading>{section.heading}</ColumnHeading>
      <ul className="mt-3 space-y-1.5">
        {section.links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={columnLink}>
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        {/* ── Bar: brand identity + primary actions ── */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            {logo ? (
              <span className="flex h-12 items-center rounded-xl bg-white px-3">
                <Image src={logo} alt={tenantName} width={116} height={28} className="h-7 w-auto" />
              </span>
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)]">
                <GraduationCap className="h-6 w-6" />
              </span>
            )}
            <div>
              <p className="text-lg font-bold text-white">{tenantName}</p>
              <p className="text-xs text-white/70">منصة تعليمية عربية متكاملة</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/student/dashboard"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--brand-secondary)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-secondary-contrast)] transition-colors duration-150 hover:bg-white hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] sm:w-auto"
            >
              سجّل الآن
            </Link>
            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-lg bg-white/10 px-6 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition-colors duration-150 hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] sm:w-auto"
            >
              تواصل معنا
            </a>
          </div>
        </div>

        {/* ── Columns: brand blurb + link nav + contact ── */}
        <div className="mt-10 grid grid-cols-1 gap-10 sm:mt-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">
          {/* Brand blurb */}
          <div className="sm:col-span-2 lg:col-span-2 lg:pe-10">
            <ColumnHeading>عن المنصة</ColumnHeading>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
              منصة تعليمية عربية متكاملة تضم الطلاب والمعلمين وأولياء الأمور، وتقدّم محتوى
              دراسيًا منظّمًا لكل المراحل الدراسية.
            </p>
          </div>

          {/* Link nav columns — one per section */}
          {footerNavSections.map((section) => (
            <div
              key={section.heading}
              className="lg:col-span-1 lg:border-s lg:border-white/10 lg:pe-10 lg:ps-8"
            >
              <FooterLinkColumn section={section} />
            </div>
          ))}

          {/* Contact */}
          <div className="sm:col-span-2 lg:col-span-1 lg:border-s lg:border-white/10 lg:ps-8">
            <ColumnHeading>التواصل</ColumnHeading>
            <ul className="mt-3 space-y-1.5">
              <li>
                <a href={footerContact.phoneHref} className={columnLink}>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 opacity-80" />
                    {footerContact.phone}
                  </span>
                </a>
              </li>
              <li>
                <a href={footerContact.emailHref} className={columnLink}>
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 opacity-80" />
                    {footerContact.email}
                  </span>
                </a>
              </li>
              <li className="inline-flex items-start gap-2 py-1 text-sm text-white/85">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
                <span>{footerContact.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar: legal + socials ── */}
        <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-white/70">
            © {year} {tenantName}. جميع الحقوق محفوظة.
            <span className="mx-2 text-white/25">|</span>
            <Link
              href="/marketing/privacy"
              className="inline-flex py-1 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:text-[var(--brand-secondary)]"
            >
              سياسة الخصوصية
            </Link>
            <span className="mx-2 text-white/25">|</span>
            <Link
              href="/marketing/terms"
              className="inline-flex py-1 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:text-[var(--brand-secondary)]"
            >
              شروط الاستخدام
            </Link>
          </p>

          <div className="flex items-center gap-1">
            {footerSocials.map((social) => {
              const Icon = SOCIAL_ICONS[social.label];
              if (!Icon) return null;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  className="inline-flex p-2 text-white/75 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
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
