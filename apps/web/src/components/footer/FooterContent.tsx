"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  Facebook,
  Instagram,
  MessageCircle,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { routes } from "@/constants/routes";
import { toWhatsAppUrl, type FooterLinkGroup, type FooterSettings } from "@/features/footer/types";

/**
 * THE CONTROL ROOM — a modular footer built from independent, hard-edged
 * zones rather than columns of cards.
 *
 * Color roles (read from globals.css; no invented colors or gradients):
 *   --brand-primary          identity / navigation / legal fields
 *   --brand-secondary        contact / network fields
 *   --brand-*-contrast       ink for each field
 *
 * Each zone owns exactly one solid background. Structure comes from 1px rules,
 * module indices and alignment — never from shadows, glass or decoration.
 * Motion is transform/opacity only, revealed once, and disabled for reduced
 * motion.
 */

const CONTROL_CSS = `
.cr-reveal { transition: opacity 600ms cubic-bezier(.22,1,.36,1), transform 600ms cubic-bezier(.22,1,.36,1); }
[data-motion="ready"]:not([data-revealed="true"]) .cr-reveal { opacity: 0; transform: translateY(14px); }
.cr-link { position: relative; display: inline-block; transition: opacity 220ms ease; }
.cr-link::after { content: ""; position: absolute; right: 0; bottom: -2px; width: 100%; height: 1px; background: currentColor; transform: scaleX(0); transform-origin: right center; transition: transform 320ms cubic-bezier(.22,1,.36,1); }
.cr-link:hover::after, .cr-link:focus-visible::after { transform: scaleX(1); }
.cr-group { border-color: color-mix(in srgb, var(--brand-primary-contrast) 18%, transparent); transition: border-color 260ms ease; }
.cr-group:hover { border-color: var(--brand-secondary); }
.cr-cta-icon { transition: transform 320ms cubic-bezier(.22,1,.36,1); }
.cr-cta:hover .cr-cta-icon, .cr-cta:focus-visible .cr-cta-icon { transform: translateX(-4px); }
.cr-social-line { transform: scaleX(0); transform-origin: right center; transition: transform 320ms cubic-bezier(.22,1,.36,1); }
.cr-social-icon { transition: transform 320ms cubic-bezier(.22,1,.36,1); }
.cr-social:hover .cr-social-line, .cr-social:focus-visible .cr-social-line { transform: scaleX(1); }
.cr-social:hover .cr-social-icon, .cr-social:focus-visible .cr-social-icon { transform: translateY(-2px); }
@media (prefers-reduced-motion: reduce) {
  .cr-reveal, .cr-link, .cr-link::after, .cr-group, .cr-cta-icon, .cr-social-line, .cr-social-icon { transition: none !important; }
  [data-motion="ready"]:not([data-revealed="true"]) .cr-reveal { opacity: 1 !important; transform: none !important; }
  .cr-link::after { transform: scaleX(0) !important; }
}
`;

const primarySurface: CSSProperties = {
  backgroundColor: "var(--brand-primary)",
  color: "var(--brand-primary-contrast)",
};
const secondarySurface: CSSProperties = {
  backgroundColor: "var(--brand-secondary)",
  color: "var(--brand-secondary-contrast)",
};
const mutedOnPrimary: CSSProperties = {
  color: "color-mix(in srgb, var(--brand-primary-contrast) 68%, transparent)",
};
const mutedOnSecondary: CSSProperties = {
  color: "color-mix(in srgb, var(--brand-secondary-contrast) 68%, transparent)",
};
const ruleOnPrimary: CSSProperties = {
  borderColor: "color-mix(in srgb, var(--brand-primary-contrast) 18%, transparent)",
};
const ruleOnSecondary: CSSProperties = {
  borderColor: "color-mix(in srgb, var(--brand-secondary-contrast) 18%, transparent)",
};
const goldInk: CSSProperties = { color: "var(--brand-secondary)" };
const coralInk: CSSProperties = { color: "var(--brand-primary)" };
const micro = "text-[9px] font-bold tracking-[0.24em]";

export interface FooterContentProps {
  settings: FooterSettings;
  tenantName: string;
  logo: string | null;
  year?: number;
  /** Preview mode keeps the exact markup but blocks navigation and scrolling. */
  preview?: boolean;
  className?: string;
}

function useModuleReveal() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.dataset.motion = "ready";
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        el.dataset.revealed = "true";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}

/** A deliberate stepped signal mark — the brand zone's structural signature. */
function SignalMark() {
  return (
    <div className="flex items-end gap-1" aria-hidden="true">
      {[6, 10, 14, 18].map((height, index) => (
        <span
          key={height}
          className="w-[3px]"
          style={{
            height,
            backgroundColor:
              index === 3 ? "var(--brand-secondary)" : "color-mix(in srgb, var(--brand-primary-contrast) 35%, transparent)",
          }}
        />
      ))}
    </div>
  );
}

function BrandZone({
  settings,
  tenantName,
  logo,
}: {
  settings: FooterSettings;
  tenantName: string;
  logo: string | null;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <section
      className="cr-reveal border-b px-5 py-8 sm:px-8 lg:border-b-0 lg:border-e lg:px-12 lg:py-10"
      style={{ ...primarySurface, ...ruleOnPrimary, transitionDelay: "40ms" }}
    >
      <div className="mx-auto flex h-full max-w-[1280px] flex-col justify-between gap-10">
        <div className="flex items-center justify-between gap-4">
          <p className={micro} style={mutedOnPrimary}>
            01 / IDENTITY
          </p>
          <SignalMark />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {logo && !failed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={tenantName}
              onError={() => setFailed(true)}
              className="h-10 w-10 object-contain"
            />
          )}
          <h2 className="font-display text-[30px] font-bold leading-tight tracking-tight sm:text-[34px]">
            {tenantName}
          </h2>
        </div>

        <p className="mt-4 max-w-md text-[11px] font-bold tracking-wide" style={mutedOnPrimary}>
          {settings.tagline}
        </p>
        <div aria-hidden="true" className="mt-5 h-px w-14" style={{ backgroundColor: "var(--brand-secondary)" }} />
        <p className="mt-5 max-w-lg text-[13px] leading-6">{settings.aboutText}</p>
      </div>
    </section>
  );
}

type ContactRow = {
  label: string;
  value: string;
  href: string | null;
  isExternal?: boolean;
};

function buildContactRows(contact: FooterSettings["contact"]): ContactRow[] {
  const rows: ContactRow[] = [];
  if (contact.phone?.trim()) {
    rows.push({
      label: "اتصل بنا",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, "")}`,
    });
  }
  if (contact.email?.trim()) {
    rows.push({ label: "راسلنا", value: contact.email, href: `mailto:${contact.email}` });
  }
  if (contact.hours?.trim()) {
    rows.push({ label: "ساعات العمل", value: contact.hours, href: null });
  }
  const whatsapp = toWhatsAppUrl(contact.whatsapp ?? "");
  if (whatsapp) {
    rows.push({ label: "واتساب", value: contact.whatsapp, href: whatsapp, isExternal: true });
  }
  return rows;
}

function ContactZone({
  settings,
  whatsappUrl,
  guard,
}: {
  settings: FooterSettings;
  whatsappUrl: string;
  guard: (event: MouseEvent<HTMLElement>) => void;
}) {
  const rows = buildContactRows(settings.contact);

  return (
    <section className="cr-reveal px-5 py-8 sm:px-8 lg:px-12" style={{ ...secondarySurface, transitionDelay: "100ms" }}>
      <div className="mx-auto max-w-[640px]">
        <div className="flex items-center justify-between gap-4">
          <p className={micro} style={mutedOnSecondary}>
            02 / CONTACT
          </p>
          <span aria-hidden="true" className="h-px w-10" style={{ backgroundColor: "var(--brand-primary)" }} />
        </div>

        <h3 className="mt-5 font-display text-[20px] font-bold">اتصل بنا</h3>

        {rows.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
            {rows.map((row) => {
              const value = row.href ? (
                <a
                  href={row.href}
                  {...(row.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={guard}
                  className="cr-link text-[12px] leading-5"
                >
                  {row.value}
                </a>
              ) : (
                <span className="text-[12px] leading-5">{row.value}</span>
              );

              return (
                <div key={row.label} className="min-w-0">
                  <p className={`${micro} flex items-center gap-2`} style={mutedOnSecondary}>
                    <span aria-hidden="true" className="h-px w-3 shrink-0" style={coralInk} />
                    {row.label}
                  </p>
                  <div className="mt-2">{value}</div>
                </div>
              );
            })}
          </div>
        )}

        <a
          href={whatsappUrl || (settings.contact.email ? `mailto:${settings.contact.email}` : routes.community)}
          {...(whatsappUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          onClick={guard}
          className="cr-cta mt-6 inline-flex h-10 items-center gap-4 border px-5 text-[12px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          style={{
            backgroundColor: "var(--brand-primary)",
            color: "var(--brand-primary-contrast)",
            borderColor: "var(--brand-primary)",
          }}
        >
          <span>تواصل معنا</span>
          <ArrowLeft className="cr-cta-icon h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function NavigationZone({
  groups,
  whatsappUrl,
  guard,
}: {
  groups: FooterLinkGroup[];
  whatsappUrl: string;
  guard: (event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <section
      className="cr-reveal border-t px-5 py-8 sm:px-8 lg:px-12"
      style={{ ...primarySurface, ...ruleOnPrimary, transitionDelay: "160ms" }}
    >
      <div className="mx-auto max-w-[640px]">
        <div className="flex items-center justify-between gap-4">
          <p className={micro} style={mutedOnPrimary}>
            03 / NAVIGATION
          </p>
          <span aria-hidden="true" className="h-px w-10" style={{ backgroundColor: "var(--brand-secondary)" }} />
        </div>

        <nav
          aria-label="روابط الفوتر"
          className="mt-6 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]"
        >
          {groups.map((group, index) => {
            const key = `${group.heading}-${group.links.length}`;
            return (
              <div
                key={key}
                className={`cr-group min-w-0 border-t pt-5 sm:border-t-0 sm:pt-0 ${index > 0 ? "sm:border-s sm:ps-6" : ""}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold tabular-nums" style={goldInk}>
                    0{index + 1}
                  </span>
                  <h3 className={micro}>{group.heading}</h3>
                </div>
                <ul className="mt-3 space-y-1">
                  {group.links.map((link) => {
                    const linkKey = `${group.heading}-${link.label}-${link.href}`;
                    const resolved = link.href.trim() !== "" ? link.href : whatsappUrl || routes.community;
                    const className = "cr-link text-[12px] leading-5";

                    if (resolved.startsWith("http")) {
                      return (
                        <li key={linkKey}>
                          <a href={resolved} target="_blank" rel="noopener noreferrer" onClick={guard} className={className}>
                            {link.label}
                          </a>
                        </li>
                      );
                    }
                    return (
                      <li key={linkKey}>
                        <Link href={resolved} onClick={guard} className={className}>
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>
    </section>
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

function SocialZone({
  socials,
  guard,
}: {
  socials: FooterSettings["socials"];
  guard: (event: MouseEvent<HTMLElement>) => void;
}) {
  const entries = SOCIAL_ENTRIES.filter((entry) => socials[entry.key]?.trim() !== "");
  if (entries.length === 0) return null;

  return (
    <section
      className="cr-reveal border-t px-5 py-5 sm:px-8 lg:px-12"
      style={{ ...secondarySurface, ...ruleOnSecondary, transitionDelay: "220ms" }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={micro} style={mutedOnSecondary}>
          04 / NETWORK
        </p>
        <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
          {entries.map((entry) => {
            const Icon = entry.Icon;
            const href = socials[entry.key];
            return (
              <li key={entry.key}>
                <a
                  href={href}
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={guard}
                  className="cr-social inline-flex items-center gap-2 text-[11px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                >
                  <span aria-hidden="true" className="cr-social-line h-px w-4" style={coralInk} />
                  <Icon className="cr-social-icon h-3.5 w-3.5" style={coralInk} aria-hidden="true" />
                  {entry.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
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
      className="group inline-flex items-center gap-1.5 text-[10px] font-bold transition-opacity duration-200 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      <span>أعلى الصفحة</span>
      <ArrowUp className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
    </button>
  );
}

function LegalStrip({
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
    <div
      className="cr-reveal border-t px-5 py-3 sm:px-8 lg:px-12"
      style={{ ...primarySurface, ...ruleOnPrimary, transitionDelay: "280ms" }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 text-[10px] sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">© {year} {tenantName}. جميع الحقوق محفوظة.</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href={routes.publicPrivacy}
            onClick={guard}
            className="cr-link"
          >
            سياسة الخصوصية
          </Link>
          <Link
            href={routes.publicTerms}
            onClick={guard}
            className="cr-link"
          >
            شروط الاستخدام
          </Link>
          <BackToTop preview={preview} />
        </div>
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
  const ref = useModuleReveal();
  const guard = (event: MouseEvent<HTMLElement>) => {
    if (preview) event.preventDefault();
  };

  const whatsappUrl = toWhatsAppUrl(settings.contact.whatsapp);

  return (
    <footer ref={ref} dir="rtl" className={className} style={primarySurface}>
      <style>{CONTROL_CSS}</style>

      {/* Asymmetric core: identity occupies half, the other half is a stacked instrument panel. */}
      <div className="grid lg:grid-cols-2">
        <BrandZone settings={settings} tenantName={tenantName} logo={logo} />
        <div className="flex flex-col">
          <ContactZone settings={settings} whatsappUrl={whatsappUrl} guard={guard} />
          <NavigationZone groups={settings.groups} whatsappUrl={whatsappUrl} guard={guard} />
        </div>
      </div>

      <SocialZone socials={settings.socials} guard={guard} />
      <LegalStrip year={year} tenantName={tenantName} preview={preview} />
    </footer>
  );
}
