"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Facebook,
  Youtube,
  Instagram,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  ArrowUp,
  ArrowLeft,
} from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useMergedPublicFooter } from "@/features/footer/hooks";
import { toWhatsAppUrl, type FooterLink, type FooterLinkGroup } from "@/features/footer/types";
import { routes } from "@/constants/routes";

/**
 * Platform footer — a floating brand panel driven by the tenant's `footer`
 * settings (contact, socials, quick-link groups). Every clickable element
 * points to a real destination:
 *   - group links: internal route, external URL, or (when left empty) WhatsApp
 *   - contact rows: tel: / mailto: / wa.me
 *   - socials: the tenant's own profile URLs
 * The tenant dynamic font (`--font-sans`) is inherited from the body — the
 * footer never overrides it.
 */

/* ── Card surface: brand depth + warm glows + dot texture ──────── */
function CardSurface() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span
        className="absolute inset-x-8 top-0 h-px opacity-70"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--brand-primary), var(--brand-secondary), var(--brand-primary), transparent)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 55% at 50% -15%, color-mix(in srgb, var(--brand-secondary) 16%, transparent) 0%, transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 70% at 100% 110%, color-mix(in srgb, var(--brand-primary) 32%, transparent) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 0.6px, transparent 0.6px)",
          backgroundSize: "26px 26px",
        }}
      />
    </div>
  );
}

/* ── Brand mark: logo chip with a graceful fallback tile ───────── */
function BrandMark({ logo, tenantName }: { logo: string | null; tenantName: string }) {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--brand-primary)] shadow-soft-md">
        <GraduationCap className="h-6 w-6" />
      </span>
    );
  }
  return (
    <span className="flex h-12 shrink-0 items-center rounded-2xl bg-white px-3 shadow-soft-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={tenantName}
        onError={() => setFailed(true)}
        className="h-7 w-auto max-w-[160px] object-contain"
      />
    </span>
  );
}

/* ── Group heading: gradient micro-rule + label ────────────────── */
function GroupHeading({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="h-[3px] w-6 shrink-0 rounded-full"
        style={{ background: `linear-gradient(90deg, var(--brand-secondary), var(--brand-primary))` }}
      />
      <h3 className="text-[13px] font-bold text-white/85">{text}</h3>
    </div>
  );
}

/* ── A nav link as a glass chip (the site's chip language) ─────── */
function NavLinkChip({ label, href, whatsappUrl }: { label: string; href: string; whatsappUrl: string }) {
  const resolved =
    href.trim() !== "" ? href : whatsappUrl || routes.community;
  const isExternal = resolved.startsWith("http");

  const inner = (
    <>
      <span className="truncate">{label}</span>
      <ArrowLeft
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 -translate-x-1 text-[var(--brand-secondary)] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
      />
    </>
  );

  const classes =
    "group inline-flex w-full items-center justify-between gap-2 rounded-xl bg-white/5 px-3.5 py-2.5 text-[13px] font-medium text-white/80 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white hover:ring-[var(--brand-secondary)] hover:shadow-soft-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]";

  if (isExternal) {
    return (
      <li>
        <a href={resolved} target="_blank" rel="noopener noreferrer" className={classes}>
          {inner}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link href={resolved} className={classes}>
        {inner}
      </Link>
    </li>
  );
}

/* ── One link group rendered as wrapping glass chips ───────────── */
function NavGroup({ group, whatsappUrl }: { group: FooterLinkGroup; whatsappUrl: string }) {
  return (
    <div>
      <GroupHeading text={group.heading} />
      <ul className="mt-4 flex flex-wrap gap-2">
        {group.links.map((link: FooterLink) => (
          <NavLinkChip key={`${link.label}-${link.href}`} label={link.label} href={link.href} whatsappUrl={whatsappUrl} />
        ))}
      </ul>
    </div>
  );
}

/* ── Socials as the hero's icon circles (tenant URLs) ──────────── */
const SOCIAL_ENTRIES: { key: "facebook" | "youtube" | "instagram" | "whatsapp"; label: string; Icon: React.ElementType }[] = [
  { key: "facebook", label: "فيسبوك", Icon: Facebook },
  { key: "youtube", label: "يوتيوب", Icon: Youtube },
  { key: "instagram", label: "انستغرام", Icon: Instagram },
  { key: "whatsapp", label: "واتساب", Icon: MessageCircle },
];

function SocialIcons({ socials }: { socials: { facebook: string; youtube: string; instagram: string; whatsapp: string } }) {
  const entries = SOCIAL_ENTRIES.filter((entry) => socials[entry.key]?.trim() !== "");
  if (entries.length === 0) return null;

  return (
    <ul className="flex items-center gap-2">
      {entries.map((entry, i) => {
        const isPrimary = i % 2 === 0;
        const color = isPrimary ? "var(--brand-primary)" : "var(--brand-secondary)";
        const href = socials[entry.key];
        const isExternal = href.startsWith("http");
        return (
          <li key={entry.key}>
            <a
              href={href}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={entry.label}
              title={entry.label}
              className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] transition-all duration-300 hover:scale-110 hover:shadow-brand-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
              style={{ backgroundColor: color, borderColor: color }}
            >
              <entry.Icon
                className="h-[17px] w-[17px]"
                style={{
                  color: isPrimary
                    ? "var(--brand-primary-contrast)"
                    : "var(--brand-secondary-contrast)",
                }}
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* ── About block: short intro + socials ────────────────────────── */
function AboutBlock({
  aboutText,
  socials,
}: {
  aboutText: string;
  socials: { facebook: string; youtube: string; instagram: string; whatsapp: string };
}) {
  return (
    <div>
      <GroupHeading text="عن المنصة" />
      <p className="mt-4 max-w-md text-sm leading-7 text-white/70">{aboutText}</p>
      <div className="mt-6">
        <SocialIcons socials={socials} />
      </div>
    </div>
  );
}

/* ── Contact entries as the hero's icon tiles ──────────────────── */
function ContactStrip({ contact }: { contact: { phone: string; email: string; hours: string; whatsapp: string } }) {
  const rows: {
    label: string;
    value: string;
    href: string | null;
    isExternal?: boolean;
    Icon: React.ElementType;
  }[] = [];

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

  if (rows.length === 0) return null;

  return (
    <div className="mt-12 border-t border-white/10 pt-8">
      <ul className="flex flex-wrap items-center gap-x-9 gap-y-5">
        {rows.map((row, i) => {
          const isPrimary = i % 2 === 0;
          const color = isPrimary ? "var(--brand-primary)" : "var(--brand-secondary)";
          const inner = (
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-white/45">{row.label}</span>
              <span className="mt-0.5 block truncate text-sm font-semibold leading-6 text-white/85">
                {row.value}
              </span>
            </div>
          );
          return (
            <li key={row.label} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] shadow-md"
                style={{ backgroundColor: color, borderColor: color }}
              >
                <row.Icon
                  className="h-[18px] w-[18px]"
                  style={{
                    color: isPrimary
                      ? "var(--brand-primary-contrast)"
                      : "var(--brand-secondary-contrast)",
                  }}
                />
              </span>
              {row.href ? (
                <a
                  href={row.href}
                  {...(row.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="rounded-lg transition-colors duration-150 hover:text-[var(--brand-secondary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Return-to-top, tucked into the legal line ─────────────────── */
function BackToTop() {
  const scrollToTop = () => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      title="العودة للأعلى"
      aria-label="العودة للأعلى"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 ring-1 ring-white/20 transition-colors duration-200 hover:bg-[var(--brand-secondary)] hover:text-[var(--brand-secondary-contrast)] hover:ring-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}

/* ── Main footer ───────────────────────────────────────────────── */
export function PublicFooter() {
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const platformBranding = useTenantStore((s) => s.platformBranding);
  const { data: footer } = useMergedPublicFooter();

  const brandLogo = platformBranding?.logo ?? tenant?.branding?.logo ?? null;
  const logo =
    theme === "dark"
      ? platformBranding?.darkLogo ?? tenant?.branding?.dark_logo ?? brandLogo
      : platformBranding?.lightLogo ?? tenant?.branding?.light_logo ?? brandLogo;
  const tenantName = platformBranding?.name ?? tenant?.name ?? "أكاديميتي";
  const year = new Date().getFullYear();

  const whatsappUrl = toWhatsAppUrl(footer.contact.whatsapp);
  const secondaryHref = whatsappUrl || (footer.contact.email ? `mailto:${footer.contact.email}` : routes.community);

  return (
    <footer dir="rtl" className="relative w-full px-2 py-8 sm:px-4 sm:py-12 lg:px-5 lg:py-16">
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-brand-md sm:rounded-3xl"
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(165deg, color-mix(in srgb, var(--brand-primary) 70%, #1a0f08) 0%, color-mix(in srgb, var(--brand-primary) 85%, #1a0f08) 50%, color-mix(in srgb, var(--brand-primary) 80%, #120a06) 100%)",
        }}
      >
        <CardSurface />

        <div className="relative px-5 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          {/* ── Brand bar ── */}
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <BrandMark logo={logo} tenantName={tenantName} />
              <div>
                <p className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
                  {tenantName}
                </p>
                <p className="mt-1 text-xs text-white/60">{footer.tagline}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={routes.studentDashboard}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--brand-secondary)] px-6 py-3 text-sm font-bold text-[var(--brand-secondary-contrast)] transition-colors duration-200 hover:bg-white hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                style={{
                  boxShadow:
                    "0 12px 28px -10px color-mix(in srgb, var(--brand-secondary) 55%, transparent)",
                }}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <GraduationCap className="h-4 w-4" />
                <span className="relative">سجّل الآن</span>
              </Link>
              <a
                href={secondaryHref}
                {...(whatsappUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="inline-flex items-center justify-center rounded-xl bg-white/5 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/25 transition-colors duration-200 hover:bg-white/10 hover:ring-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
              >
                تواصل معنا
              </a>
            </div>
          </div>

          {/* ── Content spread ── */}
          <div className="mt-12 grid gap-x-10 gap-y-11 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <AboutBlock aboutText={footer.aboutText} socials={footer.socials} />
            </div>
            <div className="lg:col-span-8">
              <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {footer.groups.map((group) => (
                  <NavGroup key={group.heading} group={group} whatsappUrl={whatsappUrl} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Contact + legal ── */}
          <ContactStrip contact={footer.contact} />

          <div className="flex flex-col items-center gap-4 border-t border-white/10 py-6 sm:flex-row sm:justify-between">
            <p className="text-xs leading-relaxed text-white/50">
              © {year} {tenantName}. جميع الحقوق محفوظة.
            </p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
              <Link
                href={routes.publicPrivacy}
                className="inline-flex py-1 text-xs text-white/50 transition-colors duration-150 hover:text-[var(--brand-secondary)]"
              >
                سياسة الخصوصية
              </Link>
              <span aria-hidden="true" className="text-white/20">
                ·
              </span>
              <Link
                href={routes.publicTerms}
                className="inline-flex py-1 text-xs text-white/50 transition-colors duration-150 hover:text-[var(--brand-secondary)]"
              >
                شروط الاستخدام
              </Link>
              <span aria-hidden="true" className="mx-1.5 h-4 w-px bg-white/15" />
              <BackToTop />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}