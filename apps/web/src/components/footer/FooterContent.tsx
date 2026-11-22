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
                <span className="art-symbol">M</span>
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
          --blue: #2869a5;
          --deep: #123453;
          --coral: #f66b70;
          --white: #fff;
          --muted: #b9cde0;

          position: relative;
          isolation: isolate;
          overflow: hidden;
          background: #143b60;
          color: var(--white);
          font-family: inherit;
        }

        .footer-glow {
          position: absolute;
          width: 360px;
          height: 260px;
          top: -140px;
          right: 12%;
          background: rgba(40, 105, 165, .22);
          filter: blur(70px);
          border-radius: 50%;
          pointer-events: none;
          z-index: -1;
        }

        .footer-container {
          width: min(1240px, calc(100% - 64px));
          margin: auto;
          position: relative;
        }

        /* Main area */

        .footer-top {
          min-height: 225px;
          display: grid;
          grid-template-columns: 1fr 270px;
          align-items: center;
          gap: 35px;
          padding: 30px 0;
          border-bottom: 1px solid rgba(255,255,255,.13);
        }

        .footer-brand {
          max-width: 520px;
        }

        .brand-label {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #b9cde0;
          font-size: 9px;
          letter-spacing: 2px;
          font-weight: 800;
          margin-bottom: 13px;
        }

        .brand-indicator {
          width: 7px;
          height: 7px;
          background: var(--coral);
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(246,107,112,.6);
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          direction: ltr;
          font-family: Georgia, serif;
          font-size: clamp(30px, 3.3vw, 43px);
          font-weight: bold;
          color: white;
          letter-spacing: -2px;
          text-decoration: none;
        }

        .brand-logo-image {
          display: block;
          height: 38px;
          width: auto;
          max-width: 150px;
          object-fit: contain;
        }

        .brand-logo-text {
          display: inline-block;
        }

        .brand-logo-dot {
          color: var(--coral);
        }

        .brand-description {
          max-width: 430px;
          color: var(--muted);
          font-size: 13px;
          line-height: 2;
          margin: 9px 0 17px;
        }

        .brand-cta {
          display: inline-flex;
          align-items: center;
          gap: 22px;
          padding: 10px 15px;
          background: var(--coral);
          color: white;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          border-radius: 3px;
          transition: background .25s, transform .25s;
        }

        .brand-cta:hover {
          background: #e75c64;
          transform: translateY(-3px);
        }

        .cta-arrow {
          font-size: 17px;
          transition: transform .25s;
        }

        .brand-cta:hover .cta-arrow {
          transform: translate(-3px, 3px);
        }

        /* Small 3D object */

        .footer-art {
          height: 175px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .art-object {
          width: 78px;
          height: 78px;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(-32deg) rotateY(-35deg);
          animation: object-float 5s ease-in-out infinite;
          transition: transform .6s;
        }

        .footer-art:hover .art-object {
          transform: rotateX(-38deg) rotateY(-52deg) scale(1.1);
        }

        .art-face {
          position: absolute;
          inset: 0;
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,.22);
          backface-visibility: visible;
        }

        .art-bottom {
          background: #17436b;
          transform: translateZ(-17px) translate(8px, 8px);
          box-shadow: 0 14px 30px rgba(0,0,0,.3);
        }

        .art-back {
          background: #f66b70;
          transform: translateZ(0);
        }

        .art-top {
          display: grid;
          place-items: center;
          background: linear-gradient(140deg, #4789bd, #205581);
          transform: translateZ(18px) translate(-7px, -7px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.3),
                      0 12px 24px rgba(0,0,0,.2);
        }

        .art-symbol {
          font-family: Georgia, serif;
          font-size: 37px;
          font-weight: bold;
          color: white;
          transform: translateZ(8px);
        }

        .art-orbit {
          position: absolute;
          width: 135px;
          height: 55px;
          border: 1px solid rgba(160,198,230,.35);
          border-radius: 50%;
          transform: rotate(-25deg);
          pointer-events: none;
        }

        .orbit-b {
          width: 110px;
          height: 85px;
          border-color: rgba(246,107,112,.38);
          transform: rotate(55deg);
        }

        .art-spark {
          position: absolute;
          right: 48px;
          top: 24px;
          color: var(--coral);
          font-size: 17px;
          animation: sparkle 3s ease-in-out infinite;
        }

        .art-caption {
          position: absolute;
          bottom: 1px;
          color: #91adc7;
          font-size: 8px;
          letter-spacing: 1.5px;
          font-weight: 700;
        }

        /* Navigation */

        .footer-navigation {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 45px;
          padding: 26px 0;
          border-bottom: 1px solid rgba(255,255,255,.13);
        }

        .group-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .group-number {
          color: var(--coral);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .group-heading h3 {
          margin: 0;
          color: white;
          font-size: 13px;
          font-weight: 700;
        }

        .footer-group ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 11px;
        }

        .footer-group li a {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #b9cde0;
          text-decoration: none;
          font-size: 12px;
          transition: color .2s, transform .2s;
        }

        .nav-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--coral);
          opacity: .7;
          transition: transform .2s;
        }

        .nav-arrow {
          color: var(--coral);
          opacity: 0;
          transform: translate(-3px, 3px);
          transition: all .2s;
        }

        .footer-group li a:hover {
          color: white;
          transform: translateX(-4px);
        }

        .footer-group li a:hover .nav-dot {
          transform: scale(1.8);
        }

        .footer-group li a:hover .nav-arrow {
          opacity: 1;
          transform: translate(0, 0);
        }

        /* Contact strip */

        .footer-contact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,.13);
        }

        .contact-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        .contact-status {
          width: 7px;
          height: 7px;
          background: #5cd59a;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(92,213,154,.4);
        }

        .contact-hours,
        .contact-number {
          color: var(--muted);
          font-size: 10px;
          font-weight: 400;
        }

        .contact-number {
          margin-inline-start: 4px;
        }

        .contact-details {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .contact-details a {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #c5d6e6;
          text-decoration: none;
          font-size: 11px;
          transition: color .2s;
        }

        .contact-details a:hover {
          color: white;
        }

        .contact-icon {
          color: var(--coral);
          font-size: 14px;
        }

        .contact-more {
          color: var(--coral);
          font-size: 11px;
          text-decoration: none;
        }

        .contact-more span {
          margin-right: 6px;
        }

        /* Bottom */

        .footer-bottom {
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          color: #a9bfd4;
          font-size: 10px;
        }

        .footer-legal {
          display: flex;
          gap: 20px;
        }

        .footer-legal a,
        .back-to-top {
          color: #a9bfd4;
          text-decoration: none;
          transition: color .2s;
        }

        .footer-legal a:hover,
        .back-to-top:hover {
          color: white;
        }

        .back-to-top {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: 0;
          padding: 0;
          font: inherit;
          cursor: pointer;
        }

        .top-arrow {
          color: var(--coral);
          font-size: 16px;
          transition: transform .2s;
        }

        .back-to-top:hover .top-arrow {
          transform: translateY(-4px);
        }

        /* Animation */

        @keyframes object-float {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -7px; }
        }

        @keyframes sparkle {
          0%, 100% { opacity: .5; transform: rotate(0deg) scale(.8); }
          50% { opacity: 1; transform: rotate(45deg) scale(1.15); }
        }

        /* Tablet */

        @media (max-width: 850px) {
          .footer-top {
            grid-template-columns: 1fr 190px;
            gap: 15px;
          }

          .footer-navigation {
            gap: 20px;
          }

          .footer-contact {
            flex-wrap: wrap;
          }
        }

        /* Mobile */

        @media (max-width: 600px) {
          .footer-container {
            width: calc(100% - 34px);
          }

          .footer-top {
            grid-template-columns: 1fr;
            gap: 15px;
            padding-block: 24px;
          }

          .footer-art {
            grid-row: 1;
            height: 145px;
          }

          .brand-description {
            max-width: 100%;
          }

          .footer-navigation {
            grid-template-columns: 1fr 1fr;
            gap: 25px 14px;
            padding-block: 23px;
          }

          .footer-group:last-child {
            grid-column: 1 / -1;
          }

          .footer-contact {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
          }

          .contact-details {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
          }

          .footer-bottom {
            flex-wrap: wrap;
            padding-block: 15px;
          }

          .copyright {
            width: 100%;
          }

          .footer-legal {
            gap: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
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
