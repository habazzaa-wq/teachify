"use client";

import { CheckCircle2 } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import type { CommunitySectionSettings } from "../../types";
import {
  CommunityIcon,
  CommunityCta,
  PRIMARY,
  SECONDARY,
  useCommunityDisplay,
} from "../shared";

function StatTile({
  label,
  value,
  iconId,
  accent,
}: {
  label: string;
  value: string;
  iconId: Parameters<typeof CommunityIcon>[0]["id"];
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-4 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.06]">
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{ background: accent }}
      />
      <div
        className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: accent }}
      >
        <CommunityIcon id={iconId} className="h-5 w-5" />
      </div>
      <div className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}

/** Design 1 — الكلاسيكي الفاخر: the premium balanced card (platform-native look). */
export function ClassicDesign({ settings }: { settings: CommunitySectionSettings }) {
  const isDark = useUiStore((s) => s.theme) === "dark";
  const display = useCommunityDisplay();

  return (
    <section dir="rtl" className="relative w-full overflow-hidden py-12 sm:py-16 lg:py-20">
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(170deg, #0e0c14 0%, #16121c 55%, #0e0c14 100%)"
            : "linear-gradient(170deg, #fdfbf7 0%, #f7f1e7 55%, #fdfbf7 100%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-[2rem] border shadow-2xl backdrop-blur-xl"
          style={{
            background: isDark
              ? "linear-gradient(150deg, rgba(23,21,29,0.96) 0%, rgba(28,24,34,0.94) 55%, rgba(22,20,30,0.96) 100%)"
              : "linear-gradient(150deg, rgba(255,255,255,0.96) 0%, rgba(255,250,242,0.92) 50%, rgba(255,244,228,0.9) 100%)",
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)",
            boxShadow: isDark
              ? "0 24px 80px rgba(0,0,0,0.45)"
              : "0 24px 80px rgba(0,0,0,0.18)",
          }}
        >
          <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
            {/* Content side */}
            <div>
              {settings.badgeText.trim() && (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-[var(--brand-secondary-contrast)] shadow-md"
                  style={{
                    backgroundColor: SECONDARY,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.251)",
                  }}
                >
                  <CommunityIcon id={settings.features[0]?.icon ?? "chat"} className="h-4 w-4" />
                  {settings.badgeText}
                </span>
              )}

              <h2
                className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]"
                style={{ textShadow: "0 2px 24px rgba(0,0,0,0.12)" }}
              >
                {settings.titleTop.trim() && (
                  <span className="mb-5 block" style={{ color: PRIMARY }}>
                    {settings.titleTop}
                  </span>
                )}
                {settings.titleBottom.trim() && (
                  <span className="block" style={{ color: SECONDARY }}>
                    {settings.titleBottom}
                  </span>
                )}
              </h2>

              {settings.description.trim() && (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                  {settings.description}
                </p>
              )}

              {settings.showActivity && (
                <div
                  className="mt-6 flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-sm"
                  style={{
                    borderColor: SECONDARY,
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.75)",
                  }}
                >
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow"
                    style={{ backgroundColor: SECONDARY }}
                  >
                    <CommunityIcon id="chat" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {settings.activityLabel || "آخر نشاط في المنتدى"}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                      {display.latestAuthorName ? (
                        <>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {display.latestAuthorName}
                          </span>{" "}
                          :{" "}
                          {display.latestActivityText ??
                            "انضم إلى الطلاب الآن وابدأ أول نقاش لك."}
                        </>
                      ) : (
                        display.latestActivityText ??
                        "انضم إلى الطلاب الآن وابدأ أول نقاش لك مع زملائك ومعلميك."
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-7">
                <CommunityCta settings={settings} variant="solid" />
              </div>
            </div>

            {/* Stats side */}
            {settings.showStats && (
              <div className="flex flex-col justify-center gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <StatTile label={settings.statLabels.members} value={display.members} iconId="users" accent={PRIMARY} />
                  <StatTile label={settings.statLabels.online} value={display.online} iconId="star" accent={SECONDARY} />
                  <StatTile label={settings.statLabels.today} value={display.today} iconId="chat" accent={PRIMARY} />
                  <StatTile label={settings.statLabels.threads} value={display.threads} iconId="trophy" accent={SECONDARY} />
                </div>

                {settings.features.length > 0 && (
                  <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {settings.features.slice(0, 6).map((feature, i) => (
                      <li
                        key={feature.id}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                      >
                        <CheckCircle2
                          className="h-4 w-4 shrink-0"
                          style={{ color: i % 2 === 0 ? PRIMARY : SECONDARY }}
                        />
                        {feature.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
