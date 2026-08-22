"use client";

import { ArrowLeft, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useUiStore } from "@/stores/ui.store";
import { routes } from "@/constants/routes";
import type { CommunitySectionSettings } from "../../types";
import {
  CommunityIcon,
  CommunityCta,
  PRIMARY,
  SECONDARY,
  useCommunityDisplay,
} from "../shared";

/** Design 4 — شبكة بينتو: modern Bento grid where every feature is its own card. */
export function BentoDesign({ settings }: { settings: CommunitySectionSettings }) {
  const isDark = useUiStore((s) => s.theme) === "dark";
  const display = useCommunityDisplay();

  const cardStyle: React.CSSProperties = {
    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.65)",
    background: isDark
      ? "linear-gradient(150deg, rgba(28,25,36,0.9), rgba(20,18,26,0.92))"
      : "linear-gradient(150deg, rgba(255,255,255,0.95), rgba(255,250,242,0.88))",
  };

  const stats = [
    { label: settings.statLabels.members, value: display.members, iconId: "users" as const },
    { label: settings.statLabels.online, value: display.online, iconId: "star" as const },
    { label: settings.statLabels.today, value: display.today, iconId: "chat" as const },
    { label: settings.statLabels.threads, value: display.threads, iconId: "trophy" as const },
  ];

  const features = settings.features.slice(0, 4);
  // Span pattern for the bento row — first and last cards are wider on lg.
  const spans = ["lg:col-span-2", "lg:col-span-1", "lg:col-span-1", "lg:col-span-2"];

  return (
    <section dir="rtl" className="relative w-full overflow-hidden py-14 sm:py-16 lg:py-24">
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(180deg, #0d0b13 0%, #13101a 50%, #0d0b13 100%)"
            : "linear-gradient(180deg, #faf7f1 0%, #f2ecdf 100%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          {settings.badgeText.trim() && (
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-[var(--brand-secondary-contrast)] shadow-md"
              style={{ backgroundColor: PRIMARY }}
            >
              <LayoutGrid className="h-4 w-4" />
              {settings.badgeText}
            </span>
          )}
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-800 dark:text-slate-100 sm:text-4xl">
            {settings.titleTop.trim() && (
              <span className="block">{settings.titleTop}</span>
            )}
            {settings.titleBottom.trim() && (
              <span
                className="mt-2 block bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(120deg, ${PRIMARY}, ${SECONDARY})`,
                }}
              >
                {settings.titleBottom}
              </span>
            )}
          </h2>
          {settings.description.trim() && (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
              {settings.description}
            </p>
          )}
        </div>

        {/* Feature bento cards */}
        {features.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {features.map((f, i) => (
              <div
                key={f.id}
                className={`group relative overflow-hidden rounded-3xl border p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${spans[i % spans.length]}`}
                style={cardStyle}
              >
                <div
                  aria-hidden="true"
                  className="absolute -left-8 -top-8 h-28 w-28 rounded-full opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.16]"
                  style={{ backgroundColor: i % 2 === 0 ? PRIMARY : SECONDARY }}
                />
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                  style={{
                    background:
                      i % 2 === 0
                        ? PRIMARY
                        : SECONDARY,
                  }}
                >
                  <CommunityIcon id={f.icon} className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {f.title}
                </h3>
                {f.desc.trim() && (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {f.desc}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats strip */}
        {settings.showStats && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="rounded-3xl border p-5 text-center shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
                style={cardStyle}
              >
                <CommunityIcon
                  id={s.iconId}
                  className="mx-auto h-5 w-5"
                  style={{ color: i % 2 === 0 ? PRIMARY : SECONDARY }}
                />
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                  {s.value}
                </div>
                <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer note + CTA */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {(settings.bento.footerNote.trim() ||
            settings.primaryCta.visible ||
            settings.secondaryCta.visible) && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {settings.bento.footerNote.trim() && (
                <>
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SECONDARY }}
                  />
                  {settings.bento.footerNote}
                </>
              )}
            </div>
          )}
          {display.isAuthenticated ? (
            (settings.primaryCta.visible || settings.secondaryCta.visible) && (
              <Link
                href={routes.community}
                className="group inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
                style={{
                  backgroundColor: PRIMARY,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
                }}
              >
                {settings.primaryCta.visible
                  ? settings.primaryCta.label
                  : settings.secondaryCta.label}
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>
            )
          ) : (
            <div className="[&>div]:justify-center">
              <CommunityCta settings={settings} variant="solid" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
