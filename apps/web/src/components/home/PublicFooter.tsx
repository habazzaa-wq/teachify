"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Send,
  ArrowLeft,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { env } from "@/config/env";
import { cn } from "@/lib/cn";
import { PlatformLogo } from "@/components/ui/PlatformLogo";

const DEVELOPER_WHATSAPP = "https://wa.me/201011245565";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const quickLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "الكورسات", href: "/courses" },
  { label: "المراحل الدراسية", href: "/#educational-stages" },
  { label: "المجتمع", href: "/community" },
];

const platformLinks = [
  { label: "من نحن", href: "/marketing" },
  { label: "سياسة الخصوصية", href: "/marketing/privacy" },
  { label: "الشروط والأحكام", href: "/marketing/terms" },
  { label: "الأسئلة الشائعة", href: "/marketing" },
];

const socials = [
  { label: "واتساب", href: DEVELOPER_WHATSAPP, icon: WhatsAppIcon, external: true },
  { label: "فيسبوك", href: "#", icon: Facebook, external: false },
  { label: "إكس", href: "#", icon: Twitter, external: false },
  { label: "إنستغرام", href: "#", icon: Instagram, external: false },
  { label: "لينكد إن", href: "#", icon: Linkedin, external: false },
  { label: "تيليغرام", href: "#", icon: Send, external: false },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group/link relative inline-flex items-center gap-2 text-sm text-muted-foreground/80 transition-colors duration-300 hover:text-foreground"
      >
        <span
          className="h-1.5 w-1.5 rounded-full opacity-0 transition-all duration-300 group-hover/link:opacity-100"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        <span className="relative">
          {label}
          <span
            className="absolute -bottom-0.5 start-0 h-px w-0 transition-all duration-300 group-hover/link:w-full"
            style={{ backgroundColor: "var(--brand-secondary)" }}
          />
        </span>
      </Link>
    </li>
  );
}

function FooterColumn({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <span
          className="h-4 w-1 rounded-full"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        {title}
      </h3>
      {children}
    </div>
  );
}

export function PublicFooter() {
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const year = new Date().getFullYear();

  const logo = theme === "dark"
    ? tenant?.branding?.dark_logo
    : tenant?.branding?.light_logo ?? tenant?.branding?.logo;
  const tenantName = tenant?.name ?? env.appName;

  return (
    <footer className="relative mt-16 overflow-hidden border-t bg-background/95 backdrop-blur-xl">
      {/* Brand hairline on top edge */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(to left, transparent, var(--brand-primary) 25%, var(--brand-secondary) 50%, var(--brand-primary) 75%, transparent)",
        }}
      />

      {/* Soft brand glows for depth */}
      <div
        className="pointer-events-none absolute -top-24 -start-24 h-64 w-64 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: "var(--brand-primary)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -end-24 h-64 w-64 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: "var(--brand-secondary)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            <PlatformLogo />

            {logo ? (
              <Link href="/" className="inline-flex w-fit items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 transition-colors duration-300 hover:border-[hsl(var(--border))]">
                <Image
                  src={logo}
                  alt={tenantName}
                  width={110}
                  height={30}
                  className="h-7 w-auto opacity-80 transition-opacity duration-300 hover:opacity-100"
                />
                <span className="text-xs text-muted-foreground/70">بوابة {tenantName}</span>
              </Link>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground/80">
                منصة {env.appName} التعليمية — رحلة تعلّم احترافية من المراحل الدراسية
                وحتى إتقان الكورسات، بأدوات تفاعلية ومجتمع داعم.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              {socials.map((s) => {
                const Icon = s.icon;
                const content = (
                  <span
                    className={cn(
                      "group/social relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/80 transition-all duration-300 hover:-translate-y-0.5 hover:text-[var(--brand-primary-contrast)]",
                    )}
                    style={{
                      backgroundColor: "hsl(var(--muted))",
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover/social:opacity-100"
                      style={{ backgroundColor: "var(--brand-primary)" }}
                    />
                    <Icon className="relative z-10 h-[18px] w-[18px]" />
                  </span>
                );
                return s.external ? (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                  >
                    {content}
                  </a>
                ) : (
                  <a key={s.label} href={s.href} aria-label={s.label} title={s.label}>
                    {content}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <FooterColumn title="روابط سريعة" className="lg:col-span-2">
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((l) => (
                <FooterLink key={l.href} {...l} />
              ))}
            </ul>
          </FooterColumn>

          {/* Platform */}
          <FooterColumn title="المنصة" className="lg:col-span-3">
            <ul className="flex flex-col gap-2.5">
              {platformLinks.map((l) => (
                <FooterLink key={l.href + l.label} {...l} />
              ))}
            </ul>
          </FooterColumn>

          {/* Contact */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            <FooterColumn title="تواصل معنا">
              <p className="text-sm leading-relaxed text-muted-foreground/80">
                فريق {env.appName} هنا للإجابة على استفساراتك ومساعدتك في رحلتك التعليمية.
              </p>
            </FooterColumn>

            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex w-fit items-center gap-2 overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: "#25D366", boxShadow: "0 6px 22px rgba(37,211,102,0.32)" }}
            >
              <span className="absolute -inset-[2px] rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ border: "2px solid rgba(37,211,102,0.5)" }} />
              <WhatsAppIcon className="relative z-10 h-[18px] w-[18px]" />
              <span className="relative z-10">راسلنا على واتساب</span>
              <ArrowLeft className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            </a>

            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground/80">
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
                دعم فني على مدار الساعة
              </span>
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
                مجتمع نشط للمتعلمين والمعلمين
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t py-6 sm:flex-row" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-sm text-muted-foreground/70">
            © {year} {env.appName}. جميع الحقوق محفوظة.
          </p>

          <a
            href={DEVELOPER_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground/70 transition-colors duration-300 hover:text-foreground"
          >
            <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" style={{ color: "var(--brand-secondary)" }} />
            <span>
              تطوير بواسطة{" "}
              <span className="font-bold text-foreground">Mahmoud Habazza</span>
            </span>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-white transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: "#25D366" }}
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
