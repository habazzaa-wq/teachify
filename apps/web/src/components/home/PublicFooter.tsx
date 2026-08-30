"use client";

import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Phone, Mail, Clock, ArrowUp } from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * The site footer as the LAST PAGE of a student's workbook (المذكرة):
 * a closing page with a ruled "review index", a handwritten closing statement,
 * and a signature line — not a row of interchangeable link columns.
 *
 * Colors are derived from the dynamic brand tokens (--brand-*), never hardcoded.
 * Direction is RTL and mirrors correctly because every geometry uses
 * logical properties (start/end, inline) rather than left/right.
 */

const DEVELOPER_WHATSAPP = "https://wa.me/201011245565";

/* ── Content (data-driven, no inline lists) ── */
const reviewLinks = [
  { label: "المراحل الدراسية", href: "/stages" },
  { label: "الكورسات", href: "/courses" },
  { label: "لوحة الطالب", href: "/student/dashboard" },
  { label: "تفاعل الطلاب", href: "/community" },
];

const followUpLinks = [
  { label: "تواصل معنا", href: "#" },
  { label: "مركز المساعدة", href: "#" },
  { label: "الأسئلة الشائعة", href: "#" },
];

const commitments = [
  { label: "سياسة الخصوصية", href: "/marketing/privacy" },
  { label: "شروط الاستخدام", href: "/marketing/terms" },
];

const contact = {
  phone: "+20 10 1124 5565",
  phoneHref: "tel:+201011245565",
  email: "hello@academy.example",
  emailHref: "mailto:hello@academy.example",
  hours: "السبت — الخميس، ٨ صباحًا حتى ٦ مساءً",
};

const socials = [
  { label: "فيسبوك", href: "#" },
  { label: "يوتيوب", href: "#" },
  { label: "انستغرام", href: "#" },
  { label: "واتساب", href: DEVELOPER_WHATSAPP },
];

/* ── Sub-components ─────────────────────────────────────────────── */

/** A single horizontal "ruled line" divider of the notebook page. */
export function FooterRule({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-px w-full ${className}`}
      style={{
        background: "linear-gradient(to left, transparent, hsl(var(--brand-footer-line) / 0.55) 12%, hsl(var(--brand-footer-line) / 0.55) 88%, transparent)",
      }}
    />
  );
}

/** The closing signature — brand as the "teacher's encouraging last line". */
export function FooterSignature({
  tenantName,
  logo,
  closing,
}: {
  tenantName: string;
  logo: string | null;
  closing: string;
}) {
  return (
    <div className="mt-10 sm:mt-12">
      <FooterRule />

      {/* Handwritten-style sign-off above the rule */}
      <div className="mt-5 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          {logo ? (
            <span
              className="flex h-9 items-center rounded-lg bg-white/95 px-2 shadow-sm"
              style={{ border: "1px solid hsl(var(--brand-secondary) / 0.4)" }}
            >
              <Image src={logo} alt={tenantName} width={96} height={22} className="h-6 w-auto" />
            </span>
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg shadow-sm"
              style={{ backgroundColor: "hsl(var(--brand-secondary))" }}
            >
              <GraduationCap className="h-5 w-5 text-[var(--brand-secondary-contrast)]" />
            </span>
          )}
          <span className="text-base font-extrabold" style={{ color: "var(--brand-footer-ink)" }}>
            {tenantName}
          </span>
        </div>

        <p
          className="text-sm leading-relaxed sm:max-w-sm sm:text-end"
          style={{ color: "hsl(var(--brand-footer-ink-muted))" }}
        >
          {closing}
        </p>
      </div>

      {/* The ruled signature line */}
      <div className="mt-5 flex items-end gap-3" aria-hidden>
        <span
          className="inline-block h-6 w-full"
          style={{
            borderBottom: "2px solid hsl(var(--brand-footer-line-soft))",
            marginInlineStart: "2.5rem",
          }}
        />
        <span
          className="pb-0.5 whitespace-nowrap text-xs"
          style={{ color: "hsl(var(--brand-footer-ink-faint))", fontFamily: "var(--font-display)" }}
        >
          توقيع المعلّم
        </span>
      </div>
    </div>
  );
}

/* ── Main footer ────────────────────────────────────────────────── */

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

  const closingStatement = `في {tenant} كل صفحة تُقرأ تنتهي، لكن الرحلة لا تتوقف — نراك في المحطة القادمة.`.replace("{tenant}", tenantName);
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      dir="rtl"
      className="relative isolate overflow-hidden"
      style={{ backgroundColor: "var(--brand-footer-bg)" }}
    >
      {/* Ruled-paper texture across the whole page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{ background: "var(--brand-footer-ruled)" }}
      />
      {/* Deeper vignette toward the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 40%, var(--brand-footer-bg-deep) 100%)" }}
      />
      {/* Notebook's red margin line on the reading start (right in RTL) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-0 hidden w-px sm:block"
        style={{ background: "color-mix(in srgb, var(--brand-secondary) 42%, transparent)" }}
      />

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        {/* Page header: subject line + "last page" label */}
        <div className="mb-10 flex items-end justify-between gap-4">
          <p
            className="text-sm"
            style={{ color: "hsl(var(--brand-footer-ink-faint))", fontFamily: "var(--font-display)" }}
          >
            المادة: رحلة التعلّم — <span className="font-bold">{tenantName}</span>
          </p>
          <p
            className="text-sm"
            style={{ color: "hsl(var(--brand-footer-ink-faint))", fontFamily: "var(--font-display)" }}
          >
            الصفحة الأخيرة
          </p>
        </div>

        {/* Closing statement — the boldest moment */}
        <h2
          className="max-w-3xl text-3xl font-bold leading-[1.6] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.6]"
          style={{ color: "var(--brand-footer-ink)", fontFamily: "var(--font-display)" }}
        >
          {closingStatement}
        </h2>

        {/* Ruled review index */}
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { eyebrow: "مراجعة", heading: "استكشف", links: reviewLinks },
            { eyebrow: "متابعة", heading: "تواصل معنا", links: followUpLinks },
            { eyebrow: "التزام", heading: "قيمة الطريق", links: commitments },
          ].map((group) => (
            <div key={group.eyebrow} className="border-t-2 pt-3" style={{ borderColor: "hsl(var(--brand-footer-line) / 0.35)" }}>
              <h3 className="flex items-baseline gap-2 text-base font-extrabold" style={{ color: "var(--brand-footer-ink)" }}>
                <span
                  className="text-xs font-bold"
                  style={{ color: "hsl(var(--brand-secondary))", fontFamily: "var(--font-display)" }}
                >
                  {group.eyebrow}
                </span>
                <span>{group.heading}</span>
              </h3>
              <ul className="mt-3 space-y-0">
                {group.links.map((link) => (
                  <li key={link.label} className="py-1">
                    <Link
                      href={link.href}
                      className="group relative inline-block py-0.5 text-sm transition-colors"
                      style={{ color: "hsl(var(--brand-footer-ink-muted))" }}
                    >
                      <span className="inline-block">{link.label}</span>
                      {/* The one interactive detail: an ink underline that draws from the reading start */}
                      <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-[1.5px] origin-right scale-x-0 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                        style={{
                          backgroundColor: "hsl(var(--brand-secondary))",
                          transformOrigin: "right",
                        }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Front-office contact — a distinct staff strip, not a 4th column */}
        <div
          className="mt-8 flex flex-col gap-3 border-t-2 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8"
          style={{ borderColor: "hsl(var(--brand-footer-line) / 0.35)" }}
        >
          <h3 className="flex shrink-0 items-baseline gap-2 text-sm font-extrabold" style={{ color: "var(--brand-footer-ink)" }}>
            <span className="text-xs font-bold" style={{ color: "hsl(var(--brand-secondary))", fontFamily: "var(--font-display)" }}>
              مكتب القبول
            </span>
            <span>فريقنا في خدمتك</span>
          </h3>
          <div className="flex flex-col gap-2 text-sm lg:flex-row lg:items-center lg:gap-6" style={{ color: "hsl(var(--brand-footer-ink-muted))" }}>
            <a href={contact.phoneHref} className="flex items-center gap-2 transition-colors hover:text-[var(--brand-footer-ink)]">
              <Phone className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--brand-secondary))" }} />
              {contact.phone}
            </a>
            <a href={contact.emailHref} className="flex items-center gap-2 transition-colors hover:text-[var(--brand-footer-ink)]">
              <Mail className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--brand-secondary))" }} />
              {contact.email}
            </a>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--brand-secondary))" }} />
              {contact.hours}
            </span>
          </div>
        </div>

        {/* Signature line */}
        <FooterSignature
          tenantName={tenantName}
          logo={logo}
          closing={`شكرًا لأنك أنهيت الصفحة معنا — فريق {tenant}.`.replace("{tenant}", tenantName)}
        />

        {/* Bottom bar: restrained social + quiet legal footnote */}
        <div className="mt-10 flex flex-col items-stretch gap-6 border-t border-white/10 pt-7 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--brand-footer-ink-faint))" }}>
            © {year} {tenantName}. جميع الحقوق محفوظة.
            <span className="mx-1.5 opacity-40">•</span>
            صُمّم ليُقرأ مثل آخر صفحة من مذكرتك.
          </p>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            {/* Social — small inline "تابعونا", not a default icon row */}
            <div className="flex flex-col items-start gap-1.5">
              <span
                className="text-xs"
                style={{ color: "hsl(var(--brand-footer-ink-faint))", fontFamily: "var(--font-display)" }}
              >
                تابعونا
              </span>
              <div className="flex items-center gap-1">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="px-2 py-0.5 text-sm transition-colors"
                    style={{ color: "hsl(var(--brand-footer-ink-muted))" }}
                    title={s.label}
                  >
                    <span className="inline-block border-b border-transparent transition-colors hover:border-[var(--brand-secondary)] hover:text-[var(--brand-footer-ink)]">
                      {s.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="العودة إلى أعلى الصفحة"
              className="group inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
              style={{ borderColor: "hsl(var(--brand-footer-line-soft))", color: "hsl(var(--brand-footer-ink-muted))" }}
            >
              <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
