"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { routes } from "@/constants/routes";
import { toWhatsAppUrl, type FooterSettings } from "@/features/footer/types";

/**
 * Premium educational-platform footer — one continuous blue field.
 *
 * Palette extracted from the supplied screenshot and scoped to this component
 * so the platform's global brand tokens stay untouched:
 *   BLUE   #2E6FB2  dominant surface
 *   CORAL  #F66B70  controlled accent only (rules, dots, CTA, hovers)
 *   WHITE  #FFFFFF  primary text
 *   soft white / hairlines are alpha values of white, never new colors
 *
 * No split panels, cards, gradients, shadows or decorative backgrounds.
 * Motion is transform/opacity only, revealed once, reduced-motion aware.
 */

const BLUE = "#2E6FB2";
const CORAL = "#F66B70";
const WHITE = "#FFFFFF";
const softWhite = "rgba(255,255,255,0.72)";
const hairline = "rgba(255,255,255,0.16)";

const FOOTER_CSS = `
.ef-reveal { transition: opacity 620ms cubic-bezier(.22,1,.36,1), transform 620ms cubic-bezier(.22,1,.36,1); }
[data-motion="ready"]:not([data-revealed="true"]) .ef-reveal { opacity: 0; transform: translateY(16px); }
.ef-link { position: relative; display: inline-block; color: inherit; transition: opacity 220ms ease, color 220ms ease; }
.ef-link::after { content: ""; position: absolute; right: 0; bottom: -3px; width: 100%; height: 1px; background: ${CORAL}; transform: scaleX(0); transform-origin: right center; transition: transform 320ms cubic-bezier(.22,1,.36,1); }
.ef-link:hover, .ef-link:focus-visible { color: ${WHITE}; }
.ef-link:hover::after, .ef-link:focus-visible::after { transform: scaleX(1); }
.ef-group { border-color: ${hairline}; transition: border-color 260ms ease; }
.ef-group:hover { border-color: ${CORAL}; }
.ef-cta { transition: transform 260ms cubic-bezier(.22,1,.36,1); }
.ef-cta:hover, .ef-cta:focus-visible { transform: translateY(-2px); }
.ef-cta-icon { transition: transform 320ms cubic-bezier(.22,1,.36,1); }
.ef-cta:hover .ef-cta-icon, .ef-cta:focus-visible .ef-cta-icon { transform: translateX(-4px); }
.ef-top-icon { transition: transform 300ms cubic-bezier(.22,1,.36,1); }
.ef-top:hover .ef-top-icon { transform: translateY(-3px); }
@media (prefers-reduced-motion: reduce) {
  .ef-reveal, .ef-link, .ef-link::after, .ef-group, .ef-cta, .ef-cta-icon, .ef-top-icon { transition: none !important; }
  [data-motion="ready"]:not([data-revealed="true"]) .ef-reveal { opacity: 1 !important; transform: none !important; }
  .ef-link::after { transform: scaleX(0) !important; }
}
`;

const softInk: CSSProperties = { color: softWhite };
const coralRule: CSSProperties = { backgroundColor: CORAL };
const coralInk: CSSProperties = { color: CORAL };
const line: CSSProperties = { borderColor: hairline };

export interface FooterContentProps {
  settings: FooterSettings;
  tenantName: string;
  logo: string | null;
  year?: number;
  /** Preview mode keeps the exact markup but blocks navigation and scrolling. */
  preview?: boolean;
  className?: string;
}

function useFooterReveal() {
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

const SOCIAL_ENTRIES: {
  key: "facebook" | "youtube" | "instagram" | "whatsapp";
  label: string;
}[] = [
  { key: "facebook", label: "فيسبوك" },
  { key: "youtube", label: "يوتيوب" },
  { key: "instagram", label: "انستغرام" },
  { key: "whatsapp", label: "واتساب" },
];

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
      className="ef-top inline-flex items-center gap-1.5 text-[11px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      <span>أعلى الصفحة</span>
      <ArrowUp className="ef-top-icon h-3.5 w-3.5" aria-hidden="true" />
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
  const ref = useFooterReveal();
  const [logoFailed, setLogoFailed] = useState(false);

  const guard = (event: MouseEvent<HTMLElement>) => {
    if (preview) event.preventDefault();
  };

  const whatsappUrl = toWhatsAppUrl(settings.contact.whatsapp);
  const primaryAction =
    whatsappUrl || (settings.contact.email ? `mailto:${settings.contact.email}` : routes.community);
  const contactRows = buildContactRows(settings.contact);
  const socialEntries = SOCIAL_ENTRIES.filter((entry) => settings.socials[entry.key]?.trim() !== "");

  return (
    <footer
      ref={ref}
      dir="rtl"
      className={className}
      style={{ backgroundColor: BLUE, color: WHITE }}
    >
      <style>{FOOTER_CSS}</style>

      <div
        className={
          preview
            ? "mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8"
            : "mx-auto w-full max-w-[1200px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16"
        }
      >
        {/* TOP AREA — brand identity + distinctive contact CTA on one field */}
        <div
          className="ef-reveal grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16"
          style={{ transitionDelay: "40ms" }}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-4">
              {logo && !logoFailed && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={tenantName}
                  onError={() => setLogoFailed(true)}
                  className="h-11 w-11 shrink-0 object-contain"
                />
              )}
              <h2 className="font-display text-[32px] font-bold leading-tight tracking-tight sm:text-[38px]">
                {tenantName}
              </h2>
            </div>

            <p className="mt-6 text-[11px] font-bold tracking-[0.22em]" style={softInk}>
              {settings.tagline}
            </p>
            <p className="mt-4 max-w-xl text-[14px] leading-8 sm:text-[15px] sm:leading-8">
              {settings.aboutText}
            </p>
          </div>

          <div className="flex flex-col items-start gap-5 lg:items-end">
            <span aria-hidden="true" className="h-px w-16" style={coralRule} />
            <a
              href={primaryAction}
              {...(whatsappUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={guard}
              className="ef-cta inline-flex h-12 items-center gap-4 px-7 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              style={{ backgroundColor: CORAL, color: WHITE }}
            >
              <span>تواصل معنا</span>
              <ArrowLeft className="ef-cta-icon h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* MIDDLE AREA — three organized navigation groups */}
        <nav
          aria-label="روابط الفوتر"
          className="ef-reveal mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t pt-10 sm:grid-cols-3 lg:mt-14 lg:pt-12"
          style={{ ...line, transitionDelay: "110ms" }}
        >
          {settings.groups.map((group, index) => {
            const key = `${group.heading}-${group.links.length}`;
            return (
              <div
                key={key}
                className={`ef-group min-w-0 border-t pt-6 sm:border-t-0 sm:pt-0 ${index > 0 ? "sm:border-s sm:ps-8" : ""}`}
              >
                <h3 className="flex items-center gap-2 text-[12px] font-bold">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={coralRule} />
                  {group.heading}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => {
                    const linkKey = `${group.heading}-${link.label}-${link.href}`;
                    const resolved = link.href.trim() !== "" ? link.href : whatsappUrl || routes.community;
                    const className = "ef-link text-[13px] leading-6";

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

        {/* CONTACT AREA — compact information layout, no colored block */}
        <section
          className="ef-reveal mt-12 border-t pt-8 lg:mt-14 lg:pt-10"
          style={{ ...line, transitionDelay: "180ms" }}
        >
          {contactRows.length > 0 && (
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {contactRows.map((row) => {
                const value = row.href ? (
                  <a
                    href={row.href}
                    {...(row.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    onClick={guard}
                    className="ef-link text-[13px] leading-6"
                  >
                    {row.value}
                  </a>
                ) : (
                  <span className="text-[13px] leading-6">{row.value}</span>
                );

                return (
                  <div key={row.label} className="min-w-0">
                    <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em]" style={softInk}>
                      <span aria-hidden="true" className="h-px w-3 shrink-0" style={coralRule} />
                      {row.label}
                    </p>
                    <div className="mt-2">{value}</div>
                  </div>
                );
              })}
            </div>
          )}

          {socialEntries.length > 0 && (
            <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-6" style={line}>
              {socialEntries.map((entry) => {
                const href = settings.socials[entry.key];
                return (
                  <li key={entry.key}>
                    <a
                      href={href}
                      {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      onClick={guard}
                      className="ef-link inline-flex items-center gap-2 text-[11px] font-bold"
                    >
                      <span aria-hidden="true" className="h-1 w-1 rounded-full" style={coralInk} />
                      {entry.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* BOTTOM AREA — legal, terms and back-to-top */}
        <div
          className="ef-reveal mt-10 flex flex-col gap-4 border-t pt-6 text-[11px] sm:flex-row sm:items-center sm:justify-between"
          style={{ ...line, transitionDelay: "250ms" }}
        >
          <p className="font-semibold" style={softInk}>
            © {year} {tenantName}. جميع الحقوق محفوظة.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href={routes.publicPrivacy} onClick={guard} className="ef-link">
              سياسة الخصوصية
            </Link>
            <Link href={routes.publicTerms} onClick={guard} className="ef-link">
              شروط الاستخدام
            </Link>
            <BackToTop preview={preview} />
          </div>
        </div>
      </div>
    </footer>
  );
}
