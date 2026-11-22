"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { routes } from "@/constants/routes";
import { toWhatsAppUrl, type FooterLinkGroup, type FooterSettings } from "@/features/footer/types";

/**
 * Presentational footer shared by the public storefront and the dashboard
 * editor preview.
 *
 * Design language (read from globals.css / tailwind.config.ts):
 *  - surfaces: only --brand-primary and --brand-secondary, each a solid field
 *    with a hard edge between them — no gradients or blended backgrounds
 *  - type: font-display for the wordmark, tracked micro-labels for hierarchy
 *  - structure: asymmetric two-part masthead + a ruled, uneven navigation
 *    ledger, followed by a separate secondary copyright band
 *  - detail: hairline separators, an animated underline on interactive text,
 *    and a small arrow lift on back-to-top
 */

const onPrimaryMuted: CSSProperties = {
  color: "color-mix(in srgb, var(--brand-primary-contrast) 72%, transparent)",
};
const onPrimaryRule: CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--brand-primary-contrast) 22%, transparent)",
};
const secondaryInk: CSSProperties = { color: "var(--brand-secondary)" };
const secondaryRule: CSSProperties = { backgroundColor: "var(--brand-secondary)" };

const microLabel =
  "text-[10px] font-bold tracking-[0.22em]";
const animatedLink =
  "relative inline-block text-[13px] leading-6 transition-colors duration-200 " +
  "hover:text-[color:var(--brand-primary-contrast)] focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[var(--brand-primary-contrast)] " +
  "after:absolute after:bottom-0 after:right-0 after:h-px after:w-full after:origin-right " +
  "after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100";

export interface FooterContentProps {
  settings: FooterSettings;
  tenantName: string;
  logo: string | null;
  year?: number;
  /** Preview mode keeps the exact markup but blocks navigation and scrolling. */
  preview?: boolean;
  className?: string;
}

function Wordmark({ logo, tenantName }: { logo: string | null; tenantName: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex items-center gap-4">
      {logo && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={tenantName}
          onError={() => setFailed(true)}
          className="h-9 w-9 shrink-0 object-contain"
        />
      )}
      <h2 className="font-display text-[38px] font-bold leading-none tracking-tight sm:text-[50px] lg:text-[56px]">
        {tenantName}
      </h2>
    </div>
  );
}

function LinkGroup({
  group,
  whatsappUrl,
  guard,
}: {
  group: FooterLinkGroup;
  whatsappUrl: string;
  guard: (event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <nav aria-label={group.heading}>
      <div aria-hidden="true" className="mb-4 h-0.5 w-7" style={secondaryRule} />
      <h3 className={`${microLabel} text-[color:var(--brand-primary-contrast)]`}>{group.heading}</h3>
      <ul className="mt-4 space-y-1.5">
        {group.links.map((link) => {
          const key = `${group.heading}-${link.label}-${link.href}`;
          const resolved = link.href.trim() !== "" ? link.href : whatsappUrl || routes.community;

          if (resolved.startsWith("http")) {
            return (
              <li key={key}>
                <a href={resolved} target="_blank" rel="noopener noreferrer" onClick={guard} className={animatedLink}>
                  {link.label}
                </a>
              </li>
            );
          }
          return (
            <li key={key}>
              <Link href={resolved} onClick={guard} className={animatedLink}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type ContactRow = {
  label: string;
  value: string;
  href: string | null;
  isExternal?: boolean;
  Icon: LucideIcon;
};

function buildContactRows(contact: FooterSettings["contact"]): ContactRow[] {
  const rows: ContactRow[] = [];
  if (contact.phone?.trim()) {
    rows.push({ label: "اتصل بنا", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}`, Icon: Phone });
  }
  if (contact.email?.trim()) {
    rows.push({ label: "راسلنا", value: contact.email, href: `mailto:${contact.email}`, Icon: Mail });
  }
  if (contact.hours?.trim()) {
    rows.push({ label: "ساعات العمل", value: contact.hours, href: null, Icon: Clock });
  }
  const whatsapp = toWhatsAppUrl(contact.whatsapp ?? "");
  if (whatsapp) {
    rows.push({ label: "واتساب", value: contact.whatsapp, href: whatsapp, isExternal: true, Icon: MessageCircle });
  }
  return rows;
}

function ContactList({ contact, guard }: { contact: FooterSettings["contact"]; guard: (event: MouseEvent<HTMLElement>) => void }) {
  const rows = buildContactRows(contact);

  return (
    <ul className="mt-5 space-y-4">
      {rows.map((row) => {
        const Icon = row.Icon;
        const body = (
          <>
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={secondaryInk} aria-hidden="true" />
            <span className="min-w-0 text-[13px] leading-5">{row.value}</span>
          </>
        );

        return (
          <li key={row.label} className="flex items-start gap-3">
            {row.href ? (
              <a
                href={row.href}
                {...(row.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={guard}
                aria-label={row.label}
                className="flex min-w-0 items-start gap-3 rounded-sm transition-opacity duration-200 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
              >
                {body}
              </a>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}

const SOCIAL_ENTRIES: {
  key: "facebook" | "youtube" | "instagram" | "whatsapp";
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: "facebook", label: "فيسبوك", Icon: Facebook },
  { key: "youtube", label: "يوتيوب", Icon: Youtube },
  { key: "instagram", label: "انستغرام", Icon: Instagram },
  { key: "whatsapp", label: "واتساب", Icon: MessageCircle },
];

function SocialLinks({
  socials,
  guard,
}: {
  socials: FooterSettings["socials"];
  guard: (event: MouseEvent<HTMLElement>) => void;
}) {
  const entries = SOCIAL_ENTRIES.filter((entry) => socials[entry.key]?.trim() !== "");
  if (entries.length === 0) return null;

  return (
    <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
      {entries.map((entry) => {
        const Icon = entry.Icon;
        const href = socials[entry.key];
        return (
          <li key={entry.key}>
            <a
              href={href}
              {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={guard}
              className="group inline-flex items-center gap-2 text-[11px] font-bold tracking-wide transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary-contrast)]"
            >
              <Icon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" style={secondaryInk} aria-hidden="true" />
              {entry.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function BackToTop({ preview }: { preview?: boolean }) {
  const scrollToTop = () => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={preview ? undefined : scrollToTop}
      title="العودة للأعلى"
      aria-label="العودة للأعلى"
      className="group inline-flex items-center gap-1.5 text-[11px] font-bold transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      <span>أعلى الصفحة</span>
      <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
    </button>
  );
}

export function FooterContent({
  settings,
  tenantName,
  logo,
  year = new Date().getFullYear(),
  preview = false,
  className,
}: FooterContentProps) {
  const guard = (event: MouseEvent<HTMLElement>) => {
    if (preview) event.preventDefault();
  };

  const whatsappUrl = toWhatsAppUrl(settings.contact.whatsapp);

  return (
    <footer
      dir="rtl"
      className={className}
      style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
    >
      {/* single secondary accent rule — a solid line, not a gradient */}
      <div aria-hidden="true" className="h-[3px] w-full" style={secondaryRule} />

      <div
        className={
          preview
            ? "mx-auto w-full max-w-[1180px] px-5 pb-10 pt-10 sm:px-7"
            : "mx-auto w-full max-w-[1180px] px-5 pb-12 pt-12 sm:px-8 lg:px-10 lg:pb-14 lg:pt-14"
        }
      >
        {/* asymmetric masthead: wide identity, narrow contact set lower */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] lg:gap-20">
          <div className="min-w-0">
            <p className={microLabel} style={onPrimaryMuted}>
              {settings.tagline}
            </p>
            <div className="mt-4">
              <Wordmark logo={logo} tenantName={tenantName} />
            </div>
            <p className="mt-5 max-w-md text-[13px] leading-6" style={onPrimaryMuted}>
              {settings.aboutText}
            </p>
            <SocialLinks socials={settings.socials} guard={guard} />
          </div>

          <div className="min-w-0 lg:pt-10">
            <p className={microLabel} style={onPrimaryMuted}>
              تواصل معنا
            </p>
            <ContactList contact={settings.contact} guard={guard} />
          </div>
        </div>

        {/* hairline separator */}
        <div aria-hidden="true" className={`${preview ? "my-8" : "my-10"} h-px w-full`} style={onPrimaryRule} />

        {/* uneven navigation ledger */}
        <nav
          aria-label="روابط الفوتر"
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-12"
        >
          {settings.groups.map((group) => (
            <LinkGroup
              key={`${group.heading}-${group.links.length}`}
              group={group}
              whatsappUrl={whatsappUrl}
              guard={guard}
            />
          ))}
        </nav>
      </div>

      {/* independent secondary field — hard edge, no blend */}
      <div
        className="py-4"
        style={{ backgroundColor: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }}
      >
        <div
          className={
            preview
              ? "mx-auto flex w-full max-w-[1180px] flex-col gap-2 px-5 text-[11px] sm:px-7 sm:flex-row sm:items-center sm:justify-between"
              : "mx-auto flex w-full max-w-[1180px] flex-col gap-2 px-5 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"
          }
        >
          <p className="font-semibold">© {year} {tenantName}. جميع الحقوق محفوظة.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href={routes.publicPrivacy}
              onClick={guard}
              className="underline underline-offset-2 transition-opacity duration-200 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              سياسة الخصوصية
            </Link>
            <Link
              href={routes.publicTerms}
              onClick={guard}
              className="underline underline-offset-2 transition-opacity duration-200 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              شروط الاستخدام
            </Link>
            <BackToTop preview={preview} />
          </div>
        </div>
      </div>
    </footer>
  );
}
