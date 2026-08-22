"use client";

import Image from "next/image";
import { CheckCircle2, MessageSquareQuote, Users } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import type { CommunitySectionSettings } from "../../types";
import {
  CommunityIcon,
  CommunityCta,
  PRIMARY,
  useCommunityDisplay,
} from "../shared";

/** Design 3 — الأضواء المركزة: cinematic split layout with a side visual and quote. */
export function SpotlightDesign({ settings }: { settings: CommunitySectionSettings }) {
  const isDark = useUiStore((s) => s.theme) === "dark";
  const display = useCommunityDisplay();
  const hasImage = Boolean(settings.spotlight.imageUrl.trim());

  return (
    <section dir="rtl" className="relative w-full overflow-hidden py-14 sm:py-16 lg:py-24">
      {/* Stage backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(1200px 500px at 85% -10%, color-mix(in srgb, var(--brand-primary) 22%, transparent), transparent 60%), linear-gradient(180deg, #0b0912 0%, #14101d 100%)"
            : "radial-gradient(1200px 500px at 85% -10%, color-mix(in srgb, var(--brand-primary) 12%, transparent), transparent 60%), linear-gradient(180deg, #fbf9f4 0%, #f3ede1 100%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Visual side */}
          <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] shadow-2xl lg:min-h-full">
            {hasImage ? (
              <Image
                src={settings.spotlight.imageUrl}
                alt={settings.badgeText || "منتدى الطلاب"}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(160deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 40%, var(--brand-secondary)) 55%, var(--brand-secondary) 100%)",
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage:
                      "radial-gradient(#fff 1.5px, transparent 1.5px)",
                    backgroundSize: "22px 22px",
                  }}
                />
                <Users
                  aria-hidden="true"
                  className="absolute -bottom-10 -left-10 h-64 w-64 text-white/15"
                  strokeWidth={1}
                />
              </div>
            )}

            {/* Overlay quote */}
            {settings.spotlight.quote.trim() && (
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/25 bg-black/35 p-5 backdrop-blur-xl">
                <MessageSquareQuote className="mb-2 h-6 w-6 text-white/80" />
                <p className="text-sm font-semibold leading-relaxed text-white sm:text-base">
                  {settings.spotlight.quote}
                </p>
              </div>
            )}

            {/* Live badge */}
            {settings.showStats && (
              <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/35 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                {display.online} {settings.statLabels.online}
              </div>
            )}
          </div>

          {/* Content side */}
          <div className="flex flex-col justify-center py-2 lg:py-8">
            {settings.badgeText.trim() && (
              <span
                className="w-fit rounded-full px-4 py-1.5 text-xs font-bold text-[var(--brand-secondary-contrast)] shadow-md"
                style={{ backgroundColor: PRIMARY }}
              >
                {settings.badgeText}
              </span>
            )}

            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-800 dark:text-slate-100 sm:text-4xl lg:text-[2.6rem]">
              {settings.titleTop.trim() && (
                <span className="block">{settings.titleTop}</span>
              )}
              {settings.titleBottom.trim() && (
                <span className="mt-2 block" style={{ color: PRIMARY }}>
                  {settings.titleBottom}
                </span>
              )}
            </h2>

            {settings.description.trim() && (
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                {settings.description}
              </p>
            )}

            {/* Feature checklist */}
            {settings.features.length > 0 && (
              <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {settings.features.slice(0, 4).map((f) => (
                  <li
                    key={f.id}
                    className="flex items-start gap-3 rounded-2xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      <CommunityIcon id={f.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                        {f.title}
                      </span>
                      {f.desc.trim() && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {f.desc}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <CommunityCta settings={settings} variant="solid" />
              {!display.isAuthenticated && settings.showStats && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                  <CheckCircle2 className="h-4 w-4" style={{ color: PRIMARY }} />
                  {settings.activityLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
