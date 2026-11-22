"use client";

import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
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
 * Style: a two-tone brand footer. A short gold call-to-action strip leads into
 * the main primary-color body, finished with a deeper primary colophon. The
 * secondary color appears as a rule, a dash beside each heading and as icons —
 * never as low-contrast body text. All colors resolve from live brand vars.
 */

const softRule: CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--brand-primary-contrast) 26%, transparent)",
};
const softText: CSSProperties = {
  color: "color-mix(in srgb, var(--brand-primary-contrast) 82%, transparent)",
};
const socialTile: CSSProperties = {
  borderColor: "color-mix(in srgb, var(--brand-primary-contrast) 35%, transparent)",
};
const colophon: CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--brand-primary) 78%, #140d0a)",
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
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/30 bg-white/10 p-1.5"
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

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2.5 text-xs font-bold text-[color:var(--brand-primary-contrast)]">
      <span aria-hidden="true" className="h-0.5 w-4 shrink-0 bg-[color:var(--brand-secondary)]" />
      {children}
    </h3>
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
      <Heading>{group.heading}</Heading>
      <ul className="mt-4 space-y-2.5">
        {group.links.map((link) => {
          const key = `${group.heading}-${link.label}-${link.href}`;
          const resolved = link.href.trim() !== "" ? link.href : whatsappUrl || routes.community;
          const className =
            "group inline-flex items-center gap-2 text-[13px] leading-5 text-[color:var(--brand-primary-contrast)] transition-colors duration-150 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]";

          const content = (
            <>
              <span aria-hidden="true" className="inline-block h-1 w-1 shrink-0 bg-[color:var(--brand-secondary)] opacity-60" />
              {link.label}
            </>
          );

          if (resolved.startsWith("http")) {
            return (
              <li key={key}>
                <a href={resolved} target="_blank" rel="noopener noreferrer" onClick={guard} className={className}>
                  {content}
                </a>
              </li>
            );
          }
          return (
            <li key={key}>
              <Link href={resolved} onClick={guard} className={className}>
                {content}
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

function ContactStrip({ contact, guard }: { contact: FooterSettings["contact"]; guard: (event: MouseEvent<HTMLElement>) => void }) {
  const rows = buildContactRows(contact);
  if (rows.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {rows.map((row, index) => {
        const Icon = row.Icon;
        const body = (
          <>
            <Icon className="h-3.5 w-3.5 shrink-0 text-[color:var(--brand-secondary)]" aria-hidden="true" />
            <span className="text-[12px] leading-5">{row.value}</span>
          </>
        );

        return (
          <li
            key={row.label}
            className={`flex items-center gap-2 ${index > 0 ? "border-r border-white/25 pr-6" : ""}`}
          >
            {row.href ? (
              <a
                href={row.href}
                {...(row.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={guard}
                aria-label={row.label}
                className="flex items-center gap-2 rounded-sm transition-colors duration-150 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
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
              className="flex h-9 w-9 items-center justify-center border transition-colors duration-150 hover:border-[color:var(--brand-secondary)] hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
              style={socialTile}
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
      {/* Gold call-to-action strip */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }}
      >
        <div
          className={
            preview
              ? "relative mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-5 py-6 sm:px-6 sm:flex-row sm:items-center sm:justify-between"
              : "relative mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-5 py-8 sm:px-8 sm:flex-row sm:items-center sm:justify-between lg:px-10"
          }
        >
          <div className="relative z-10">
            <p className="text-[10px] font-bold tracking-[0.2em] opacity-70">ابدأ من هنا</p>
            <h2 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-[28px]">
              جاهز تبدأ رحلتك؟
            </h2>
            <p className="mt-1 text-[13px] leading-6 opacity-80">
              دورات، امتحانات، وشهادات — كلها في مكان واحد.
            </p>
          </div>
          <Link
            href={routes.studentDashboard}
            onClick={guard}
            className="relative z-10 inline-flex h-11 shrink-0 items-center justify-center gap-3 px-6 text-sm font-bold transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
          >
            سجّل الآن
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Main body */}
      <div
        className={
          preview
            ? "mx-auto w-full max-w-[1120px] px-5 py-7 sm:px-6"
            : "mx-auto w-full max-w-[1120px] px-5 py-10 sm:px-8 lg:px-10"
        }
      >
        <div className="grid gap-9 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.7fr)] md:gap-12 lg:gap-16">
          {/* Identity */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <BrandMark key={logo ?? "fallback"} logo={logo} tenantName={tenantName} />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold leading-tight">{tenantName}</p>
                <p className="mt-0.5 truncate text-[11px]" style={softText}>
                  {settings.tagline}
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-xs text-[13px] leading-6" style={softText}>
              {settings.aboutText}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <SocialIcons socials={settings.socials} guard={guard} />
              <a
                href={secondaryHref}
                {...(whatsappUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={guard}
                className="inline-flex h-9 items-center px-4 text-xs font-bold transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                style={{ border: "1px solid var(--brand-secondary)" }}
              >
                تواصل معنا
              </a>
            </div>
          </div>

          {/* Link groups */}
          <nav aria-label="روابط الفوتر" className="grid grid-cols-2 gap-7 sm:grid-cols-3">
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

        <div aria-hidden="true" className={`${preview ? "my-6" : "my-8"} h-px w-full`} style={softRule} />
        <ContactStrip contact={settings.contact} guard={guard} />
      </div>

      {/* Colophon */}
      <div className="py-4" style={colophon}>
        <div
          className={
            preview
              ? "mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-5 text-[11px] sm:px-6 sm:flex-row sm:items-center sm:justify-between"
              : "mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-5 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"
          }
        >
          <p className="opacity-80">© {year} {tenantName}. جميع الحقوق محفوظة.</p>
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
