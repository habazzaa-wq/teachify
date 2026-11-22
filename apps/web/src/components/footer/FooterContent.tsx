"use client";

import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUp,
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
import { toWhatsAppUrl, type FooterLink, type FooterLinkGroup, type FooterSettings } from "@/features/footer/types";

/**
 * Presentational footer shared by the public storefront and the dashboard
 * editor preview. It reads the live brand variables from the theme, so both
 * surfaces re-skin together when the tenant changes its branding.
 *
 * Muted/hairline values are exposed as local CSS variables instead of inline
 * colors so hover utilities can still override them.
 */

const footerStyle = {
  borderTop: "3px solid var(--brand-primary)",
  backgroundColor: "color-mix(in srgb, var(--brand-primary) 5%, var(--paper))",
  color: "var(--ink)",
  "--footer-muted": "color-mix(in srgb, var(--ink) 64%, transparent)",
  "--footer-subtle": "color-mix(in srgb, var(--ink) 48%, transparent)",
  "--footer-hairline": "color-mix(in srgb, var(--ink) 12%, transparent)",
  "--footer-accent-soft": "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
  "--footer-accent-border": "color-mix(in srgb, var(--brand-primary) 28%, transparent)",
} as CSSProperties;

const accentSurfaceStyle: CSSProperties = {
  backgroundColor: "var(--footer-accent-soft)",
  color: "var(--brand-primary-deep)",
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

  if (!logo || failed) {
    return (
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:var(--footer-accent-border)]"
        style={accentSurfaceStyle}
      >
        <GraduationCap className="h-6 w-6" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-white p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={tenantName}
        onError={() => setFailed(true)}
        className="max-h-full max-w-full object-contain"
      />
    </span>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden="true" className="h-px w-5 shrink-0 bg-[var(--brand-primary)]" />
      <h3 className="text-[13px] font-bold leading-none">{children}</h3>
    </div>
  );
}

function LinkList({
  group,
  whatsappUrl,
  guard,
}: {
  group: FooterLinkGroup;
  whatsappUrl: string;
  guard: (event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <div>
      <SectionHeading>{group.heading}</SectionHeading>
      <ul className="mt-4 space-y-2.5">
        {group.links.map((link: FooterLink) => {
          const key = `${group.heading}-${link.label}-${link.href}`;
          const resolved = link.href.trim() !== "" ? link.href : whatsappUrl || routes.community;
          const className =
            "inline-block text-sm leading-6 text-[color:var(--footer-muted)] transition-colors duration-150 hover:text-[color:var(--brand-primary-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]";

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
    </div>
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--footer-hairline)] text-[color:var(--footer-muted)] transition-colors duration-200 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[color:var(--brand-primary-contrast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
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
    rows.push({
      label: "اتصل بنا",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, "")}`,
      Icon: Phone,
    });
  }
  if (contact.email?.trim()) {
    rows.push({ label: "راسلنا", value: contact.email, href: `mailto:${contact.email}`, Icon: Mail });
  }
  if (contact.hours?.trim()) {
    rows.push({ label: "ساعات العمل", value: contact.hours, href: null, Icon: Clock });
  }
  const whatsapp = toWhatsAppUrl(contact.whatsapp ?? "");
  if (whatsapp) {
    rows.push({
      label: "واتساب",
      value: contact.whatsapp,
      href: whatsapp,
      isExternal: true,
      Icon: MessageCircle,
    });
  }

  return rows;
}

function ContactStrip({
  contact,
  guard,
  preview = false,
}: {
  contact: FooterSettings["contact"];
  guard: (event: MouseEvent<HTMLElement>) => void;
  preview?: boolean;
}) {
  const rows = buildContactRows(contact);
  if (rows.length === 0) return null;

  return (
    <div className="mt-12 border-t border-[color:var(--footer-hairline)] pt-7">
      <ul className={preview ? "grid grid-cols-1 gap-y-5 sm:grid-cols-2" : "grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4"}>
        {rows.map((row) => {
          const Icon = row.Icon;
          const content = (
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold text-[color:var(--footer-subtle)]">
                {row.label}
              </span>
              <span className="mt-1 block truncate text-sm font-medium leading-6">{row.value}</span>
            </div>
          );

          return (
            <li key={row.label} className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={accentSurfaceStyle}
              >
                <Icon className="h-4 w-4" />
              </span>
              {row.href ? (
                <a
                  href={row.href}
                  {...(row.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={guard}
                  className="min-w-0 rounded-md transition-colors duration-150 hover:text-[color:var(--brand-primary-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
                >
                  {content}
                </a>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BackToTop({ preview }: { preview?: boolean }) {
  const scrollToTop = () => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={preview ? undefined : scrollToTop}
      title="العودة للأعلى"
      aria-label="العودة للأعلى"
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[color:var(--footer-muted)] transition-colors duration-150 hover:text-[color:var(--brand-primary-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
    >
      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
      <span>أعلى الصفحة</span>
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
    <footer dir="rtl" className={className} style={footerStyle}>
      <div
        className={
          preview
            ? "mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-6"
            : "mx-auto w-full max-w-[1200px] px-5 py-12 sm:px-8 lg:px-10 lg:py-14"
        }
      >
        <div className={preview ? "grid gap-8" : "grid gap-11 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.6fr)] lg:gap-14"}>
          <section className="min-w-0">
            <div className="flex items-center gap-3">
              <BrandMark key={logo ?? "fallback"} logo={logo} tenantName={tenantName} />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold leading-tight">{tenantName}</p>
                <p className="mt-1 text-xs text-[color:var(--footer-muted)]">{settings.tagline}</p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-[color:var(--footer-muted)]">
              {settings.aboutText}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={routes.studentDashboard}
                onClick={guard}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
                style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
              >
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                سجّل الآن
              </Link>
              <a
                href={secondaryHref}
                {...(whatsappUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={guard}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[color:var(--footer-hairline)] px-5 text-sm font-semibold text-[color:var(--ink)] transition-colors duration-150 hover:border-[var(--brand-secondary)] hover:text-[color:var(--brand-secondary-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
              >
                تواصل معنا
              </a>
            </div>

            <div className="mt-7">
              <SocialLinks socials={settings.socials} guard={guard} />
            </div>
          </section>

          <nav aria-label="روابط الفوتر" className="min-w-0">
            <div className={preview ? "grid grid-cols-2 gap-6" : "grid gap-8 sm:grid-cols-2 lg:grid-cols-3"}>
              {settings.groups.map((group) => (
                <LinkList key={`${group.heading}-${group.links.length}`} group={group} whatsappUrl={whatsappUrl} guard={guard} />
              ))}
            </div>
          </nav>
        </div>

        <ContactStrip contact={settings.contact} guard={guard} preview={preview} />

        <div
          className={
            preview
              ? "mt-8 flex flex-col gap-4 border-t border-[color:var(--footer-hairline)] pt-6"
              : "mt-8 flex flex-col gap-4 border-t border-[color:var(--footer-hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between"
          }
        >
          <p className="text-xs leading-relaxed text-[color:var(--footer-subtle)]">
            © {year} {tenantName}. جميع الحقوق محفوظة.
          </p>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
            <Link
              href={routes.publicPrivacy}
              onClick={guard}
              className="inline-flex px-2 py-1 text-xs text-[color:var(--footer-muted)] transition-colors duration-150 hover:text-[color:var(--brand-primary-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
            >
              سياسة الخصوصية
            </Link>
            <span aria-hidden="true" className="text-[color:var(--footer-subtle)]">
              ·
            </span>
            <Link
              href={routes.publicTerms}
              onClick={guard}
              className="inline-flex px-2 py-1 text-xs text-[color:var(--footer-muted)] transition-colors duration-150 hover:text-[color:var(--brand-primary-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
            >
              شروط الاستخدام
            </Link>
            <span aria-hidden="true" className="mx-2 h-4 w-px bg-[color:var(--footer-hairline)]" />
            <BackToTop preview={preview} />
          </div>
        </div>
      </div>
    </footer>
  );
}
