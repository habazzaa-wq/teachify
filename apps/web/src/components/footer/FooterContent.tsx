"use client";

import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
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
 * editor preview.
 *
 * Design direction — "the lab notebook":
 * Instead of the usual four-column link dump, the footer reads like the back
 * page of a science notebook: a faint graph-paper grid, a measuring scale on
 * the top edge, an index of numbered chapters, a hand-written style equation,
 * and contact details laid out as a data readout. Every accent is derived from
 * the live brand variables, so re-branding the tenant re-skins this footer too.
 */

const footerStyle = {
  backgroundColor: "color-mix(in srgb, var(--brand-primary) 11%, #15100e)",
  color: "var(--footer-text)",
  "--footer-text": "#f7f1e9",
  "--footer-muted": "rgba(247, 241, 233, 0.66)",
  "--footer-subtle": "rgba(247, 241, 233, 0.40)",
  "--footer-line": "rgba(247, 241, 233, 0.14)",
  "--footer-deep": "color-mix(in srgb, var(--brand-primary) 6%, #0d0a09)",
} as CSSProperties;

/** Graph-paper texture, faded out toward the bottom so it never fights text. */
const gridStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "46px 46px",
  maskImage: "linear-gradient(to bottom, #000 0%, transparent 88%)",
  WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 88%)",
};

/** Ruler ticks along the very top edge. */
const rulerStyle: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(to left, rgba(247,241,233,0.22) 0 1px, transparent 1px 15px)",
};

/** Oversized ghost symbol sitting behind the headline. */
const ghostStyle: CSSProperties = {
  color: "color-mix(in srgb, var(--brand-secondary) 7%, transparent)",
};

const indexNumberStyle: CSSProperties = {
  color: "color-mix(in srgb, var(--brand-secondary) 15%, transparent)",
  WebkitTextStroke: "1px color-mix(in srgb, var(--brand-secondary) 62%, transparent)",
};

/** A cut corner — a small technical-drawing detail, not a rounded card. */
const noteStyle: CSSProperties = {
  borderColor: "color-mix(in srgb, var(--brand-secondary) 32%, transparent)",
  backgroundColor: "color-mix(in srgb, var(--brand-secondary) 6%, transparent)",
  clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)",
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
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center border border-[color:var(--brand-secondary)]"
        style={{ backgroundColor: "color-mix(in srgb, var(--brand-secondary) 12%, transparent)" }}
      >
        <GraduationCap className="h-5 w-5 text-[color:var(--brand-secondary)]" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#f7f1e9] p-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt={tenantName} onError={() => setFailed(true)} className="max-h-full max-w-full object-contain" />
    </span>
  );
}

/** Small square-labelled eyebrow used above the headline and the equation. */
function LabLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[color:var(--brand-secondary)]">
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 bg-[color:var(--brand-secondary)]" />
      {children}
    </span>
  );
}

/** The bespoke visual anchor: a "success equation" pinned like a lab note. */
function FormulaNote() {
  return (
    <div className="w-full max-w-sm lg:justify-self-end">
      <div className="border p-6 sm:p-7" style={noteStyle}>
        <div className="flex items-center justify-between">
          <LabLabel>المعادلة</LabLabel>
          <span aria-hidden="true" className="font-mono text-[10px] text-[color:var(--footer-subtle)]">01 / ∞</span>
        </div>

        <p dir="rtl" className="mt-6 font-display text-2xl font-bold leading-relaxed tracking-tight sm:text-[28px]">
          ∑ <span className="text-[color:var(--brand-secondary)]">(</span>تعلّم × تدرّب<span className="text-[color:var(--brand-secondary)]">)</span> = إتقان
        </p>

        <div aria-hidden="true" className="mt-6 h-px w-full bg-[color:var(--footer-line)]" />
        <p className="mt-4 text-xs leading-6 text-[color:var(--footer-muted)]">
          وراء كل نتيجة، خطوات. وكل خطوة بتبدأ من هنا.
        </p>
      </div>
    </div>
  );
}

/** A numbered "chapter" replacing the standard heading + bullet-list column. */
function IndexGroup({
  group,
  index,
  whatsappUrl,
  guard,
}: {
  group: FooterLinkGroup;
  index: number;
  whatsappUrl: string;
  guard: (event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <section className="border-t border-[color:var(--footer-line)] pt-5">
      <div className="flex items-baseline gap-3">
        <span
          aria-hidden="true"
          className="font-display text-4xl font-black leading-none"
          style={indexNumberStyle}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-sm font-bold text-[color:var(--footer-text)]">{group.heading}</h3>
      </div>

      <ul className="mt-5 space-y-3">
        {group.links.map((link: FooterLink) => {
          const key = `${group.heading}-${link.label}-${link.href}`;
          const resolved = link.href.trim() !== "" ? link.href : whatsappUrl || routes.community;
          const className =
            "group inline-flex items-center gap-2 text-[13px] leading-6 text-[color:var(--footer-muted)] transition-colors duration-200 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]";

          const content = (
            <>
              <span aria-hidden="true" className="inline-block h-px w-3 bg-current opacity-0 transition-all duration-200 group-hover:w-5 group-hover:opacity-100" />
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
    </section>
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

/** Contact info as a continuous data readout, separated by hairlines. */
function ContactReadout({ contact, guard }: { contact: FooterSettings["contact"]; guard: (event: MouseEvent<HTMLElement>) => void }) {
  const rows = buildContactRows(contact);
  if (rows.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-stretch">
      {rows.map((row, index) => {
        const Icon = row.Icon;
        const content = (
          <>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-[color:var(--footer-subtle)]">
              <Icon className="h-3 w-3" aria-hidden="true" />
              {row.label}
            </span>
            <span className="mt-1.5 block text-[13px] font-medium leading-5 text-[color:var(--footer-text)]">
              {row.value}
            </span>
          </>
        );

        return (
          <li
            key={row.label}
            className={`py-1 sm:px-6 ${index > 0 ? "sm:border-l sm:border-[color:var(--footer-line)]" : "sm:pr-0"}`}
          >
            {row.href ? (
              <a
                href={row.href}
                {...(row.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={guard}
                className="block rounded-sm transition-colors duration-150 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-secondary)]"
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

/** Social links as quiet text links with an outgoing arrow — not icon bubbles. */
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
              aria-label={entry.label}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[color:var(--footer-muted)] transition-colors duration-150 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {entry.label}
              <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden="true" />
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
      className="group inline-flex h-9 w-9 items-center justify-center border border-[color:var(--footer-line)] text-[color:var(--footer-muted)] transition-colors duration-200 hover:border-[color:var(--brand-secondary)] hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
    >
      <ArrowLeft className="h-4 w-4 rotate-90 transition-transform duration-200 group-hover:-translate-y-0.5" aria-hidden="true" />
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
      {/* Measuring scale along the top edge. */}
      <div aria-hidden="true" className="h-2 w-full" style={rulerStyle} />
      <div aria-hidden="true" className="h-px w-full bg-[color:var(--brand-secondary)] opacity-40" />

      <div className="relative overflow-hidden">
        {/* Graph paper + oversized ghost symbol. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={gridStyle} />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 -top-16 select-none font-display text-[220px] font-black leading-none sm:text-[300px]"
          style={ghostStyle}
        >
          ∑
        </span>

        <div
          className={
            preview
              ? "relative mx-auto w-full max-w-[1200px] px-5 pb-8 pt-8 sm:px-6"
              : "relative mx-auto w-full max-w-[1200px] px-5 pb-10 pt-12 sm:px-8 lg:px-10 lg:pb-14 lg:pt-16"
          }
        >
          {/* ── Statement + equation ─────────────────────────────── */}
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
            <div className="min-w-0">
              <LabLabel>{settings.tagline}</LabLabel>

              <h2 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[1.18] tracking-tight sm:text-5xl lg:text-[56px]">
                التعلّم ما بيتوقفش
                <br />
                عند <span className="text-[color:var(--brand-secondary)]">آخر سؤال.</span>
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[color:var(--footer-muted)]">
                {settings.aboutText}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link
                  href={routes.studentDashboard}
                  onClick={guard}
                  className="group inline-flex items-center gap-3 border-b-2 border-[color:var(--brand-secondary)] pb-1.5 text-sm font-bold text-[color:var(--footer-text)] transition-colors duration-200 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-secondary)]"
                >
                  ابدأ الرحلة
                  <ArrowLeft className="h-4 w-4 text-[color:var(--brand-secondary)] transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
                </Link>
                <a
                  href={secondaryHref}
                  {...(whatsappUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={guard}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--footer-muted)] transition-colors duration-200 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                >
                  تواصل معنا
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              {/* Brand lockup — quiet, below the statement. */}
              <div className="mt-9 flex items-center gap-3">
                <BrandMark key={logo ?? "fallback"} logo={logo} tenantName={tenantName} />
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold tracking-tight">{tenantName}</p>
                  <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-[color:var(--footer-subtle)]">
                    منصتك للتعلّم الكامل
                  </p>
                </div>
              </div>
            </div>

            <FormulaNote />
          </div>

          {/* ── Numbered index of links ──────────────────────────── */}
          <nav
            aria-label="روابط الفوتر"
            className={`${preview ? "mt-9" : "mt-12 lg:mt-16"} grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10`}
          >
            {settings.groups.map((group, index) => (
              <IndexGroup
                key={`${group.heading}-${group.links.length}`}
                group={group}
                index={index}
                whatsappUrl={whatsappUrl}
                guard={guard}
              />
            ))}
          </nav>

          {/* ── Symbol tape ──────────────────────────────────────── */}
          <div
            aria-hidden="true"
            dir="ltr"
            className={`${preview ? "mt-8" : "mt-10"} select-none overflow-hidden whitespace-nowrap border-y border-[color:var(--footer-line)] py-3 font-mono text-[11px] tracking-[0.55em] text-[color:var(--footer-subtle)]`}
          >
            π &nbsp; ∑ &nbsp; √ &nbsp; ∞ &nbsp; Δ &nbsp; ± &nbsp; ∫ &nbsp; θ &nbsp; λ &nbsp; φ &nbsp; Ω &nbsp; α &nbsp; β &nbsp; γ &nbsp; μ &nbsp; σ &nbsp; ω &nbsp; ε &nbsp; η &nbsp; π &nbsp; ∑ &nbsp; ∞
          </div>

          {/* ── Contact readout + socials ────────────────────────── */}
          <div className={`${preview ? "mt-7" : "mt-8"} flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12`}>
            <ContactReadout contact={settings.contact} guard={guard} />
            <div className="lg:pt-1">
              <SocialLinks socials={settings.socials} guard={guard} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Colophon ─────────────────────────────────────────────── */}
      <div className="border-t border-[color:var(--footer-line)] bg-[color:var(--footer-deep)]">
        <div
          className={
            preview
              ? "mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-5 py-5 sm:px-6"
              : "mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10"
          }
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-6 text-[color:var(--footer-subtle)]">
            <span>© {year} {tenantName}</span>
            <span aria-hidden="true" className="text-[color:var(--brand-secondary)]">·</span>
            <span>صُنعت في المختبر، لكل طالب.</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href={routes.publicPrivacy}
              onClick={guard}
              className="text-[11px] text-[color:var(--footer-muted)] underline decoration-[color:var(--footer-line)] underline-offset-4 transition-colors duration-150 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              سياسة الخصوصية
            </Link>
            <Link
              href={routes.publicTerms}
              onClick={guard}
              className="text-[11px] text-[color:var(--footer-muted)] underline decoration-[color:var(--footer-line)] underline-offset-4 transition-colors duration-150 hover:text-[color:var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              شروط الاستخدام
            </Link>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-[color:var(--footer-line)]" />
            <BackToTop preview={preview} />
          </div>
        </div>
      </div>
    </footer>
  );
}
