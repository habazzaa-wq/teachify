"use client";

import { Fragment, useState } from "react";
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
} from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Platform footer — "فهرس المنصة": an editorial catalogue that closes the
 * homepage the same way it opens: as printed matter, not a template.
 *
 * Composition (desktop RTL):
 *   - a thin "نهاية الصفحة" ruler with a return-to-top affordance,
 *   - an asymmetric 12-column spread: brand manifesto (5) · link index with
 *     dot-leader rows and numbered badges (4) · contact data column (3).
 *
 * Craft details shared with the rest of the public surface:
 *   - the Amiri display face for the wordmark (`--font-display`),
 *   - the gold micro-rule used by the editorial sections,
 *   - dot-leader rows whose number badges fill brand-gold on hover,
 *   - socials as a set-text row instead of generic icon pills.
 *
 * Colour logic — both brand colours stay purposeful on the deep terracotta:
 *   - Primary (#D87B63): the backdrop, deepened with a neutral dark tone so
 *     white text and the gold accents breathe comfortably.
 *   - Secondary (#FFB50E): the gold overline, leader dots, number badges,
 *     the primary button, contact tiles and hover accents.
 */

const DEVELOPER_WHATSAPP = "https://wa.me/201011245565";

/* Numbers are padded like the editorial catalogue does — 01, 02, … */
const pad = (n: number) => String(n).padStart(2, "0");

/* ── Types ─────────────────────────────────────────────────────── */
export type FooterLink = { label: string; href: string };
export type FooterNavSection = { heading: string; links: FooterLink[] };
export type FooterSocial = { label: string; href: string };

/* ── Content (data-driven) ─────────────────────────────────────── */
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

export const footerContact = {
  phone: "+20 10 1124 5565",
  phoneHref: "tel:+201011245565",
  email: "hello@academy.example",
  emailHref: "mailto:hello@academy.example",
  hours: "السبت — الخميس، ٨ صباحًا حتى ٦ مساءً",
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

/* ── Background: layered warm glow + dot texture + faint letters ── */
function FooterBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Warm top glow, echoing the gold of the sections above */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% -15%, color-mix(in srgb, var(--brand-secondary) 15%, transparent) 0%, transparent 55%)",
        }}
      />
      {/* Deep primary caste under the contact column (end side) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 65% at 100% 105%, color-mix(in srgb, var(--brand-primary) 28%, transparent) 0%, transparent 62%)",
        }}
      />
      {/* Dot texture, matching the editorial sections */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 0.6px, transparent 0.6px)",
          backgroundSize: "26px 26px",
        }}
      />
      {/* Barely-there Arabic letters, a whisper of the hero's decor */}
      <span
        className="absolute bottom-12 start-[3%] hidden select-none text-7xl font-bold text-white/5 lg:block"
        style={{ fontFamily: "var(--font-display, serif)", transform: "rotate(8deg)" }}
      >
        أ
      </span>
      <span
        className="absolute top-20 end-[4%] hidden select-none text-6xl font-bold text-white/5 lg:block"
        style={{ fontFamily: "var(--font-display, serif)", transform: "rotate(-10deg)" }}
      >
        ف
      </span>
      <span
        className="absolute bottom-24 end-[30%] hidden select-none text-5xl font-bold text-white/5 lg:block"
        style={{ fontFamily: "var(--font-display, serif)", transform: "rotate(12deg)" }}
      >
        س
      </span>
    </div>
  );
}

/* ── Editorial index heading: gold micro-rule + overline ───────── */
function IndexHeading({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="h-[3px] w-6 shrink-0 rounded-full"
        style={{ background: "var(--brand-secondary)" }}
      />
      <h3 className="text-xs font-bold tracking-[0.16em] text-white/70">{text}</h3>
    </div>
  );
}

/* ── A single nav section as a dotted index table ──────────────── */
function IndexSection({ section }: { section: FooterNavSection }) {
  return (
    <div>
      <IndexHeading text={section.heading} />
      <ul className="mt-3">
        {section.links.map((link, i) => (
          <li key={`${section.heading}-${link.label}`}>
            <Link
              href={link.href}
              className="group flex items-center gap-2 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-secondary)]"
            >
              <span className="truncate text-sm text-white/80 transition-colors duration-200 group-hover:text-[var(--brand-secondary)]">
                {link.label}
              </span>
              {/* Dot leader */}
              <span aria-hidden="true" className="relative mx-1 h-px min-w-4 flex-1">
                <span className="absolute inset-0 border-t border-dotted border-white/20 transition-colors duration-200 group-hover:border-[var(--brand-secondary)]" />
              </span>
              {/* Number badge — fills gold on hover */}
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 text-[9px] font-extrabold text-white/40 tabular-nums transition-colors duration-200 group-hover:border-transparent group-hover:bg-[var(--brand-secondary)] group-hover:text-[var(--brand-secondary-contrast)]"
              >
                {pad(i + 1)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CONTACT_ROWS = [
  { label: "اتصل بنا", value: footerContact.phone, href: footerContact.phoneHref, icon: Phone },
  { label: "راسلنا", value: footerContact.email, href: footerContact.emailHref, icon: Mail },
  { label: "ساعات العمل", value: footerContact.hours, href: null, icon: Clock },
] as const;

/* ── Contact data column (icon tiles + label/value) ────────────── */
function ContactColumn() {
  return (
    <div>
      <IndexHeading text="التواصل" />
      <ul className="mt-7 space-y-5">
        {CONTACT_ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.label} className="flex items-center gap-3.5">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "color-mix(in srgb, var(--brand-secondary) 14%, transparent)",
                }}
              >
                <Icon className="h-[18px] w-[18px] text-[var(--brand-secondary)]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold tracking-wide text-white/35">
                  {row.label}
                </span>
                {row.href ? (
                  <a
                    href={row.href}
                    className="mt-0.5 block truncate text-sm font-semibold text-white/85 transition-colors duration-200 hover:text-[var(--brand-secondary)]"
                  >
                    {row.value}
                  </a>
                ) : (
                  <span className="mt-0.5 block text-sm font-semibold leading-6 text-white/85">
                    {row.value}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Socials as a set-text row, separated by hairlines ─────────── */
function SocialsRow() {
  return (
    <div className="flex flex-wrap items-center gap-x-0.5 gap-y-2">
      {footerSocials.map((social, i) => {
        const Icon = SOCIAL_ICONS[social.label];
        if (!Icon) return null;
        const isExternal = social.href.startsWith("http");
        return (
          <Fragment key={social.label}>
            <a
              href={social.href}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={social.label}
              title={social.label}
              className="group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/65 transition-colors duration-200 hover:text-[var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
            >
              <Icon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
              {social.label}
            </a>
            {i < footerSocials.length - 1 && (
              <span aria-hidden="true" className="mx-1 h-3 w-px bg-white/15" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ── Brand mark: logo chip with a graceful fallback tile ───────── */
function BrandMark({ logo, tenantName }: { logo: string | null; tenantName: string }) {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[var(--brand-secondary)]">
        <GraduationCap className="h-5 w-5" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={tenantName}
      onError={() => setFailed(true)}
      className="h-9 w-auto max-w-[150px] object-contain"
    />
  );
}

/* ── Brand manifesto: wordmark, tagline, CTAs, socials ─────────── */
function Manifesto({ logo, tenantName }: { logo: string | null; tenantName: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <BrandMark logo={logo} tenantName={tenantName} />
        <span className="text-[10px] font-bold tracking-[0.22em] text-white/45">
          منظومة تعليمية متكاملة
        </span>
      </div>

      <h2
        className="mt-9 text-balance text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl"
        style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
      >
        {tenantName}
      </h2>
      <span
        aria-hidden="true"
        className="mt-4 block h-[3px] w-14 rounded-full"
        style={{ background: "var(--brand-secondary)" }}
      />

      <p className="mt-6 max-w-sm text-[13px] leading-7 text-white/65 sm:text-sm">
        منصة تعليمية عربية متكاملة تضم الطلاب والمعلمين وأولياء الأمور، وتقدّم محتوى
        دراسيًا منظّمًا لكل المراحل الدراسية.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-secondary)] px-6 py-3 text-sm font-bold text-[var(--brand-secondary-contrast)] transition-colors duration-200 hover:bg-white hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
          style={{
            boxShadow: "0 10px 30px color-mix(in srgb, var(--brand-secondary) 35%, transparent)",
          }}
        >
          سجّل الآن
        </Link>
        <a
          href={DEVELOPER_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-white/5 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/25 transition-colors duration-200 hover:bg-white/10 hover:ring-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
        >
          تواصل معنا
        </a>
      </div>

      <div className="mt-auto pt-12">
        <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/35">تابعنا</p>
        <SocialsRow />
      </div>
    </div>
  );
}

/* ── Top ruler: "نهاية الصفحة" + return to top ─────────────────── */
function BackToTopStrip() {
  const scrollToTop = () => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <span className="select-none text-[10px] font-bold tracking-[0.22em] text-white/35">
          نهاية الصفحة
        </span>
        <button
          type="button"
          onClick={scrollToTop}
          className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-white/55 transition-colors duration-200 hover:text-[var(--brand-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
        >
          العودة للأعلى
          <ArrowUp className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
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
    <footer
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: "color-mix(in srgb, var(--brand-primary) 78%, #1a0f08)",
      }}
    >
      <FooterBackdrop />

      <div className="relative z-10">
        <BackToTopStrip />

        {/* ── Asymmetric catalogue spread ── */}
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12 lg:gap-y-0">
            {/* Manifesto (start side) */}
            <div className="lg:col-span-5 lg:border-e lg:border-white/10 lg:pe-12 xl:pe-14">
              <Manifesto logo={logo} tenantName={tenantName} />
            </div>

            {/* Link index */}
            <div className="lg:col-span-4 lg:px-8">
              <div className="space-y-11">
                {footerNavSections.map((section, i) => (
                  <div
                    key={section.heading}
                    className={i > 0 ? "border-t border-white/10 pt-10" : ""}
                  >
                    <IndexSection section={section} />
                  </div>
                ))}
              </div>
            </div>

            {/* Contact data column (end side) */}
            <div className="lg:col-span-3 lg:border-s lg:border-white/10 lg:ps-10 xl:ps-12">
              <ContactColumn />
            </div>
          </div>
        </div>

        {/* ── Legal strip ── */}
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p className="text-xs leading-relaxed text-white/55">
              © {year} {tenantName}. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-1.5">
              <Link
                href="/marketing/privacy"
                className="inline-flex py-1 text-xs text-white/55 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:text-[var(--brand-secondary)]"
              >
                سياسة الخصوصية
              </Link>
              <span aria-hidden="true" className="text-white/20">
                ·
              </span>
              <Link
                href="/marketing/terms"
                className="inline-flex py-1 text-xs text-white/55 transition-colors duration-150 hover:text-[var(--brand-secondary)] focus-visible:text-[var(--brand-secondary)]"
              >
                شروط الاستخدام
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}