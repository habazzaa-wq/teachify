"use client";

import { Sparkles, TrendingUp } from "lucide-react";
import type { CommunitySectionSettings } from "../../types";
import { CommunityIcon, CommunityCta, useCommunityDisplay } from "../shared";

/** Design 2 — التدرّج الملون: bold brand gradient with a highlight card. */
export function GradientDesign({ settings }: { settings: CommunitySectionSettings }) {
  const display = useCommunityDisplay();

  const stats = [
    { label: settings.statLabels.members, value: display.members, iconId: "users" as const },
    { label: settings.statLabels.online, value: display.online, iconId: "zap" as const },
    { label: settings.statLabels.today, value: display.today, iconId: "chat" as const },
    { label: settings.statLabels.threads, value: display.threads, iconId: "trophy" as const },
  ];

  return (
    <section dir="rtl" className="relative w-full overflow-hidden py-14 sm:py-20 lg:py-24">
      {/* Bold gradient backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 55%, var(--brand-secondary)) 48%, var(--brand-secondary) 100%)",
        }}
      />

      {/* Ambient glows */}
      {settings.gradient.showGlow && (
        <>
          <div
            aria-hidden="true"
            className="absolute -top-32 right-[8%] h-80 w-80 rounded-full opacity-30 blur-3xl"
            style={{ backgroundColor: "#ffffff" }}
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-40 left-[4%] h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: "#000000" }}
          />
        </>
      )}

      {/* Decorative grid dots */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Copy */}
          <div className="text-white">
            {settings.badgeText.trim() && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                <Sparkles className="h-4 w-4" />
                {settings.badgeText}
              </span>
            )}

            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight drop-shadow-lg sm:text-4xl lg:text-[2.75rem]">
              {settings.titleTop.trim() && (
                <span className="block">{settings.titleTop}</span>
              )}
              {settings.titleBottom.trim() && (
                <span className="mt-2 block rounded-2xl bg-white/15 px-4 py-1 w-fit backdrop-blur-md">
                  {settings.titleBottom}
                </span>
              )}
            </h2>

            {settings.description.trim() && (
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                {settings.description}
              </p>
            )}

            <div className="mt-8">
              <CommunityCta settings={settings} variant="glass" />
            </div>
          </div>

          {/* Highlight card + stats */}
          <div className="space-y-4">
            {(settings.gradient.highlightTitle.trim() ||
              settings.gradient.highlightText.trim()) && (
              <div className="rounded-3xl border border-white/25 bg-white/12 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--brand-primary)] shadow-xl">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    {settings.gradient.highlightTitle.trim() && (
                      <h3 className="text-lg font-extrabold text-white">
                        {settings.gradient.highlightTitle}
                      </h3>
                    )}
                    {settings.gradient.highlightText.trim() && (
                      <p className="mt-1.5 text-sm leading-relaxed text-white/85">
                        {settings.gradient.highlightText}
                      </p>
                    )}
                  </div>
                </div>

                {settings.features.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {settings.features.slice(0, 4).map((f) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <CommunityIcon id={f.icon} className="h-3.5 w-3.5" />
                        {f.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {settings.showStats && (
              <div className="grid grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/20 bg-black/15 p-3 text-center backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
                  >
                    <CommunityIcon id={s.iconId} className="mx-auto h-5 w-5 text-white/90" />
                    <div className="mt-2 text-xl font-black text-white">{s.value}</div>
                    <div className="mt-0.5 line-clamp-1 text-[10px] font-medium text-white/70">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
