"use client";

import { Quote } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import type { CommunitySectionSettings } from "../../types";
import {
  CommunityIcon,
  CommunityCta,
  PRIMARY,
  SECONDARY,
  useCommunityDisplay,
} from "../shared";

/** Design 5 — المينيمال الهادئ: clean centered layout with a calm ticker marquee. */
export function MinimalDesign({ settings }: { settings: CommunitySectionSettings }) {
  const isDark = useUiStore((s) => s.theme) === "dark";
  const display = useCommunityDisplay();

  const ticker = settings.minimal.showTicker
    ? settings.minimal.tickerItems.filter((t) => t.trim())
    : [];

  return (
    <section dir="rtl" className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-28">
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(180deg, #0c0a12 0%, #100d18 100%)"
            : "linear-gradient(180deg, #ffffff 0%, #fbf7f0 100%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        {settings.badgeText.trim() && (
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold"
            style={{
              borderColor: "var(--brand-secondary)",
              color: SECONDARY,
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
            }}
          >
            <CommunityIcon id={settings.features[0]?.icon ?? "chat"} className="h-4 w-4" />
            {settings.badgeText}
          </span>
        )}

        <h2 className="mt-6 text-3xl font-black leading-snug tracking-tight text-slate-800 dark:text-slate-100 sm:text-4xl lg:text-[2.8rem]">
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
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
            {settings.description}
          </p>
        )}

        <div className="mt-9 flex justify-center">
          <CommunityCta settings={settings} variant="solid" />
        </div>

        {/* Feature pills */}
        {settings.features.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {settings.features.slice(0, 5).map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold text-slate-600 transition-colors dark:border-white/10 dark:text-slate-300"
                style={{
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)",
                }}
              >
                <CommunityIcon id={f.icon} className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
                {f.title}
              </span>
            ))}
          </div>
        )}

        {/* Stats inline */}
        {settings.showStats && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
            {[
              { value: display.members, label: settings.statLabels.members },
              { value: display.online, label: settings.statLabels.online },
              { value: display.today, label: settings.statLabels.today },
              { value: display.threads, label: settings.statLabels.threads },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quote */}
        {settings.spotlight.quote.trim() && (
          <blockquote className="mx-auto mt-10 flex max-w-lg items-start gap-3 text-slate-500 dark:text-slate-400">
            <Quote className="mt-1 h-5 w-5 shrink-0" style={{ color: SECONDARY }} />
            <p className="text-sm leading-relaxed">{settings.spotlight.quote}</p>
          </blockquote>
        )}
      </div>

      {/* Ticker marquee */}
      {ticker.length > 0 && (
        <div
          className="relative mt-12 overflow-hidden border-y py-4"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.5)",
          }}
        >
          <div className="flex w-max animate-marquee-rtl gap-10 whitespace-nowrap">
            {[...ticker, ...ticker].map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: i % 2 === 0 ? PRIMARY : SECONDARY }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
