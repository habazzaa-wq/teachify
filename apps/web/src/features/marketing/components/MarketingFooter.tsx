import Link from "next/link";
import { GraduationCap, Heart } from "lucide-react";
import { LogoMark } from "./MarketingNavbar";
import {
  DEVELOPER_WHATSAPP,
  FOOTER_COLUMNS,
  SITE_NAME,
  SITE_NAME_AR,
  SITE_TAGLINE,
} from "@/features/marketing/data/content";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-[hsl(var(--mk-deep-line))] bg-[hsl(var(--mk-deep))] text-[hsl(var(--mk-deep-ink))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[hsl(var(--mk-primary)/0.6)] to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-16 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label={SITE_NAME}>
              <LogoMark size={40} />
              <div>
                <div className="text-xl font-extrabold tracking-tight">{SITE_NAME}</div>
                <div className="text-xs font-semibold text-[hsl(var(--mk-deep-muted))]">
                  {SITE_NAME_AR}
                </div>
              </div>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-[hsl(var(--mk-deep-muted))]">
              {SITE_TAGLINE} — بنية تحتية متكاملة تمنح المعلمين والأكاديميات إطلاق منصاتهم
              التعليمية الخاصة بعلامتهم التجارية.
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              <a
                href={DEVELOPER_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تواصل عبر واتساب"
                className="grid h-10 w-10 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25 transition-transform hover:-translate-y-0.5"
              >
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </a>
              <a
                href="/tenant-login"
                className="mk-btn mk-btn-ghost-deep !py-2.5 text-sm"
              >
                تسجيل دخول الطالب
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[hsl(var(--mk-deep-muted))]">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="mk-footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[hsl(var(--mk-deep-line))] pt-6 text-xs text-[hsl(var(--mk-deep-muted))] sm:flex-row">
          <p className="flex items-center gap-1.5">
            © {new Date().getFullYear()} {SITE_NAME} — جميع الحقوق محفوظة. صُنعت بـ
            <Heart className="h-3 w-3 text-[hsl(var(--mk-primary))]" aria-hidden="true" />
            في العالم العربي.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/marketing/privacy" className="hover:text-[hsl(var(--mk-gold))]">
              سياسة الخصوصية
            </Link>
            <Link href="/marketing/terms" className="hover:text-[hsl(var(--mk-gold))]">
              شروط الاستخدام
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            منصة تعليمية متكاملة
          </div>
        </div>
      </div>
    </footer>
  );
}
