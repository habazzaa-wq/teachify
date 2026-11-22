"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpDown,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CircleHelp,
  GraduationCap,
  Lightbulb,
  ListChecks,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Target,
  Users,
  X,
  ExternalLink,
} from "lucide-react";
import { api } from "@/services/api/axios";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { formatNumber } from "@/lib/format";
import type { ServiceRecord } from "./types";
import { PRIMARY, SECONDARY, initials, tint, whatsappLink } from "./ui";
import { ServicesShowcase3D } from "./ServicesShowcase3D";

type Service = ServiceRecord;

type SortMode = "default" | "title" | "highlights";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-extrabold"
      style={{
        background: tint(PRIMARY, 14),
        color: PRIMARY,
        border: `1px solid ${tint(PRIMARY, 30)}`,
      }}
    >
      <BriefcaseBusiness className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

/* ───────────────────────── Hero ───────────────────────── */

function Hero({
  tenantName,
  stats,
  loading,
}: {
  tenantName: string;
  stats: { services: number; features: number; experts: number };
  loading: boolean;
}) {
  const statItems = [
    { icon: BriefcaseBusiness, value: stats.services, label: "خدمة متاحة", color: PRIMARY },
    { icon: ListChecks, value: stats.features, label: "ميزة واضحة", color: SECONDARY },
    { icon: Users, value: stats.experts, label: "خبير ومسؤول", color: "#22C55E" },
  ];

  return (
    <section dir="rtl" className="relative w-full overflow-hidden border-b border-border/70 bg-background">
      <div className="hero-backdrop pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -start-40 -top-24 h-[420px] w-[420px] rounded-full blur-[120px]"
        style={{ background: tint(PRIMARY, 20) }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -end-32 bottom-0 h-[360px] w-[360px] rounded-full blur-[110px]"
        style={{ background: tint(SECONDARY, 16) }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:gap-14">
          <div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <SectionLabel>خدمات تعليمية مخصصة</SectionLabel>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-sans mt-5 text-4xl font-bold leading-[1.2] text-foreground sm:text-5xl lg:text-6xl"
            >
              خدماتنا<span style={{ color: PRIMARY }}>.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base"
            >
              {tenantName
                ? `اكتشف الخدمات التعليمية التي يقدمها ${tenantName}، وتواصل مباشرة مع مقدم الخدمة المناسب لاحتياجك.`
                : "اكتشف خدماتنا التعليمية المصممة لمساعدتك على التقدم، وتواصل مباشرة مع مقدم الخدمة المناسب لك."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-8 grid grid-cols-3 gap-2 sm:gap-3"
            >
              {statItems.map(({ icon: Icon, value, label, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/70 px-2 py-4 text-center backdrop-blur-sm sm:flex-row sm:justify-start sm:px-4 sm:text-start"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: tint(color, 14), color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-lg font-extrabold tabular-nums text-foreground">
                      {loading ? "…" : formatNumber(value)}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">{label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <ServicesShowcase3D />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

/* ─────────────────────── Service card ─────────────────────── */

function ServiceCard({
  service,
  index,
  onOpen,
}: {
  service: Service;
  index: number;
  onOpen: (service: Service) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const highlights = service.highlights ?? [];
  const hasImage = Boolean(service.image_url) && !imageFailed;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -5 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:border-[color:var(--brand-primary)] hover:shadow-xl"
    >
      <Link
        href={`/services/${service.id}`}
        aria-label={`فتح صفحة ${service.title}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary)]"
      />

      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <div
          className="absolute inset-x-0 top-0 h-1 opacity-80 transition-opacity group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
        />

        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.image_url!}
              alt={service.title}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background: `radial-gradient(circle at 28% 18%, ${tint(PRIMARY, 18)}, transparent 60%), radial-gradient(circle at 82% 82%, ${tint(SECONDARY, 16)}, transparent 55%)`,
              }}
            >
              <span
                className="flex h-20 w-20 items-center justify-center rounded-3xl border bg-card/70 backdrop-blur-md"
                style={{ borderColor: tint(PRIMARY, 30), color: PRIMARY }}
              >
                <BriefcaseBusiness className="h-9 w-9" />
              </span>
            </div>
          )}

          <span
            className="absolute right-4 top-4 rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-extrabold tabular-nums text-foreground backdrop-blur-md"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h2 className="font-sans text-lg font-bold leading-snug text-foreground">{service.title}</h2>

          {service.summary && (
            <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{service.summary}</p>
          )}

          {highlights.length > 0 && (
            <ul className="mt-4 space-y-2">
              {highlights.slice(0, 3).map((highlight, i) => (
                <li key={`${service.id}-${i}`} className="flex items-start gap-2 text-xs leading-6 text-foreground">
                  <span
                    className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: tint(PRIMARY, 14), color: PRIMARY }}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="line-clamp-1">{highlight}</span>
                </li>
              ))}
              {highlights.length > 3 && (
                <li className="pe-6 text-[11px] font-semibold" style={{ color: PRIMARY }}>
                  و {formatNumber(highlights.length - 3)} ميزة أخرى
                </li>
              )}
            </ul>
          )}

          <div className="mt-auto pt-5">
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-3 py-2.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-foreground"
                style={{ background: tint(SECONDARY, 22) }}
              >
                {initials(service.contact_name ?? "فريق الخدمات")}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-xs font-bold text-foreground">
                  {service.contact_name || "فريق الخدمات"}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground" dir="ltr">
                  {service.contact_phone}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpen(service)}
                className="pointer-events-auto inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold transition-transform hover:scale-[1.02]"
                style={{
                  background: PRIMARY,
                  color: "var(--brand-primary-contrast)",
                  boxShadow: `0 10px 24px -14px ${PRIMARY}`,
                }}
              >
                عرض التفاصيل
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <a
                href={whatsappLink(service.contact_phone)}
                target="_blank"
                rel="noreferrer"
                aria-label={`تواصل واتساب بخصوص ${service.title}`}
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white transition-transform hover:scale-105"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────── Details dialog ─────────────────────── */

function ServiceDialog({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const highlights = service.highlights ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-dialog-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-border bg-card text-card-foreground shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق التفاصيل"
          className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur-md transition hover:scale-105"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative h-56 overflow-hidden sm:h-64">
          {service.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={service.image_url} alt={service.title} className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${tint(PRIMARY, 20)}, ${tint(SECONDARY, 18)})`,
              }}
            >
              <BriefcaseBusiness className="h-16 w-16" style={{ color: PRIMARY }} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
        </div>

        <div className="relative -mt-8 px-5 pb-6 sm:px-8 sm:pb-8">
          <SectionLabel>تفاصيل الخدمة</SectionLabel>
          <h2 id="service-dialog-title" className="font-sans mt-4 text-2xl font-bold text-foreground">
            {service.title}
          </h2>

          {service.summary && <p className="mt-3 text-sm leading-8 text-muted-foreground">{service.summary}</p>}
          {service.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-8 text-foreground">{service.description}</p>
          )}

          {highlights.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-extrabold text-foreground">ما الذي ستحصل عليه؟</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {highlights.map((highlight, i) => (
                  <div
                    key={`${service.id}-detail-${i}`}
                    className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs leading-6 text-foreground"
                  >
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: PRIMARY }} />
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold text-foreground"
                style={{ background: tint(SECONDARY, 22) }}
              >
                {initials(service.contact_name ?? "فريق الخدمات")}
              </span>
              <div className="leading-tight">
                <p className="text-xs font-extrabold text-foreground">
                  {service.contact_name || "فريق الخدمات"}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground" dir="ltr">
                  {service.contact_phone}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/services/${service.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-extrabold text-foreground transition-colors hover:border-[color:var(--brand-primary)]"
              >
                الصفحة الكاملة
                <ExternalLink className="h-4 w-4" />
              </Link>
              <a
                href={whatsappLink(service.contact_phone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-extrabold text-white"
              >
                <Send className="h-4 w-4" />
                ابدأ المحادثة
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────── Supporting sections ─────────────────────── */

function ServicesSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-44 animate-pulse bg-muted" />
          <div className="space-y-3 p-6">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
            <div className="h-10 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) {
  const tracks = [
    { icon: Target, title: "استشارات مخصصة", desc: "جلسات مركّزة تحل مشكلتك وتضع خطة واضحة." },
    { icon: Lightbulb, title: "ورش تطويرية", desc: "محتوى عملي يرفع مهاراتك خطوة بخطوة." },
    { icon: Users, title: "متابعة فردية", desc: "دعم مستمر مع مختص يتابع تقدمك عن قرب." },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-12 text-center shadow-sm sm:px-10 sm:py-16">
        <div className="hero-backdrop pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-xl">
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border"
            style={{ background: tint(PRIMARY, 12), borderColor: tint(PRIMARY, 40), color: PRIMARY }}
          >
            {filtered ? <Search className="h-9 w-9" /> : <BriefcaseBusiness className="h-9 w-9" />}
          </motion.span>

          <h2 className="font-sans mt-6 text-2xl font-bold text-foreground sm:text-3xl">
            {filtered ? "لم نجد خدمة مطابقة" : "نجهّز لك تجربة تليق بطموحك"}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-8 text-muted-foreground">
            {filtered
              ? "جرّب كلمة أخرى أو امسح البحث لعرض كل الخدمات المتاحة."
              : "فريقنا يعمل على إطلاق باقة خدمات تعليمية مخصصة. تابع هذه المساحة لتكتشف الجديد قريباً."}
          </p>

          {filtered && (
            <button
              type="button"
              onClick={onReset}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold"
              style={{ background: PRIMARY, color: "var(--brand-primary-contrast)" }}
            >
              <RefreshCw className="h-4 w-4" />
              مسح البحث
            </button>
          )}
        </div>
      </div>

      {!filtered && (
        <div className="grid gap-4 md:grid-cols-3">
          {tracks.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: tint(SECONDARY, 14), color: PRIMARY }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="mt-4 flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  قريباً
                </span>
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProcessSection() {
  const steps = [
    { icon: Search, title: "اختر خدمتك", desc: "تصفّح الخدمات واقرأ المميزات بوضوح قبل أي خطوة." },
    { icon: MessageCircle, title: "تواصل مباشرة", desc: "اضغط زر واتساب وتحدث مع المسؤول عن الخدمة فوراً." },
    { icon: BadgeCheck, title: "ابدأ الخطة", desc: "اتفق على التفاصيل مع مقدم الخدمة بمساحة عمل واضحة." },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {steps.map(({ icon: Icon, title, desc }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="relative rounded-2xl border border-border bg-muted/30 p-5"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold"
              style={{ background: PRIMARY, color: "var(--brand-primary-contrast)" }}
            >
              {i + 1}
            </span>
            <Icon className="h-5 w-5" style={{ color: SECONDARY }} />
          </div>
          <h3 className="mt-4 text-sm font-extrabold text-foreground">{title}</h3>
          <p className="mt-1.5 text-xs leading-6 text-muted-foreground">{desc}</p>
        </motion.div>
      ))}
    </section>
  );
}

/* ─────────────────────── Page ─────────────────────── */

export function ServicesPage() {
  const { tenant } = useActiveTenant();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("default");
  const [selected, setSelected] = useState<Service | null>(null);

  const {
    data: services = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<Service[]>({
    queryKey: ["public-services"],
    queryFn: async () => {
      const { data } = await api.get<{ services?: Service[] }>("/public/services");
      return data.services ?? [];
    },
    staleTime: 60_000,
    retry: 1,
  });

  const error = queryError
    ? "تعذر تحميل الخدمات حالياً. تحقق من اتصالك وحاول مرة أخرى."
    : "";

  const stats = useMemo(
    () => ({
      services: services.length,
      features: services.reduce((total, service) => total + (service.highlights?.length ?? 0), 0),
      experts: new Set(
        services.map((service) => service.contact_name || service.contact_phone).filter(Boolean),
      ).size,
    }),
    [services],
  );

  const visibleServices = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const result = services.filter((service) => {
      if (!term) return true;
      const haystack = [
        service.title,
        service.summary,
        service.description,
        service.contact_name,
        ...(service.highlights ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(term);
    });

    if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title, "ar"));
    else if (sort === "highlights")
      result.sort((a, b) => (b.highlights?.length ?? 0) - (a.highlights?.length ?? 0));
    return result;
  }, [services, query, sort]);

  const supportPhone = services.find((service) => service.contact_phone)?.contact_phone ?? "";

  return (
    <div dir="rtl" className="relative min-h-screen bg-background text-foreground">
      <Hero tenantName={tenant?.name ?? ""} stats={stats} loading={loading} />

      <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <section id="services" className="pt-12 sm:pt-16">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel>دليل الخدمات</SectionLabel>
              <h2 className="font-sans mt-4 text-2xl font-bold text-foreground sm:text-3xl">
                ما الذي نقدّمه؟
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                كل خدمة مصممة لتكون خطوة عملية نحو هدفك، مع تواصل مباشر وشفاف من البداية.
              </p>
            </div>

            {!loading && services.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block">
                  <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ابحث عن خدمة..."
                    className="h-11 w-full rounded-xl border border-border bg-card pe-10 ps-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 sm:w-64"
                    style={{ "--tw-ring-color": tint(PRIMARY, 30) } as CSSProperties}
                  />
                </label>

                <label className="relative block">
                  <ArrowUpDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortMode)}
                    aria-label="ترتيب الخدمات"
                    className="h-11 w-full appearance-none rounded-xl border border-border bg-card pe-10 ps-8 text-xs font-bold text-foreground outline-none focus:ring-2 sm:w-44"
                    style={{ "--tw-ring-color": tint(PRIMARY, 30) } as CSSProperties}
                  >
                    <option value="default">الترتيب الافتراضي</option>
                    <option value="title">أبجدياً</option>
                    <option value="highlights">الأكثر تفصيلاً</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {!loading && services.length > 0 && (
            <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIMARY }} />
              {formatNumber(visibleServices.length)} من {formatNumber(services.length)} خدمة معروضة
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-border bg-card px-6 py-14 text-center">
              <CircleHelp className="h-10 w-10" style={{ color: PRIMARY }} />
              <div>
                <h2 className="font-sans text-lg font-bold text-foreground">حدث خطأ أثناء التحميل</h2>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void refetch()}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold"
                style={{ background: PRIMARY, color: "var(--brand-primary-contrast)" }}
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </button>
            </div>
          ) : loading ? (
            <ServicesSkeleton />
          ) : visibleServices.length === 0 ? (
            <EmptyState
              filtered={query.trim().length > 0 || services.length === 0}
              onReset={() => {
                setQuery("");
                setSort("default");
              }}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visibleServices.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    onOpen={setSelected}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {!loading && !error && (
          <>
            <div className="my-12 h-px bg-border" />
            <section>
              <div className="mb-6 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: tint(SECONDARY, 16), color: PRIMARY }}
                >
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-sans text-xl font-bold text-foreground">كيف تعمل الخدمات؟</h2>
                  <p className="text-xs text-muted-foreground">ثلاث خطوات بسيطة تفصلك عن الهدف.</p>
                </div>
              </div>
              <ProcessSection />
            </section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45 }}
              className="relative mt-12 overflow-hidden rounded-[2rem] px-6 py-10 text-center sm:px-10 sm:py-14"
              style={{
                background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                color: "var(--brand-primary-contrast)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "20px 20px" }}
                aria-hidden="true"
              />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="font-sans text-2xl font-bold sm:text-3xl">
                  {supportPhone ? "لديك سؤال قبل أن تبدأ؟" : "ابحث عن خطوتك التالية في رحلتك التعليمية"}
                </h2>
                <p className="mt-3 text-sm leading-8 opacity-90">
                  {supportPhone
                    ? "تواصل مع فريق الخدمات مباشرة وسنجيبك على الفور ونحدد معك الأنسب لاحتياجك."
                    : "استكشف دوراتنا ومحتوانا التعليمي، وابنِ مهاراتك مع منصة تضعك أولاً."}
                </p>
                {supportPhone ? (
                  <a
                    href={whatsappLink(supportPhone)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/95 px-6 py-3 text-xs font-extrabold text-[#1a1510] transition-transform hover:scale-105"
                  >
                    <MessageCircle className="h-4 w-4" />
                    تحدث معنا الآن
                    <ArrowLeft className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    href="/courses"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/95 px-6 py-3 text-xs font-extrabold text-[#1a1510] transition-transform hover:scale-105"
                  >
                    <GraduationCap className="h-4 w-4" />
                    استكشف الكورسات
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.section>
          </>
        )}
      </div>

      <AnimatePresence>
        {selected && <ServiceDialog service={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
