"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { routes } from "@/constants/routes";
import { toWhatsAppUrl, type FooterSettings } from "@/features/footer/types";

export interface FooterContentProps {
  settings: FooterSettings;
  tenantName: string;
  logo: string | null;
  year?: number;
  /** Preview mode keeps the exact markup but blocks navigation and scrolling. */
  preview?: boolean;
  className?: string;
}

const GROUP_NUMBERS = ["01", "02", "03"];

function isHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function isDirectLink(href: string): boolean {
  return isHttpUrl(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

export function FooterContent({
  settings,
  tenantName,
  logo,
  year = new Date().getFullYear(),
  preview = false,
  className,
}: FooterContentProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  const guard = (event: MouseEvent<HTMLElement>) => {
    if (preview) event.preventDefault();
  };

  const whatsappUrl = toWhatsAppUrl(settings.contact.whatsapp);
  const primaryAction =
    whatsappUrl ||
    (settings.contact.email.trim() ? `mailto:${settings.contact.email}` : routes.community);

  const email = settings.contact.email.trim();
  const phone = settings.contact.phone.trim();
  const hours = settings.contact.hours.trim();

  const scrollToTop = () => {
    if (preview || typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <footer className={`mechanist-footer${className ? ` ${className}` : ""}`} dir="rtl">
      <div className="footer-glow" aria-hidden="true" />
      <div className="footer-grid" aria-hidden="true" />

      <div className="footer-container">
        {/* Top identity section */}
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-label">
              <span className="brand-indicator" aria-hidden="true" />
              THE FUTURE OF EDUCATION
            </div>

            <Link href={routes.home} className="brand-logo" onClick={guard}>
              {logo && !logoFailed ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo}
                    alt={tenantName}
                    onError={() => setLogoFailed(true)}
                    className="brand-logo-image"
                  />
                  <span className="brand-logo-text">{tenantName}</span>
                </>
              ) : (
                <>
                  <span className="brand-logo-text">{tenantName}</span>
                  <span className="brand-logo-dot" aria-hidden="true">.</span>
                </>
              )}
            </Link>

            <p className="brand-description">{settings.aboutText}</p>

            <Link href={primaryAction} className="brand-cta" onClick={guard}>
              <span>اكتشف عالمنا وتواصل معنا</span>
              <span className="cta-arrow" aria-hidden="true">↙</span>
            </Link>
          </div>

          {/* Small 3D brand sculpture */}
          <div className="footer-art" aria-hidden="true">
            <div className="art-orbit orbit-a" />
            <div className="art-orbit orbit-b" />

            <div className="art-object">
              <div className="art-face art-bottom" />
              <div className="art-face art-back" />
              <div className="art-face art-top">
                {/* Generic education mark — never tied to a platform initial. */}
                <svg viewBox="0 0 64 64" className="art-symbol" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="footer-mark-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" style={{ stopColor: "var(--brand-primary, #D87B63)" }} />
                      <stop offset="100%" style={{ stopColor: "var(--brand-secondary, #FFB50E)" }} />
                    </linearGradient>
                  </defs>
                  <path d="M32 13 52 24 32 35 12 24Z" fill="url(#footer-mark-grad)" />
                  <path d="M12 24h40v5H12z" style={{ fill: "var(--brand-secondary, #FFB50E)" }} fillOpacity=".72" />
                  <path d="M24 35h16l3 12H21z" fill="#fff" fillOpacity=".92" />
                  <path d="M32 24c8 1 13 5 13 11" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="45" cy="37" r="2.6" fill="#fff" />
                </svg>
              </div>
            </div>

            <span className="art-spark">✳</span>
            <span className="art-caption">BUILT FOR BETTER LEARNING</span>
          </div>
        </div>

        {/* Navigation section */}
        <nav className="footer-navigation" aria-label="روابط الفوتر">
          {settings.groups.map((group, groupIndex) => {
            const groupNumber = GROUP_NUMBERS[groupIndex] ?? String(groupIndex + 1).padStart(2, "0");

            return (
              <div className="footer-group" key={`${group.heading}-${groupIndex}`}>
                <div className="group-heading">
                  <span className="group-number">{groupNumber}</span>
                  <h3>{group.heading}</h3>
                </div>

                <ul>
                  {group.links.map((link, linkIndex) => {
                    const resolved = link.href.trim() || whatsappUrl || routes.community;
                    const linkKey = `${group.heading}-${link.label}-${resolved}-${linkIndex}`;
                    const content = (
                      <>
                        <span className="nav-dot" aria-hidden="true" />
                        <span>{link.label}</span>
                        <span className="nav-arrow" aria-hidden="true">↗</span>
                      </>
                    );

                    if (isDirectLink(resolved)) {
                      return (
                        <li key={linkKey}>
                          <a
                            href={resolved}
                            onClick={guard}
                            {...(isHttpUrl(resolved)
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                          >
                            {content}
                          </a>
                        </li>
                      );
                    }

                    return (
                      <li key={linkKey}>
                        <Link href={resolved} onClick={guard}>
                          {content}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Contact information */}
        <div className="footer-contact">
          <div className="contact-heading">
            <span className="contact-status" aria-hidden="true" />
            <span>نحن هنا لمساعدتك</span>
            {hours && <span className="contact-hours">{hours}</span>}
          </div>

          <div className="contact-details">
            {email && (
              <a href={`mailto:${email}`} onClick={guard}>
                <span className="contact-icon" aria-hidden="true">✉</span>
                {email}
              </a>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={guard}
              >
                <span className="contact-icon" aria-hidden="true">↗</span>
                تواصل عبر واتساب
                {phone && <span className="contact-number">{phone}</span>}
              </a>
            )}

            {phone && !whatsappUrl && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} onClick={guard}>
                <span className="contact-icon" aria-hidden="true">☎</span>
                {phone}
              </a>
            )}
          </div>

          <Link href={primaryAction} className="contact-more" onClick={guard}>
            جميع طرق التواصل
            <span aria-hidden="true">←</span>
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="copyright">
            © {year} {tenantName}.
            <span> جميع الحقوق محفوظة.</span>
          </div>

          <div className="footer-legal">
            <Link href={routes.publicPrivacy} onClick={guard}>
              سياسة الخصوصية
            </Link>
            <Link href={routes.publicTerms} onClick={guard}>
              شروط الاستخدام
            </Link>
          </div>

          <button type="button" className="back-to-top" onClick={scrollToTop}>
            <span>العودة للأعلى</span>
            <span className="top-arrow" aria-hidden="true">↑</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .mechanist-footer {
          /* Live platform pair from BrandThemeProvider; fallbacks match globals.css. */
          --brand-a: var(--brand-primary, #D87B63);
          --brand-b: var(--brand-secondary, #FFB50E);
          --white: #fff;
          --muted: rgba(255,255,255,.78);
          --subtle: rgba(255,255,255,.58);
          --hairline: rgba(255,255,255,.14);

          position: relative;
          isolation: isolate;
          overflow: hidden;
          background: #143b60;
          background:
            radial-gradient(900px 280px at 88% -12%, color-mix(in srgb, var(--brand-b) 20%, transparent), transparent 62%),
            radial-gradient(680px 240px at -8% 110%, color-mix(in srgb, var(--brand-a) 18%, transparent), transparent 60%),
            linear-gradient(180deg,
              color-mix(in srgb, var(--brand-a) 44%, #0d2135),
              color-mix(in srgb, var(--brand-a) 32%, #0a1b2c));
          color: var(--white);
          font-family: inherit;
        }

        .mechanist-footer::before {
          content: "";
          position: absolute;
          inset: 0 0 auto;
          height: 2px;
          background: linear-gradient(90deg,
            transparent,
            var(--brand-a) 18%,
            var(--brand-b) 50%,
            var(--brand-a) 82%,
            transparent);
          background-size: 200% 100%;
          opacity: .95;
          z-index: 2;
          pointer-events: none;
          animation: edge-shimmer 14s linear infinite;
        }

        .footer-glow {
          position: absolute;
          width: 400px;
          height: 280px;
          top: -150px;
          right: 10%;
          background: var(--brand-b);
          opacity: .24;
          filter: blur(84px);
          border-radius: 50%;
          pointer-events: none;
          z-index: -1;
          animation: glow-breathe 9s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .footer-grid {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: .55;
          background-image:
            linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px);
          background-size: 64px 64px;
          -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 88%);
          mask-image: linear-gradient(to bottom, #000 0%, transparent 88%);
        }

        .footer-container {
          width: min(1280px, calc(100% - 72px));
          margin: auto;
          position: relative;
        }

        /* Main area */

        .footer-top,
        .footer-navigation,
        .footer-contact {
          position: relative;
        }

        .footer-top::after,
        .footer-navigation::after,
        .footer-contact::after {
          content: "";
          position: absolute;
          inset-inline: 0;
          bottom: -1px;
          height: 1px;
          pointer-events: none;
          background: linear-gradient(90deg,
            transparent,
            color-mix(in srgb, var(--brand-b) 38%, transparent) 50%,
            transparent);
        }

        .footer-top {
          min-height: 250px;
          display: grid;
          grid-template-columns: 1fr 280px;
          align-items: center;
          gap: 45px;
          padding: 36px 0;
          border-bottom: 1px solid var(--hairline);
        }

        .footer-brand {
          max-width: 560px;
        }

        .brand-label {
          display: flex;
          align-items: center;
          gap: 9px;
          width: max-content;
          max-width: 100%;
          margin-bottom: 15px;
          padding: 6px 11px;
          border: 1px solid var(--hairline);
          border-radius: 999px;
          background: rgba(255,255,255,.04);
          color: var(--muted);
          font-size: 10.5px;
          letter-spacing: 2.2px;
          font-weight: 800;
        }

        .brand-indicator {
          width: 8px;
          height: 8px;
          flex: 0 0 auto;
          background: var(--brand-a);
          border-radius: 50%;
          box-shadow: 0 0 12px color-mix(in srgb, var(--brand-a) 65%, transparent);
          animation: status-pulse 3.2s ease-in-out infinite;
        }

        .footer-brand :global(.brand-logo) {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          direction: ltr;
          font-family: Georgia, serif;
          font-size: clamp(34px, 3.6vw, 48px);
          font-weight: 800;
          line-height: 1.05;
          color: white;
          letter-spacing: -1.5px;
          text-decoration: none;
          text-shadow: 0 4px 18px rgba(0,0,0,.18);
          transition: filter .25s;
        }

        .footer-brand :global(.brand-logo:hover) {
          filter: brightness(1.08);
        }

        .brand-logo-image {
          display: block;
          height: 42px;
          width: auto;
          max-width: 170px;
          object-fit: contain;
          transition: transform .25s;
        }

        .brand-logo-text {
          display: inline-block;
        }

        .brand-logo-dot {
          color: var(--brand-b);
          transition: transform .25s;
        }

        .footer-brand :global(.brand-logo:hover) .brand-logo-image {
          transform: translateY(-2px);
        }

        .footer-brand :global(.brand-logo:hover) .brand-logo-dot {
          transform: translateX(3px);
        }

        .brand-description {
          max-width: 520px;
          margin: 12px 0 20px;
          color: var(--muted);
          font-size: 14.5px;
          line-height: 1.95;
        }

        .footer-brand :global(.brand-cta) {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 18px;
          padding: 12px 18px;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--brand-b) 38%, transparent);
          border-radius: 8px;
          background: var(--brand-a);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.24),
                      0 12px 24px -18px color-mix(in srgb, var(--brand-a) 90%, transparent);
          color: var(--brand-primary-contrast, #fff);
          font-size: 14px;
          font-weight: 800;
          letter-spacing: .1px;
          text-decoration: none;
          transition: background .25s, transform .25s, box-shadow .25s, border-color .25s;
        }

        .footer-brand :global(.brand-cta)::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(100deg, transparent 35%, rgba(255,255,255,.3) 50%, transparent 65%);
          transform: translateX(120%);
          transition: transform .65s ease;
          pointer-events: none;
        }

        .footer-brand :global(.brand-cta:hover) {
          background: color-mix(in srgb, var(--brand-a) 88%, #fff);
          border-color: var(--brand-b);
          transform: translateY(-3px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.3),
                      0 16px 30px -16px color-mix(in srgb, var(--brand-a) 90%, transparent);
        }

        .footer-brand :global(.brand-cta:hover)::after {
          transform: translateX(-120%);
        }

        .footer-brand :global(.brand-cta:active) {
          transform: translateY(-1px);
        }

        .cta-arrow {
          position: relative;
          display: inline-grid;
          place-items: center;
          width: 30px;
          height: 30px;
          flex: 0 0 auto;
          border: 1px solid color-mix(in srgb, var(--brand-b) 48%, transparent);
          border-radius: 50%;
          background: color-mix(in srgb, var(--brand-b) 18%, transparent);
          color: var(--brand-b);
          font-size: 18px;
          line-height: 1;
          transition: transform .25s, background .25s;
        }

        .footer-brand :global(.brand-cta:hover) .cta-arrow {
          background: color-mix(in srgb, var(--brand-b) 28%, transparent);
          transform: translate(-3px, 3px) rotate(-8deg);
        }

        /* Small 3D object */

        .footer-art {
          height: 190px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .footer-art::before {
          content: "";
          position: absolute;
          width: 170px;
          height: 170px;
          border-radius: 50%;
          background: radial-gradient(circle,
            color-mix(in srgb, var(--brand-b) 22%, transparent),
            transparent 66%);
          filter: blur(16px);
          pointer-events: none;
        }

        .art-object {
          width: 84px;
          height: 84px;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(-32deg) rotateY(-35deg);
          animation: object-float 5s ease-in-out infinite;
          transition: transform .6s;
          will-change: transform, translate;
        }

        .footer-art:hover .art-object {
          transform: rotateX(-38deg) rotateY(-52deg) scale(1.1);
        }

        .art-face {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.26);
          backface-visibility: visible;
        }

        .art-bottom {
          background: #17436b;
          background: color-mix(in srgb, var(--brand-a) 46%, #0d2135);
          transform: translateZ(-18px) translate(9px, 9px);
          box-shadow: 0 16px 32px rgba(0,0,0,.32);
        }

        .art-back {
          background: var(--brand-b);
          transform: translateZ(0);
          transition: background .4s, box-shadow .4s;
        }

        .footer-art:hover .art-back {
          box-shadow: 0 0 24px color-mix(in srgb, var(--brand-b) 45%, transparent);
        }

        .art-top {
          display: grid;
          place-items: center;
          background: linear-gradient(140deg, #4789bd, #205581);
          background: linear-gradient(140deg,
            color-mix(in srgb, var(--brand-a) 72%, #10263e),
            color-mix(in srgb, var(--brand-b) 42%, #10263e));
          transform: translateZ(19px) translate(-7px, -7px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.36),
                      0 14px 26px rgba(0,0,0,.22);
        }

        .art-symbol {
          display: block;
          width: 50px;
          height: 50px;
          transform: translateZ(8px);
          filter: drop-shadow(0 6px 9px rgba(0,0,0,.3));
          transition: transform .6s, filter .4s;
          animation: mark-glow 5s ease-in-out infinite;
        }

        .footer-art:hover .art-symbol {
          transform: translateZ(12px) rotate(-4deg);
          filter: drop-shadow(0 9px 13px rgba(0,0,0,.36));
        }

        .art-orbit {
          position: absolute;
          width: 142px;
          height: 58px;
          border: 1px solid rgba(160,198,230,.35);
          border-color: color-mix(in srgb, var(--brand-a) 45%, transparent);
          border-radius: 50%;
          transform: rotate(-25deg);
          pointer-events: none;
          animation: orbit-drift-a 8s ease-in-out infinite;
        }

        .orbit-b {
          width: 116px;
          height: 90px;
          border-color: color-mix(in srgb, var(--brand-b) 50%, transparent);
          transform: rotate(55deg);
          animation: orbit-drift-b 9s ease-in-out infinite;
        }

        .art-spark {
          position: absolute;
          right: 46px;
          top: 22px;
          color: var(--brand-b);
          font-size: 19px;
          animation: sparkle 3s ease-in-out infinite;
        }

        .art-caption {
          position: absolute;
          bottom: 2px;
          color: color-mix(in srgb, var(--brand-b) 48%, #b9cde0);
          font-size: 9.5px;
          letter-spacing: 1.8px;
          font-weight: 800;
        }

        /* Navigation */

        .footer-navigation {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 48px;
          padding: 32px 0;
          border-bottom: 1px solid var(--hairline);
        }

        .group-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .group-heading::after {
          content: "";
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg,
            color-mix(in srgb, var(--brand-b) 32%, transparent),
            transparent);
        }

        .group-number {
          padding: 4px 8px;
          border: 1px solid color-mix(in srgb, var(--brand-b) 28%, transparent);
          border-radius: 6px;
          color: var(--brand-b);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          transition: color .25s, border-color .25s, background .25s;
        }

        .footer-group:hover .group-number {
          background: color-mix(in srgb, var(--brand-b) 12%, transparent);
          border-color: color-mix(in srgb, var(--brand-b) 55%, transparent);
        }

        .group-heading h3 {
          margin: 0;
          color: white;
          font-size: 15.5px;
          font-weight: 800;
          letter-spacing: .1px;
        }

        .footer-group ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 13px;
        }

        .footer-group li :global(a) {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-inline: -8px;
          padding: 5px 8px;
          border: 1px solid transparent;
          border-radius: 7px;
          color: var(--muted);
          text-decoration: none;
          font-size: 14px;
          line-height: 1.7;
          transition: color .2s, transform .2s, background .2s, border-color .2s;
        }

        .footer-group li :global(a) > span:nth-child(2) {
          background-image: linear-gradient(var(--brand-b), var(--brand-b));
          background-position: 0 100%;
          background-repeat: no-repeat;
          background-size: 0 1px;
          transition: background-size .25s;
        }

        .nav-dot {
          width: 5px;
          height: 5px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: var(--brand-a);
          opacity: .8;
          transition: transform .2s, background .2s;
        }

        .nav-arrow {
          color: var(--brand-b);
          font-size: 14px;
          opacity: 0;
          transform: translate(-3px, 3px);
          transition: opacity .2s, transform .2s;
        }

        .footer-group li :global(a):hover {
          background: color-mix(in srgb, var(--brand-b) 10%, transparent);
          border-color: color-mix(in srgb, var(--brand-b) 18%, transparent);
          color: white;
          transform: translateX(-4px);
        }

        .footer-group li :global(a):hover > span:nth-child(2) {
          background-size: 100% 1px;
        }

        .footer-group li :global(a):hover .nav-dot {
          background: var(--brand-b);
          transform: scale(1.7);
        }

        .footer-group li :global(a):hover .nav-arrow {
          opacity: 1;
          transform: translate(0, 0);
        }

        /* Contact strip */

        .footer-contact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 20px 0;
          border-bottom: 1px solid var(--hairline);
        }

        .contact-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          font-size: 14.5px;
          font-weight: 800;
          white-space: nowrap;
        }

        .contact-status {
          width: 8px;
          height: 8px;
          flex: 0 0 auto;
          background: var(--brand-a);
          border-radius: 50%;
          box-shadow: 0 0 12px color-mix(in srgb, var(--brand-a) 60%, transparent);
          animation: status-pulse 3.2s ease-in-out infinite;
        }

        .contact-hours,
        .contact-number {
          color: var(--subtle);
          font-size: 12px;
          font-weight: 500;
        }

        .contact-number {
          margin-inline-start: 5px;
        }

        .contact-details {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .contact-details :global(a) {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 12px;
          border: 1px solid var(--hairline);
          border-radius: 8px;
          background: rgba(255,255,255,.045);
          color: var(--muted);
          text-decoration: none;
          font-size: 13px;
          line-height: 1.6;
          transition: color .2s, background .2s, border-color .2s, transform .2s;
        }

        .contact-details :global(a):hover {
          background: color-mix(in srgb, var(--brand-b) 10%, transparent);
          border-color: color-mix(in srgb, var(--brand-b) 38%, transparent);
          color: white;
          transform: translateY(-2px);
        }

        .contact-icon {
          color: var(--brand-b);
          font-size: 16px;
          transition: transform .25s;
        }

        .contact-details :global(a):hover .contact-icon {
          transform: rotate(10deg) scale(1.14);
        }

        .footer-contact :global(.contact-more) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding-block: 6px;
          color: var(--brand-b);
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
          transition: gap .2s;
        }

        .footer-contact :global(.contact-more):hover {
          gap: 10px;
        }

        .footer-contact :global(.contact-more) span {
          font-size: 16px;
          transition: transform .25s;
        }

        .footer-contact :global(.contact-more):hover span {
          transform: translateX(-4px);
        }

        /* Bottom */

        .footer-bottom {
          min-height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding-block: 8px;
          color: var(--muted);
          font-size: 12px;
        }

        .copyright {
          font-weight: 600;
        }

        .footer-legal {
          display: flex;
          gap: 24px;
        }

        .footer-legal :global(a),
        .back-to-top {
          color: var(--muted);
          font-size: 12px;
          text-decoration: none;
          transition: color .2s;
        }

        .footer-legal :global(a):hover,
        .back-to-top:hover {
          color: white;
        }

        .footer-legal :global(a):hover {
          text-decoration: underline;
          text-decoration-color: var(--brand-b);
          text-underline-offset: 4px;
        }

        .back-to-top {
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: 0;
          padding: 0;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .top-arrow {
          display: inline-grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border: 1px solid color-mix(in srgb, var(--brand-b) 35%, transparent);
          border-radius: 50%;
          background: color-mix(in srgb, var(--brand-b) 10%, transparent);
          color: var(--brand-b);
          font-size: 15px;
          line-height: 1;
          transition: transform .25s, background .25s, border-color .25s, box-shadow .25s;
        }

        .back-to-top:hover .top-arrow {
          background: color-mix(in srgb, var(--brand-b) 20%, transparent);
          border-color: var(--brand-b);
          box-shadow: 0 8px 16px -10px color-mix(in srgb, var(--brand-b) 80%, transparent);
          transform: translateY(-3px);
        }

        .footer-brand :global(.brand-logo:focus-visible),
        .footer-brand :global(.brand-cta:focus-visible),
        .footer-group li :global(a:focus-visible),
        .contact-details :global(a:focus-visible),
        .footer-contact :global(.contact-more:focus-visible),
        .footer-legal :global(a:focus-visible),
        .back-to-top:focus-visible {
          outline: 2px solid var(--brand-b);
          outline-offset: 3px;
          border-radius: 3px;
        }

        /* Animation */

        @keyframes edge-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes object-float {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -7px; }
        }

        @keyframes glow-breathe {
          0%, 100% { opacity: .2; transform: scale(1); }
          50% { opacity: .32; transform: scale(1.08); }
        }

        @keyframes status-pulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--brand-a) 45%, transparent); }
          50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--brand-a) 0%, transparent); }
        }

        @keyframes mark-glow {
          0%, 100% { opacity: .94; filter: drop-shadow(0 6px 9px rgba(0,0,0,.28)); }
          50% { opacity: 1; filter: drop-shadow(0 6px 14px color-mix(in srgb, var(--brand-b) 40%, transparent)); }
        }

        @keyframes orbit-drift-a {
          0%, 100% { transform: rotate(-25deg) translateY(0); }
          50% { transform: rotate(-19deg) translateY(-3px); }
        }

        @keyframes orbit-drift-b {
          0%, 100% { transform: rotate(55deg) translateY(0); }
          50% { transform: rotate(61deg) translateY(3px); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: .5; transform: rotate(0deg) scale(.8); }
          50% { opacity: 1; transform: rotate(45deg) scale(1.15); }
        }

        /* Tablet */

        @media (max-width: 850px) {
          .footer-container {
            width: calc(100% - 48px);
          }

          .footer-top {
            grid-template-columns: 1fr 210px;
            gap: 28px;
          }

          .footer-navigation {
            gap: 24px;
          }

          .group-heading h3 {
            font-size: 14.5px;
          }

          .footer-group li :global(a) {
            font-size: 13.5px;
          }

          .footer-contact {
            flex-wrap: wrap;
          }

          .contact-heading {
            white-space: normal;
          }
        }

        /* Mobile */

        @media (max-width: 600px) {
          .footer-container {
            width: calc(100% - 36px);
          }

          .footer-top {
            grid-template-columns: 1fr;
            gap: 12px;
            padding-block: 26px;
          }

          .footer-art {
            grid-row: 1;
            height: 155px;
          }

          .art-object {
            width: 76px;
            height: 76px;
          }

          .art-symbol {
            width: 46px;
            height: 46px;
          }

          .art-orbit {
            width: 126px;
          }

          .art-caption {
            font-size: 9px;
          }

          .brand-label {
            font-size: 9.5px;
            letter-spacing: 1.6px;
          }

          .brand-description {
            max-width: 100%;
            font-size: 13.5px;
            line-height: 1.85;
          }

          .footer-brand :global(.brand-cta) {
            width: 100%;
            justify-content: space-between;
            font-size: 13.5px;
          }

          .footer-navigation {
            grid-template-columns: 1fr 1fr;
            gap: 24px 14px;
            padding-block: 26px;
          }

          .group-heading h3 {
            font-size: 14px;
          }

          .footer-group li :global(a) {
            font-size: 13.5px;
          }

          .footer-group:last-child {
            grid-column: 1 / -1;
          }

          .footer-contact {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
          }

          .contact-heading {
            font-size: 13.5px;
          }

          .contact-hours,
          .contact-number {
            font-size: 11.5px;
          }

          .contact-details {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }

          .contact-details :global(a) {
            font-size: 12.5px;
          }

          .footer-contact :global(.contact-more) {
            font-size: 12.5px;
          }

          .footer-bottom {
            flex-wrap: wrap;
            gap: 12px;
            padding-block: 16px;
            font-size: 11.5px;
          }

          .footer-legal :global(a),
          .back-to-top {
            font-size: 11.5px;
          }

          .copyright {
            width: 100%;
          }

          .footer-legal {
            gap: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mechanist-footer,
          .mechanist-footer::before,
          .mechanist-footer::after,
          .mechanist-footer *,
          .mechanist-footer *::before,
          .mechanist-footer *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </footer>
  );
}
