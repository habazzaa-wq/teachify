"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
 * Concept: a two-color canvas (secondary over primary) with floating rounded
 * cards sitting across the split — a coral identity card, a light navigation
 * card and a gold contact card. The cards carry soft shadows so the color
 * change reads as depth rather than a flat band. Only the two live brand
 * variables are used for the colored surfaces.
 */

const canvas: CSSProperties = {
  background:
    "linear-gradient(to bottom, var(--brand-secondary) 0%, var(--brand-secondary) 50%, var(--brand-primary) 50%, var(--brand-primary) 100%)",
};
const coralCard: CSSProperties = {
  backgroundColor: "var(--brand-primary)",
  color: "var(--brand-primary-contrast)",
};
const goldCard: CSSProperties = {
  backgroundColor: "var(--brand-secondary)",
  color: "var(--brand-secondary-contrast)",
};
const lightCard: CSSProperties = {
  backgroundColor: "#fffdfa",
  color: "#2a201d",
};
const coralAccent: CSSProperties = { color: "var(--brand-primary)" };
const goldAccent: CSSProperties = { color: "var(--brand-secondary)" };
const coralDivider: CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--brand-secondary) 70%, transparent)",
};
const neutralDivider: CSSProperties = {
  backgroundColor: "color-mix(in srgb, #2a201d 12%, transparent)",
};
const cardRadius = "rounded-[22px]";
const cardBase = `${cardRadius} p-5 shadow-soft-lg ring-1 ring-black/5`;

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
    <div className="flex items-center gap-3.5">
      {logo && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={tenantName} onError={() => setFailed(true)} className="h-10 w-10 shrink-0 object-contain" />
      )}
      <h2 className="min-w-0 font-display text-[24px] font-bold leading-tight">{tenantName}</h2>
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
      <h3 className="flex items-center gap-2 text-[12px] font-bold">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={coralAccent} />
        {group.heading}
      </h3>
      <ul className="mt-3 space-y-1.5">
        {group.links.map((link) => {
          const key = `${group.heading}-${link.label}-${link.href}`;
          const resolved = link.href.trim() !== "" ? link.href : whatsappUrl || routes.community;
          const className =
            "inline-block text-[13px] leading-5 transition-colors duration-150 hover:text-[color:var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]";

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
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const Icon = row.Icon;
        const body = (
          <>
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={coralAccent} aria-hidden="true" />
            <span className="min-w-0 text-[12px] leading-5">{row.value}</span>
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
                className="flex min-w-0 items-start gap-2.5 rounded-sm transition-opacity duration-150 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
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
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {entries.map((entry) => {
        const Icon = entry.Icon;
        const href = socials[entry.key];
        return (
          <li key={entry.key}>
            <a
              href={href}
              {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={guard}
              className="inline-flex items-center gap-2 text-[12px] font-bold transition-opacity duration-150 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <Icon className="h-4 w-4" style={goldAccent} aria-hidden="true" />
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
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold transition-opacity duration-150 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      <span>أعلى الصفحة</span>
      <ArrowLeft className="h-3.5 w-3.5 rotate-90" aria-hidden="true" />
    </button>
  );
}

function Colophon({
  year,
  tenantName,
  preview,
}: {
  year: number;
  tenantName: string;
  preview?: boolean;
}) {
  const guard = (event: MouseEvent<HTMLElement>) => {
    if (preview) event.preventDefault();
  };

  return (
    <div className="flex flex-col justify-center gap-2 px-1 text-[11px] text-[color:var(--brand-primary-contrast)] lg:col-span-7">
      <p className="opacity-85">© {year} {tenantName}. جميع الحقوق محفوظة.</p>
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
    <footer dir="rtl" className={className}>
      <div className="relative overflow-hidden">
        {/* two-color canvas */}
        <div aria-hidden="true" className="absolute inset-0" style={canvas} />

        <div
          className={
            preview
              ? "relative mx-auto w-full max-w-[1200px] px-5 py-7 sm:px-6"
              : "relative mx-auto w-full max-w-[1200px] px-5 py-7 sm:px-8 lg:px-12"
          }
        >
          <div className="grid gap-4 lg:grid-cols-12">
            {/* identity card — primary surface */}
            <section className={`${cardBase} lg:col-span-5`} style={coralCard}>
              <BrandMark key={logo ?? "fallback"} logo={logo} tenantName={tenantName} />
              <p className="mt-3 text-[12px] font-bold opacity-90">{settings.tagline}</p>
              <div aria-hidden="true" className="my-3.5 h-px w-full" style={coralDivider} />
              <p className="max-w-sm text-[13px] leading-6 opacity-90">{settings.aboutText}</p>
              <div aria-hidden="true" className="my-3.5 h-px w-full" style={coralDivider} />
              <SocialLinks socials={settings.socials} guard={guard} />
            </section>

            {/* navigation card — light surface */}
            <nav aria-label="روابط الفوتر" className={`${cardBase} lg:col-span-7`} style={lightCard}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {settings.groups.map((group) => (
                  <LinkGroup
                    key={`${group.heading}-${group.links.length}`}
                    group={group}
                    whatsappUrl={whatsappUrl}
                    guard={guard}
                  />
                ))}
              </div>
            </nav>

            {/* contact card — secondary surface */}
            <section className={`${cardBase} lg:col-span-5`} style={goldCard}>
              <h3 className="mb-3.5 flex items-center gap-2 text-[12px] font-bold">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={coralAccent} />
                تواصل معنا
              </h3>
              <ContactList contact={settings.contact} guard={guard} />
              <div aria-hidden="true" className="my-3.5 h-px w-full" style={neutralDivider} />
              <a
                href={whatsappUrl || (settings.contact.email ? `mailto:${settings.contact.email}` : routes.community)}
                {...(whatsappUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={guard}
                className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[12px] font-bold transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                style={coralCard}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                راسلنا الآن
              </a>
            </section>

            <Colophon year={year} tenantName={tenantName} preview={preview} />
          </div>
        </div>
      </div>
    </footer>
  );
}
