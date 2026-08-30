"use client";

import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Facebook, Youtube, Instagram, MessageCircle } from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Platform footer — quiet, editorial, functional.
 *
 * Color rule (strict): the two brand colors never mix.
 *   - Primary (#D87B63) : hover/active state for text links and social icons.
 *   - Secondary (#FFB50E): exactly one element — the small "تواصل معنا" button.
 *   - Everything else is neutral and adapts to light/dark by inverting
 *     neutrals only; the brand-color rule is unchanged in both modes.
 */

const DEVELOPER_WHATSAPP = "https://wa.me/201011245565";

/* ── Types ─────────────────────────────────────────────────────── */
export type FooterLink = { label: string; href: string };
export type FooterNavSection = { heading: string; links: FooterLink[] };
export type FooterContact = { phone: string; email: string };
export type FooterSocial = { label: string; href: string };

/* ── Content (data-driven) ─────────────────────────────────────── */

/** Educational stages a parent/student would actually look for. */
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

export const footerContact: FooterContact = {
  phone: "+20 10 1124 5565",
  email: "hello@academy.example",
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

/* ── Sub-component: one nav column ─────────────────────────────── */

function FooterNavSectionBlock({ section }: { section: FooterNavSection }) {
  return (
    <nav aria-label={section.heading}>
      <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
      <ul className="mt-4 space-y-2.5">
        {section.links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm font-normal text-muted-foreground transition-colors duration-150 hover:text-[var(--brand-primary)] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
            >
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
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        {/* ── Top: logo + description ── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2.5">
              {logo ? (
                <span className="flex h-9 items-center rounded-md bg-white px-2 shadow-sm ring-1 ring-border">
                  <Image src={logo} alt={tenantName} width={96} height={22} className="h-6 w-auto" />
                </span>
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background">
                  <GraduationCap className="h-5 w-5" />
                </span>
              )}
              <span className="text-base font-bold text-foreground">{tenantName}</span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              منصة تعليمية عربية متكاملة تضم الطلاب والمعلمين وأولياء الأمور، وتقدّم محتوى
              دراسيًا منظّمًا لكل المراحل الدراسية.
            </p>

            {/* The single secondary-color moment: one small CTA button */}
            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
              style={{
                backgroundColor: "var(--brand-secondary)",
                color: "var(--brand-secondary-contrast)",
              }}
            >
              تواصل معنا
            </a>
          </div>

          {/* ── Navigation columns ── */}
          {footerNavSections.map((section) => (
            <div key={section.heading} className="lg:col-span-2">
              <FooterNavSectionBlock section={section} />
            </div>
          ))}

          {/* ── Contact block ── */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-foreground">التواصل</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href={`tel:${footerContact.phone.replace(/[^0-9+]/g, "")}`} className="transition-colors duration-150 hover:text-[var(--brand-primary)]">
                  {footerContact.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${footerContact.email}`} className="transition-colors duration-150 hover:text-[var(--brand-primary)]">
                  {footerContact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar: hairline divider, muted legal + social ── */}
        <div className="mt-12 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
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
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
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
