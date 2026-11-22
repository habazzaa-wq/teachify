"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
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
 * THE DIGITAL DEPTH — a type-led footer with a sculptural CSS-3D centerpiece.
 *
 * Color roles (verbatim from globals.css — no invented colors, no gradients):
 *   --brand-primary          architectural surface
 *   --brand-secondary        the single accent: rings, rules, CTA, colophon
 *   --brand-primary-contrast editorial ink on the surface
 *   --brand-secondary-contrast ink on the accent field
 *
 * Motion is transform/opacity only, paused outside the viewport, disabled for
 * reduced-motion and simplified to a static composition on small screens.
 */

const MOTION_CSS = `
.dd-stage { perspective: 900px; }
.dd-parallax { transform: translate3d(var(--dd-x, 0px), var(--dd-y, 0px), 0); transition: transform 400ms cubic-bezier(.22,1,.36,1); }
.dd-float { animation: dd-float 7s ease-in-out infinite; animation-play-state: paused; }
.dd-rig { transform-style: preserve-3d; }
.dd-ring { position: absolute; border-radius: 9999px; animation-play-state: paused; will-change: transform; }
.dd-ring-a { inset: 1%; border: 1px solid color-mix(in srgb, var(--brand-secondary) 45%, transparent); animation: dd-ring-a 28s linear infinite; animation-play-state: paused; }
.dd-ring-b { inset: 13%; border: 2px solid transparent; border-top-color: var(--brand-secondary); border-right-color: color-mix(in srgb, var(--brand-secondary) 30%, transparent); border-bottom-color: color-mix(in srgb, var(--brand-primary-contrast) 50%, transparent); border-left-color: color-mix(in srgb, var(--brand-secondary) 75%, transparent); animation: dd-ring-b 22s linear infinite; animation-play-state: paused; }
.dd-ring-c { inset: 26%; border: 1px solid color-mix(in srgb, var(--brand-primary-contrast) 38%, transparent); animation: dd-ring-c 34s linear infinite; animation-play-state: paused; }
.dd-plane { position: absolute; left: 50%; top: 50%; width: 34%; height: 34%; margin-left: -17%; margin-top: -17%; border: 1px solid color-mix(in srgb, var(--brand-secondary) 75%, transparent); }
.dd-plane-2 { transform: rotateZ(45deg) translateZ(22px); border-color: color-mix(in srgb, var(--brand-secondary) 50%, transparent); }
.dd-plane-3 { transform: rotateZ(45deg) translateZ(44px); border-color: color-mix(in srgb, var(--brand-primary-contrast) 40%, transparent); }
.dd-core-dot { position: absolute; left: 50%; top: 50%; width: 9%; height: 9%; margin-left: -4.5%; margin-top: -4.5%; background: var(--brand-secondary); transform: translateZ(62px); }
.dd-link { position: relative; display: inline-block; transition: color 250ms ease, opacity 250ms ease; }
.dd-link::after { content: ""; position: absolute; right: 0; bottom: -2px; width: 100%; height: 1px; background: var(--brand-secondary); transform: scaleX(0); transform-origin: right center; transition: transform 350ms cubic-bezier(.22,1,.36,1); }
.dd-link:hover::after, .dd-link:focus-visible::after { transform: scaleX(1); }
.dd-cta { position: relative; overflow: hidden; isolation: isolate; }
.dd-cta::before { content: ""; position: absolute; inset: 0; z-index: -1; background: color-mix(in srgb, var(--brand-primary-contrast) 16%, transparent); transform: translateX(-101%); transition: transform 450ms cubic-bezier(.22,1,.36,1); }
.dd-cta:hover::before, .dd-cta:focus-visible::before { transform: translateX(0); }
.dd-reveal { transition: opacity 700ms ease, transform 700ms cubic-bezier(.22,1,.36,1); }
[data-motion="ready"]:not([data-revealed="true"]) .dd-reveal { opacity: 0; transform: translateY(16px); }
[data-inview="true"] .dd-float, [data-inview="true"] .dd-ring { animation-play-state: running; }
@keyframes dd-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes dd-ring-a { from { transform: rotateX(68deg) rotateZ(0deg); } to { transform: rotateX(68deg) rotateZ(360deg); } }
@keyframes dd-ring-b { from { transform: rotateY(62deg) rotateZ(0deg); } to { transform: rotateY(62deg) rotateZ(-360deg); } }
@keyframes dd-ring-c { from { transform: rotateX(74deg) rotateZ(30deg); } to { transform: rotateX(74deg) rotateZ(390deg); } }
@media (max-width: 639px) {
  .dd-stage { max-width: 220px; }
  .dd-ring-a, .dd-ring-c { display: none; }
  .dd-ring-b { animation: none !important; transform: rotateY(58deg) !important; }
  .dd-float { animation: none !important; }
  .dd-parallax { transform: none !important; transition: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  .dd-float, .dd-ring { animation: none !important; }
  .dd-parallax { transform: none !important; transition: none !important; }
  .dd-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
  .dd-link::after, .dd-cta::before { transition: none !important; }
}
`;

const inkMuted: CSSProperties = {
  color: "color-mix(in srgb, var(--brand-primary-contrast) 72%, transparent)",
};
const accentRule: CSSProperties = { backgroundColor: "var(--brand-secondary)" };
const hairline: CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--brand-primary-contrast) 22%, transparent)",
};
const accentInk: CSSProperties = { color: "var(--brand-secondary)" };
const microLabel = "text-[10px] font-bold tracking-[0.22em]";

export interface FooterContentProps {
  settings: FooterSettings;
  tenantName: string;
  logo: string | null;
  year?: number;
  /** Preview mode keeps the exact markup but blocks navigation and scrolling. */
  preview?: boolean;
  className?: string;
}

function useDepthMotion() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.dataset.motion = "ready";

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        el.dataset.inview = entry.isIntersecting ? "true" : "false";
        if (entry.isIntersecting && !el.dataset.revealed) el.dataset.revealed = "true";
      },
      { rootMargin: "80px 0px 80px 0px", threshold: 0.05 },
    );
    observer.observe(el);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !fine) return () => observer.disconnect();

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--dd-x", `${x.toFixed(2)}px`);
        el.style.setProperty("--dd-y", `${y.toFixed(2)}px`);
        frame = 0;
      });
    };
    const onLeave = () => {
      el.style.setProperty("--dd-x", "0px");
      el.style.setProperty("--dd-y", "0px");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      observer.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

function Sculpture() {
  return (
    <div className="dd-stage relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]" aria-hidden="true">
      <div className="dd-parallax absolute inset-0">
        <div className="dd-float absolute inset-0">
          <div className="dd-rig absolute inset-0">
            <div className="dd-ring dd-ring-a" />
            <div className="dd-ring dd-ring-b" />
            <div className="dd-ring dd-ring-c" />
            <div className="dd-plane" />
            <div className="dd-plane dd-plane-2" />
            <div className="dd-plane dd-plane-3" />
            <div className="dd-core-dot" />
          </div>
        </div>
      </div>
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
      <div aria-hidden="true" className="mb-4 h-0.5 w-7" style={accentRule} />
      <h3 className={`${microLabel} text-[color:var(--brand-primary-contrast)]`}>{group.heading}</h3>
      <ul className="mt-4 space-y-1.5">
        {group.links.map((link) => {
          const key = `${group.heading}-${link.label}-${link.href}`;
          const resolved = link.href.trim() !== "" ? link.href : whatsappUrl || routes.community;
          const className = "dd-link text-[13px] leading-6";

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

function ContactZone({
  contact,
  guard,
}: {
  contact: FooterSettings["contact"];
  guard: (event: MouseEvent<HTMLElement>) => void;
}) {
  const rows = buildContactRows(contact);
  if (rows.length === 0) return null;

  return (
    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map((row) => {
        const Icon = row.Icon;
        const value = row.href ? (
          <a
            href={row.href}
            {...(row.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            onClick={guard}
            className="dd-link text-[13px] leading-6"
          >
            {row.value}
          </a>
        ) : (
          <span className="text-[13px] leading-6">{row.value}</span>
        );

        return (
          <div key={row.label} className="min-w-0">
            <p className={microLabel} style={inkMuted}>
              {row.label}
            </p>
            <div className="mt-2.5 flex items-start gap-2.5">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={accentInk} aria-hidden="true" />
              {value}
            </div>
          </div>
        );
      })}
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
    <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
      {entries.map((entry) => {
        const Icon = entry.Icon;
        const href = socials[entry.key];
        return (
          <li key={entry.key}>
            <a
              href={href}
              {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={guard}
              className="dd-link group inline-flex items-center gap-2.5 text-[12px] font-bold tracking-wide"
            >
              <Icon
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5"
                style={accentInk}
                aria-hidden="true"
              />
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
      className="group inline-flex items-center gap-1.5 text-[11px] font-bold transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      <span>أعلى الصفحة</span>
      <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
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
  const ref = useDepthMotion();
  const [logoFailed, setLogoFailed] = useState(false);
  const guard = (event: MouseEvent<HTMLElement>) => {
    if (preview) event.preventDefault();
  };

  const whatsappUrl = toWhatsAppUrl(settings.contact.whatsapp);
  const primaryAction =
    whatsappUrl || (settings.contact.email ? `mailto:${settings.contact.email}` : routes.community);

  return (
    <footer
      ref={ref}
      dir="rtl"
      className={className}
      style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
    >
      <style>{MOTION_CSS}</style>

      {/* HERO — asymmetric: editorial type against the sculptural anchor */}
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-10 pt-10 sm:px-8 sm:pb-12 sm:pt-12 lg:px-12 lg:pb-16 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="dd-reveal min-w-0" style={{ transitionDelay: "40ms" }}>
            <div className="flex items-center gap-3.5">
              <span aria-hidden="true" className="h-px w-10" style={accentRule} />
              <p className={microLabel} style={inkMuted}>
                {settings.tagline}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-5">
              {logo && !logoFailed && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={tenantName}
                  onError={() => setLogoFailed(true)}
                  className="h-10 w-10 object-contain"
                />
              )}
              <h2 className="font-display text-[52px] font-bold leading-[0.92] tracking-tight sm:text-[76px] lg:text-[92px]">
                {tenantName}
              </h2>
            </div>

            <p className="mt-7 max-w-lg text-[14px] leading-7" style={inkMuted}>
              {settings.aboutText}
            </p>

            <a
              href={primaryAction}
              {...(whatsappUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={guard}
              className="dd-cta group mt-9 inline-flex h-12 items-center gap-4 px-7 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary-contrast)]"
              style={{ backgroundColor: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }}
            >
              <span>تواصل معنا</span>
              <ArrowLeft
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
                aria-hidden="true"
              />
            </a>
          </div>

          <div className="dd-reveal" style={{ transitionDelay: "160ms" }}>
            <Sculpture />
          </div>
        </div>
      </div>

      {/* NAVIGATION ZONES — ruled editorial bands, no column grid */}
      <div className="border-t" style={{ borderTopColor: "color-mix(in srgb, var(--brand-primary-contrast) 22%, transparent)" }}>
        <div
          className={
            preview
              ? "mx-auto w-full max-w-[1280px] px-5 py-9 sm:px-7"
              : "mx-auto w-full max-w-[1280px] px-5 py-9 sm:px-8 lg:px-12 lg:py-10"
          }
        >
          <nav aria-label="روابط الفوتر" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:flex sm:gap-0">
            {settings.groups.map((group, index) => (
              <Fragment key={`${group.heading}-${group.links.length}`}>
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="hidden w-px self-stretch sm:block"
                    style={{ backgroundColor: "color-mix(in srgb, var(--brand-primary-contrast) 22%, transparent)", marginInline: "1.75rem" }}
                  />
                )}
                <div className="min-w-0 sm:flex-1">
                  <LinkGroup group={group} whatsappUrl={whatsappUrl} guard={guard} />
                </div>
              </Fragment>
            ))}
          </nav>

          <div aria-hidden="true" className="my-7 h-px w-full" style={hairline} />
          <ContactZone contact={settings.contact} guard={guard} />

          <div aria-hidden="true" className="my-7 h-px w-full" style={hairline} />
          <SocialZone socials={settings.socials} guard={guard} />
        </div>
      </div>

      {/* INDEPENDENT ACCENT FIELD — solid secondary, hard edge */}
      <div
        className="py-4"
        style={{ backgroundColor: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }}
      >
        <div
          className={
            preview
              ? "mx-auto flex w-full max-w-[1280px] flex-col gap-2 px-5 text-[11px] sm:px-7 sm:flex-row sm:items-center sm:justify-between"
              : "mx-auto flex w-full max-w-[1280px] flex-col gap-2 px-5 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"
          }
        >
          <p className="font-semibold">© {year} {tenantName}. جميع الحقوق محفوظة.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href={routes.publicPrivacy}
              onClick={guard}
              className="underline underline-offset-2 transition-opacity duration-200 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              سياسة الخصوصية
            </Link>
            <Link
              href={routes.publicTerms}
              onClick={guard}
              className="underline underline-offset-2 transition-opacity duration-200 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
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
