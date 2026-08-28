"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useBrandColors } from "@/hooks/useBrandColors";
import { brandContrast } from "@/lib/brand";
import {
  GraduationCap, Sparkles, Send, ArrowUp, Heart, Mail, Facebook,
  Instagram, Youtube, Twitter, Linkedin, MessageCircle, BookOpen, Layers,
  Home, LayoutDashboard, HelpCircle, ShieldCheck, FileText, Phone,
  Award, Clock,
} from "lucide-react";

const DEVELOPER_WHATSAPP = "https://wa.me/201011245565";

const socials = [
  { label: "فيسبوك", icon: Facebook, href: "#" },
  { label: "إنستغرام", icon: Instagram, href: "#" },
  { label: "يوتيوب", icon: Youtube, href: "#" },
  { label: "إكس (تويتر)", icon: Twitter, href: "#" },
  { label: "لينكد إن", icon: Linkedin, href: "#" },
  { label: "واتساب", icon: MessageCircle, href: DEVELOPER_WHATSAPP },
];

const linkGroups = [
  {
    title: "روابط سريعة",
    links: [
      { label: "الرئيسية", href: "/", icon: Home },
      { label: "المراحل الدراسية", href: "/#educational-stages", icon: Layers },
      { label: "الكورسات", href: "/courses", icon: BookOpen },
      { label: "لوحة الطالب", href: "/student/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "خدماتنا",
    links: [
      { label: "الكورسات والمحتوى", href: "/courses", icon: BookOpen },
      { label: "الاختبارات والتقييمات", href: "#", icon: FileText },
      { label: "المتابعة الأكاديمية", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "الشهادات المعتمدة", href: "#", icon: Award },
    ],
  },
  {
    title: "الدعم والقانوني",
    links: [
      { label: "تواصل معنا", href: "#", icon: Phone },
      { label: "مركز المساعدة", href: "#", icon: HelpCircle },
      { label: "الأسئلة الشائعة", href: "#", icon: HelpCircle },
      { label: "سياسة الخصوصية", href: "#", icon: ShieldCheck },
      { label: "الشروط والأحكام", href: "#", icon: FileText },
    ],
  },
];

const trustItems = [
  { icon: Award, label: "شهادات موثوقة" },
  { icon: Clock, label: "دعم على مدار الساعة" },
  { icon: Sparkles, label: "محتوى محدّث أولًا بأول" },
];

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function PublicFooter() {
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const platformBranding = useTenantStore((s) => s.platformBranding);
  const { primary, secondary } = useBrandColors();

  const brandLogo = platformBranding?.logo ?? tenant?.branding?.logo ?? null;
  const logo = theme === "dark"
    ? platformBranding?.darkLogo ?? tenant?.branding?.dark_logo ?? brandLogo
    : platformBranding?.lightLogo ?? tenant?.branding?.light_logo ?? brandLogo;
  const tenantName = platformBranding?.name ?? tenant?.name ?? "أكاديميتي";

  const primaryContrast = useMemo(() => brandContrast(primary), [primary]);
  const year = useMemo(() => new Date().getFullYear(), []);

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return;
    setSubscribed(true);
    setEmail("");
  };

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="community-theme relative isolate overflow-hidden border-t bg-background">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.5] bg-grid [mask-image:radial-gradient(120%_80%_at_50%_0%,black,transparent_75%)]"
        />
        <div
          className="absolute -top-32 -start-24 h-72 w-72 rounded-full blur-3xl opacity-20 animate-pulse-soft"
          style={{ background: `radial-gradient(circle, ${primary}, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-40 -end-20 h-80 w-80 rounded-full blur-3xl opacity-20 animate-pulse-soft"
          style={{ background: `radial-gradient(circle, ${secondary}, transparent 70%)`, animationDelay: "1.2s" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{
            background: `linear-gradient(to top, ${primary}10, transparent)`,
          }}
        />
      </div>

      {/* Top brand hairline */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(to left, transparent, ${primary}55 25%, ${secondary}50 50%, ${primary}55 75%, transparent)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 gap-10 py-14 lg:grid-cols-12 lg:gap-8">
          {/* Brand block */}
          <div className="lg:col-span-4">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              {logo ? (
                <Image
                  src={logo}
                  alt={tenantName}
                  width={140}
                  height={36}
                  className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.04]"
                />
              ) : (
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
                  style={{ backgroundColor: primary, boxShadow: `0 6px 22px ${primary}55` }}
                >
                  <GraduationCap className="h-5 w-5" style={{ color: primaryContrast }} />
                </span>
              )}
              <span className="text-xl font-extrabold tracking-tight" style={{ color: primary }}>
                {tenantName}
              </span>
            </Link>

            <p className="mt-4 text-sm font-semibold text-foreground/80">
              منصة تعليمية متكاملة تنقلك من حيث أنت إلى حيث تطمح.
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              نقدّم لك رحلة تعلّم هادفة عبر مراحل دراسية منظّمة وكورسات احترافية،
              مع متابعة أكاديمية ومحتوى يواكب الاحتياج الفعلي لكل طالب.
            </p>

            {/* Social */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="group relative flex h-9 w-9 items-center justify-center rounded-xl border text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 hover:text-[var(--brand-primary-contrast)]"
                    style={{ borderColor: "hsl(var(--border))" }}
                  >
                    <span
                      className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 6px 18px ${primary}40` }}
                    />
                    <Icon className="relative z-10 h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {linkGroups.map((group) => (
            <nav key={group.title} className="lg:col-span-3" aria-label={group.title}>
              <h3 className="relative mb-4 ps-3 text-sm font-bold text-foreground">
                <span
                  className="absolute inset-y-1 start-0 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${primary}, ${secondary})` }}
                />
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-all duration-300 hover:bg-muted/40 hover:ps-3 hover:text-foreground"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors duration-300 group-hover:text-[var(--brand-primary)]" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        {/* ── Newsletter band ── */}
        <div
          className="relative mb-12 overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: `${primary}33`,
            background: `linear-gradient(135deg, ${primary}12, ${secondary}0f)`,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -end-10 h-44 w-44 rounded-full blur-3xl opacity-30"
            style={{ background: `radial-gradient(circle, ${secondary}, transparent 70%)` }}
          />
          <div className="relative grid items-center gap-6 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" style={{ color: primary }} />
                النشرة البريدية
              </div>
              <h3 className="mt-3 text-lg font-bold text-foreground sm:text-xl">
                كن على اطلاع دائم بجديد المنصة
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                اشترك ليصلك جديد الكورسات والمراحل الدراسية وأحدث التحديثات مباشرة.
              </p>
            </div>

            <div className="w-full">
              {subscribed ? (
                <div
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium"
                  style={{ borderColor: `${primary}40`, background: `${primary}10`, color: primary }}
                  role="status"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: primary, color: primaryContrast }}
                  >
                    <Send className="h-4 w-4" />
                  </span>
                  تم اشتراكك بنجاح! سنبقيك على اطلاع بكل جديد.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-2 sm:flex-row" noValidate>
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground/60" />
                    <input
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="بريدك الإلكتروني"
                      aria-label="البريد الإلكتروني"
                      className="h-11 w-full rounded-2xl border border-border bg-background/70 ps-10 pe-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/60 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/30"
                    />
                  </div>
                  <button
                    type="submit"
                    className="group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 text-sm font-bold transition-all duration-300 hover:scale-[1.03] active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, color: primaryContrast, boxShadow: `0 8px 22px ${primary}40` }}
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <Send className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">اشترك</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Trust strip ── */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm font-medium text-foreground/80 backdrop-blur sm:justify-start"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: `${primary}14`, color: primary }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-5 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground">
            © {year} {tenantName}. جميع الحقوق محفوظة.
          </p>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>طُوّر بكل شغف بواسطة</span>
            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold transition-colors duration-300 hover:opacity-80"
              style={{ color: primary }}
            >
              Mahmoud Habazza
              <MessageCircle className="h-3.5 w-3.5" style={{ color: "#25D366" }} />
            </a>
            <Heart className="h-3.5 w-3.5 fill-current" style={{ color: secondary }} />
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="العودة إلى الأعلى"
            className="group inline-flex h-9 w-9 items-center justify-center rounded-full border text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 hover:text-[var(--brand-primary-contrast)]"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <span
              className="absolute h-9 w-9 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            />
            <ArrowUp className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
