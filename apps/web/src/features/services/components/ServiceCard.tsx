"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  AppButton,
  AppStatusBadge,
  AppTooltip,
  AppTooltipContent,
  AppTooltipTrigger,
} from "@/components/ui";
import type { ServiceRecord } from "../types";

interface ServiceCardProps {
  service: ServiceRecord;
  index: number;
  onEdit: (service: ServiceRecord) => void;
  onDelete: (service: ServiceRecord) => void;
  onTogglePublish: (service: ServiceRecord) => void;
  toggling: boolean;
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

export function ServiceCard({
  service,
  index,
  onEdit,
  onDelete,
  onTogglePublish,
  toggling,
}: ServiceCardProps) {
  const highlights = service.highlights ?? [];

  return (
    <article className="premium-card card-top-accent group flex h-full flex-col overflow-hidden">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden border-b border-studio-border bg-studio-soft">
        {service.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.image_url}
            alt={service.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="bg-grid flex h-full items-center justify-center bg-studio-accent-soft/40">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-studio-accent-border/50 bg-studio-surface/80 text-studio-accent shadow-sm">
              <BriefcaseBusiness className="h-7 w-7" />
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <AppStatusBadge
            status={service.is_published ? "published" : "draft"}
            label={service.is_published ? "منشورة" : "مسودة"}
            className="shadow-sm"
          />
          <span className="rounded-md bg-studio-fg/70 px-2 py-1 text-[10px] font-bold tabular-nums text-white backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        {service.image_url && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-studio-fg/25 to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3
          className="line-clamp-1 text-[15px] font-bold tracking-tight text-studio-fg"
          title={service.title}
        >
          {service.title}
        </h3>
        {service.summary ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-studio-fg-muted">
            {service.summary}
          </p>
        ) : (
          <p className="mt-1.5 text-xs italic text-studio-fg-subtle">
            لا يوجد وصف مختصر
          </p>
        )}

        {highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {highlights.slice(0, 2).map((highlight, i) => (
              <span
                key={i}
                className="inline-flex max-w-full items-center gap-1 rounded-md bg-studio-soft px-2 py-1 text-[10px] font-medium text-studio-fg-muted"
                title={highlight}
              >
                <Check className="h-3 w-3 shrink-0 text-studio-accent" />
                <span className="truncate">{highlight}</span>
              </span>
            ))}
            {highlights.length > 2 && (
              <span className="inline-flex items-center rounded-md bg-studio-soft px-2 py-1 text-[10px] font-medium text-studio-fg-subtle">
                +{highlights.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Contact */}
        <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-studio-border/70 bg-studio-surface/60 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-studio-accent-soft text-xs font-bold text-studio-accent">
              {(service.contact_name ?? "م").trim().charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-studio-fg">
                {service.contact_name || "مسؤول التواصل"}
              </p>
              <p
                dir="ltr"
                className="truncate text-[10px] tabular-nums text-studio-fg-subtle"
              >
                {service.contact_phone}
              </p>
            </div>
          </div>
          <AppTooltip>
            <AppTooltipTrigger asChild>
              <a
                href={whatsappLink(service.contact_phone)}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#20c767] text-white shadow-sm transition hover:bg-[#19b85b]"
                aria-label="مراسلة عبر واتساب"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </AppTooltipTrigger>
            <AppTooltipContent>مراسلة عبر واتساب</AppTooltipContent>
          </AppTooltip>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t border-studio-border/70 pt-3">
          <span className="flex-1 text-[10px] text-studio-fg-subtle">
            ترتيب العرض:{" "}
            <span className="font-bold tabular-nums text-studio-fg-muted">
              {service.sort_order ?? 0}
            </span>
          </span>
          <AppTooltip>
            <AppTooltipTrigger asChild>
              <AppButton
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-studio-fg-muted hover:text-studio-accent"
                onClick={() => onTogglePublish(service)}
                disabled={toggling}
                aria-label={
                  service.is_published ? "إلغاء النشر" : "نشر الخدمة"
                }
              >
                {service.is_published ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </AppButton>
            </AppTooltipTrigger>
            <AppTooltipContent>
              {service.is_published ? "إلغاء النشر" : "نشر الخدمة"}
            </AppTooltipContent>
          </AppTooltip>
          <AppTooltip>
            <AppTooltipTrigger asChild>
              <AppButton
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-studio-fg-muted hover:text-primary"
                onClick={() => onEdit(service)}
                aria-label="تعديل الخدمة"
              >
                <Pencil className="h-4 w-4" />
              </AppButton>
            </AppTooltipTrigger>
            <AppTooltipContent>تعديل الخدمة</AppTooltipContent>
          </AppTooltip>
          <AppTooltip>
            <AppTooltipTrigger asChild>
              <AppButton
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-studio-fg-muted hover:text-destructive"
                onClick={() => onDelete(service)}
                aria-label="حذف الخدمة"
              >
                <Trash2 className="h-4 w-4" />
              </AppButton>
            </AppTooltipTrigger>
            <AppTooltipContent>حذف الخدمة</AppTooltipContent>
          </AppTooltip>
        </div>
      </div>

      <span className="pointer-events-none absolute bottom-3 start-3 flex h-6 w-6 items-center justify-center rounded-full bg-studio-accent text-studio-accent-fg opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </article>
  );
}
