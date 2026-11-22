"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Facebook,
  GraduationCap,
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
 * The surface is the tenant's own primary color, with the secondary color used
 * for the accent rule, headings, the contact icon and the bottom band. Both
 * come from the live brand variables, so changing branding updates the footer
 * instantly. Deliberately compact — no decoration, no oversized type.
 */

const dividerStyle: CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--brand-primary-contrast) 24%, transparent)",
};
const mutedStyle: CSSProperties = {
  color: "color-mix(in srgb, var(--brand-primary-contrast) 82%, transparent)",
};
const socialTileStyle: CSSProperties = {
  borderColor: "color-mix(in srgb, var(--brand-primary-contrast) 32%, transparent)",
};
const ctaStyle: CSSProperties = {
  backgroundColor: "var(--brand-secondary)",
  color: "var(--brand-secondary-contrast)",
};

export interface FooterContentProps {
  settings: FooterSettings;
  tenantName: string;
  logo: string | null;
  year?: number;
  /** Preview mode keeps the exact markup but blocks navigation and scrolling. */
  preview?: boolean;
  className?: string;
}

function BrandMark({ logo, tenantName }: { logo: string | null; tenantName: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/30 bg-white/10 p-1.5"
      aria-hidden="true"
    >
      {!logo || failed ? (
        <GraduationCap className="h-5 w-5 text-[color:var(--brand-secondary)]" aria-hidden="true" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={tenantName} onError={() => setFailed(true)} className="max-h-full max-w-full object-contain" />
      )}
    </span>
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
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--brand-secondary)]">
        {group.heading}
      </h3>
      <ul className="mt-3 space-y-2">
        {group.links.map((link) => {
          const key = `${group.heading}-${link.label}-${link.href}`;
          const resolved = link.href.trim() !== "" ? link.href : whatsappUrl || routes.community;
          const className =
            "inline-block text-[13px] leading-5 text-[color:var(--brand-primary-contrast)] transition-opacity duration-150 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]";

          if (resolved.startsWith("http")) {
            return (
              <li key={key}>
                <a href={resolved} target="_blank" rel="noopener noreferrer" onClick={guard} className={className}>
                  {link.label}
                </a>
              </li>
            );
          }
          return (
            <li key={key}>
              <Link href={resolved} onClick={guard} className={className}>
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
  if (rows.length === 0) return null;

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const Icon = row.Icon;
        const body = (
          <>
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-secondary)]" aria-hidden="true" />
            <span className="min-w-0 truncate text-[13px] leading-5" title={row.label}>
              {row.value}
            </span>
          </>
        );

        return (
          <li key={row.label} className="flex items-start gap-2.5">
            {row.href ? (
              <a
                href={row.href}
                {...(row.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={guard}
                aria-label={row.label}
                className="flex min-w-0 items-start gap-2.5 rounded-sm transition-colors duration-150 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
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

function SocialIcons({
  socials,
  guard,
}: {
  socials: FooterSettings["socials"];
  guard: (event: MouseEvent<HTMLElement>) => void;
}) {
  const entries = SOCIAL_ENTRIES.filter((entry) => socials[entry.key]?.trim() !== "");
  if (entries.length === 0) return null;

  return (
    <ul className="flex items-center gap-2">
      {entries.map((entry) => {
        const Icon = entry.Icon;
        const href = socials[entry.key];
        return (
          <li key={entry.key}>
            <a
              href={href}
              {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={guard}
              aria-label={entry.label}
              title={entry.label}
              className="flex h-8 w-8 items-center justify-center border transition-colors duration-150 hover:border-[color:var(--brand-secondary)] hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
              style={socialTileStyle}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
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
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold transition-opacity duration-150 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      <span>أعلى الصفحة</span>
      <ArrowLeft className="h-3.5 w-3.5 rotate-90" aria-hidden="true" />
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
  const secondaryHref =
    whatsappUrl || (settings.contact.email ? `mailto:${settings.contact.email}` : routes.community);

  return (
    <footer
      dir="rtl"
      className={className}
      style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
    >
      <div aria-hidden="true" className="h-1 w-full bg-[color:var(--brand-secondary)]" />

      <div
        className={
          preview
            ? "mx-auto w-full max-w-[1120px] px-5 py-7 sm:px-6"
            : "mx-auto w-full max-w-[1120px] px-5 py-10 sm:px-8 lg:px-10"
        }
      >
        {/* Brand + primary action */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark key={logo ?? "fallback"} logo={logo} tenantName={tenantName} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold leading-tight">{tenantName}</p>
              <p className="mt-0.5 truncate text-[11px]" style={mutedStyle}>
                {settings.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={secondaryHref}
              {...(whatsappUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={guard}
              className="inline-flex h-9 items-center justify-center px-5 text-[13px] font-bold transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              style={ctaStyle}
            >
              تواصل معنا
            </a>
            <SocialIcons socials={settings.socials} guard={guard} />
          </div>
        </div>

        <div aria-hidden="true" className={`${preview ? "my-6" : "my-8"} h-px w-full`} style={dividerStyle} />

        {/* Links + contact */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] md:gap-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {settings.groups.map((group) => (
              <LinkGroup
                key={`${group.heading}-${group.links.length}`}
                group={group}
                whatsappUrl={whatsappUrl}
                guard={guard}
              />
            ))}
          </div>
          <ContactList contact={settings.contact} guard={guard} />
        </div>
      </div>

      {/* Secondary-color band */}
      <div
        className="py-3.5"
        style={{ backgroundColor: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }}
      >
        <div
          className={
            preview
              ? "mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-5 text-[11px] sm:px-6 sm:flex-row sm:items-center sm:justify-between"
              : "mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-5 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"
          }
        >
          <p>© {year} {tenantName}. جميع الحقوق محفوظة.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link
              href={routes.publicPrivacy}
              onClick={guard}
              className="underline underline-offset-2 transition-opacity duration-150 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              سياسة الخصوصية
            </Link>
            <Link
              href={routes.publicTerms}
              onClick={guard}
              className="underline underline-offset-2 transition-opacity duration-150 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
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
