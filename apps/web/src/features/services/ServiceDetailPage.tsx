"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  ListChecks,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { routes } from "@/constants/routes";
import { toAbsoluteAssetUrl } from "@/lib/url";
import type { ServiceRecord } from "./types";
import { PRIMARY, SECONDARY, initials, tint, whatsappLink } from "./ui";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-extrabold"
      style={{
        background: tint(PRIMARY, 14),
        color: PRIMARY,
        border: `1px solid ${tint(PRIMARY, 30)}`,
      }}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BadgeCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: tint(PRIMARY, 12), color: PRIMARY }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] font-medium text-muted-foreground">{label}</span>
        <span className="block text-xs font-extrabold text-foreground">{value}</span>
      </span>
    </div>
  );
}

/* ─────────────────────── Cover ─────────────────────── */

function ServiceCover({ service }: { service: ServiceRecord }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = toAbsoluteAssetUrl(service.image_url);
  const highlights = service.highlights ?? [];
  const highlightLabel =
    highlights.length === 1
      ? "ميزة واحدة واضحة"
      : highlights.length === 2
        ? "ميزتان واضحتان"
        : highlights.length <= 10
          ? `${highlights.length} مزايا واضحة`
          : `${highlights.length} ميزة واضحة`;

  return (
    <div className="relative mx-auto w-full max-w-[460px]" style={{ perspective: "1100px" }}>
      <div
        aria-hidden="true"
        className="absolute -start-3 top-4 h-full w-full rounded-2xl border border-border/60 bg-muted/25"
        style={{ transform: "translateY(10px) scale(0.975)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "0 24px 50px -34px rgba(0,0,0,0.75)" }}
      >
        <div className="aspect-[4/3] overflow-hidden">
          {image && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={service.title}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"
              style={{
                background: `radial-gradient(circle at 28% 18%, ${tint(PRIMARY, 18)}, transparent 62%), radial-gradient(circle at 82% 82%, ${tint(SECONDARY, 14)}, transparent 58%)`,
              }}
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card/70 backdrop-blur-sm"
                style={{ color: PRIMARY }}
              >
                <BriefcaseBusiness className="h-7 w-7" />
              </span>
              <span className="max-w-[85%] text-sm font-extrabold leading-7 text-foreground">
                {service.title}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <span className="text-[11px] font-semibold text-muted-foreground">صورة الخدمة</span>
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold" style={{ color: PRIMARY }}>
            <Check className="h-3.5 w-3.5" />
            {highlightLabel}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────── Content section ─────────────────────── */

function ContentSection({
  index,
  title,
  icon: Icon,
  children,
}: {
  index: string;
  title: string;
  icon: typeof ListChecks;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <span className="text-[11px] font-extrabold tabular-nums" style={{ color: PRIMARY }}>
          {index}
        </span>
        <Icon className="h-4 w-4" style={{ color: SECONDARY }} />
        <h2 className="text-base font-extrabold text-foreground sm:text-lg">{title}</h2>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

/* ─────────────────────── Contact card ─────────────────────── */

function ContactCard({ service }: { service: ServiceRecord }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div
        className="h-[3px]"
        style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
      />
      <div className="p-5">
        <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground">مسؤول الخدمة</p>
        <div className="mt-4 flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-foreground"
            style={{ background: tint(SECONDARY, 20) }}
          >
            {initials(service.contact_name ?? "فريق الخدمات")}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-extrabold text-foreground">
              {service.contact_name || "فريق الخدمات"}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground" dir="ltr">
              {service.contact_phone}
            </p>
          </div>
        </div>

        <a
          href={whatsappLink(service.contact_phone)}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-extrabold text-white transition-transform hover:scale-[1.02]"
        >
          <Send className="h-4 w-4" />
          ابدأ المحادثة
        </a>
        <Link
          href={routes.publicServices}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs font-bold text-foreground transition-colors hover:border-[color:var(--brand-primary)]"
        >
          تصفح باقي الخدمات
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>

        <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[11px] leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: PRIMARY }} />
          تواصل مباشرة مع المسؤول لترتيب التفاصيل والبدء في الخدمة.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Related services ─────────────────────── */

function RelatedServices({ services }: { services: ServiceRecord[] }) {
  if (!services.length) return null;

  return (
    <section className="mt-14 border-t border-border pt-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground">اكتشف المزيد</p>
          <h2 className="mt-1 text-lg font-extrabold text-foreground sm:text-xl">خدمات ذات صلة</h2>
        </div>
        <Link
          href={routes.publicServices}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold"
          style={{ color: PRIMARY }}
        >
          كل الخدمات
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <Link
            key={service.id}
            href={`${routes.publicServices}/${service.id}`}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-[color:var(--brand-primary)]"
          >
            <span className="text-[10px] font-extrabold tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 text-sm font-extrabold leading-6 text-foreground">{service.title}</h3>
            {service.summary && (
              <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">
                {service.summary}
              </p>
            )}
            <span
              className="mt-4 inline-flex items-center gap-1 text-[11px] font-extrabold"
              style={{ color: PRIMARY }}
            >
              عرض الخدمة
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── Page ─────────────────────── */

export function ServiceDetailPage({
  service,
  related,
}: {
  service: ServiceRecord;
  related: ServiceRecord[];
}) {
  const highlights = service.highlights ?? [];
  const description = service.description?.trim() || service.summary?.trim();

  return (
    <div dir="rtl" className="min-h-screen bg-background font-sans text-foreground">
      <section className="relative w-full overflow-hidden border-b border-border/70 bg-background">
        <div className="hero-backdrop pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -start-32 -top-24 h-[380px] w-[380px] rounded-full blur-[110px]"
          style={{ background: tint(PRIMARY, 18) }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -end-28 bottom-0 h-[320px] w-[320px] rounded-full blur-[100px]"
          style={{ background: tint(SECONDARY, 14) }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Eyebrow>تفاصيل الخدمة</Eyebrow>
          </motion.div>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)] lg:gap-14">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.04 }}
                className="text-3xl font-extrabold leading-[1.25] text-foreground sm:text-4xl lg:text-[2.75rem]"
              >
                {service.title}
              </motion.h1>

              {service.summary && (
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.09 }}
                  className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base"
                >
                  {service.summary}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.13 }}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <a
                  href={whatsappLink(service.contact_phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold transition-transform hover:scale-[1.02]"
                  style={{
                    background: PRIMARY,
                    color: "var(--brand-primary-contrast)",
                    boxShadow: `0 12px 26px -16px ${PRIMARY}`,
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  تواصل الآن
                </a>
                <Link
                  href={routes.publicServices}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-xs font-extrabold text-foreground transition-colors hover:border-[color:var(--brand-primary)]"
                >
                  العودة للخدمات
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </motion.div>

              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-4 border-t border-border pt-5">
                <MetaItem
                  icon={BadgeCheck}
                  label="مسؤول الخدمة"
                  value={service.contact_name || "فريق الخدمات"}
                />
                <MetaItem icon={GraduationCap} label="نوع الخدمة" value="خدمة تعليمية مخصصة" />
              </div>
            </div>

            <ServiceCover service={service} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div className="min-w-0 space-y-10">
            <ContentSection index="01" title="نظرة عامة" icon={BriefcaseBusiness}>
              <p className="whitespace-pre-line text-sm leading-9 text-muted-foreground">
                {description ||
                  "تواصل مع مسؤول الخدمة للتعرف على التفاصيل الكاملة وترتيب الخطوات المناسبة لك."}
              </p>
            </ContentSection>

            {highlights.length > 0 && (
              <ContentSection index="02" title="ما الذي ستحصل عليه" icon={ListChecks}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {highlights.map((highlight, index) => (
                    <div
                      key={`${service.id}-highlight-${index}`}
                      className="flex items-start gap-3 rounded-xl border border-border bg-muted/25 px-4 py-3.5"
                    >
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold tabular-nums"
                        style={{ background: tint(PRIMARY, 12), color: PRIMARY }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm leading-7 text-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </ContentSection>
            )}

            <ContentSection index="03" title="كيف تبدأ؟" icon={MessageCircle}>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: "راجع التفاصيل", desc: "اقرأ نظرة عامة والمزايا قبل أي خطوة." },
                  { title: "تواصل مع المسؤول", desc: "أرسل رسالة واتساب واسأل ما تحتاجه." },
                  { title: "اتفق على الخطة", desc: "حدد التفاصيل والوقت المناسب معاً." },
                ].map((step, index) => (
                  <div key={step.title} className="rounded-xl border border-border bg-card p-4">
                    <span className="text-[11px] font-extrabold" style={{ color: PRIMARY }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 text-xs font-extrabold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-[11px] leading-6 text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </ContentSection>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ContactCard service={service} />
          </aside>
        </div>

        <RelatedServices services={related} />

        <div className="relative mt-12 overflow-hidden rounded-[1.75rem] border border-border bg-muted/25 px-6 py-9 text-center sm:px-10">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
            style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
            aria-hidden="true"
          />
          <h2 className="text-lg font-extrabold text-foreground sm:text-xl">
            تبحث عن خطوتك التالية؟
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
            استكشف الكورسات والمحتوى التعليمي، أو ارجع إلى قائمة الخدمات لاختيار ما يناسبك.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={routes.publicCourse}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold transition-transform hover:scale-[1.02]"
              style={{ background: PRIMARY, color: "var(--brand-primary-contrast)" }}
            >
              <GraduationCap className="h-4 w-4" />
              استكشف الكورسات
            </Link>
            <Link
              href={routes.publicServices}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-xs font-extrabold text-foreground transition-colors hover:border-[color:var(--brand-primary)]"
            >
              كل الخدمات
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
