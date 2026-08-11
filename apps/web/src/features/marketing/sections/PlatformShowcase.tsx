"use client";

import { useState, useCallback } from "react";
import { SectionLabel } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { SHOWCASE_TABS } from "@/features/marketing/data/content";
import { TeacherPanel } from "@/features/marketing/sections/showcase/TeacherPanel";
import { StudentPanel } from "@/features/marketing/sections/showcase/StudentPanel";
import { CoursePanel } from "@/features/marketing/sections/showcase/CoursePanel";
import { ExamPanel } from "@/features/marketing/sections/showcase/ExamPanel";
import { AnalyticsPanel } from "@/features/marketing/sections/showcase/AnalyticsPanel";
import { CommunityPanel } from "@/features/marketing/sections/showcase/CommunityPanel";

const PANELS: Record<string, React.ComponentType> = {
  teacher: TeacherPanel,
  student: StudentPanel,
  course: CoursePanel,
  exam: ExamPanel,
  analytics: AnalyticsPanel,
  community: CommunityPanel,
};

export function PlatformShowcase() {
  const [active, setActive] = useState("teacher");

  const tab = SHOWCASE_TABS.find((t) => t.id === active) ?? SHOWCASE_TABS[0]!;
  const Panel = PANELS[active] ?? TeacherPanel;
  const cycle = useCallback(() => {
    const idx = SHOWCASE_TABS.findIndex((t) => t.id === active);
    setActive(SHOWCASE_TABS[(idx + 1) % SHOWCASE_TABS.length]!.id);
  }, [active]);

  return (
    <section id="showcase" className="relative scroll-mt-20 overflow-hidden bg-[hsl(var(--mk-bg-band))] py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_0%,hsl(var(--mk-primary)/0.06),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal className="max-w-2xl">
            <SectionLabel>جولة داخل المنصة</SectionLabel>
            <h2 className="mk-display mk-display-lg mt-5">
              كل ما يحتاجه تعليمك…
              <br />
              <span style={{ color: "hsl(var(--mk-primary-deep))" }}>داخل منصة واحدة</span>
            </h2>
          </Reveal>
          <Reveal delay={120} className="max-w-sm">
            <p className="text-sm leading-7" style={{ color: "hsl(var(--mk-ink-soft))" }}>
              نوافذ حقيقية من داخل المنصة — لوحة المعلم، تجربة الطالب، الكورسات، الامتحانات،
              التحليلات، والمجتمع. كلها تحت اسمك وشعارك.
            </p>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="mt-10 flex flex-wrap items-center gap-2" role="tablist" aria-label="مكونات المنصة">
            {SHOWCASE_TABS.map((t) => {
              const isActive = t.id === active;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(t.id)}
                  className="group flex items-center gap-2 rounded-full border px-4 py-2 text-[0.82rem] font-extrabold transition-all duration-200"
                  style={{
                    background: isActive ? "hsl(var(--mk-primary))" : "transparent",
                    borderColor: isActive ? "hsl(var(--mk-primary))" : "hsl(var(--mk-line-strong))",
                    color: isActive ? "#fff" : "hsl(var(--mk-ink-soft))",
                  }}
                >
                  <t.icon size={15} aria-hidden="true" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={220} className="mt-8">
          <div className="relative">
            <div className="mk-tab-swap" key={active}>
              <Panel />
            </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[0.72rem] font-bold text-[hsl(var(--mk-muted))]">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))]"
                    style={{ color: "hsl(var(--mk-primary-deep))" }}
                  >
                    {SHOWCASE_TABS.findIndex((t) => t.id === active) + 1}
                  </span>
                  {tab.description}
                </div>
                <button
                  onClick={cycle}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.72rem] font-extrabold transition-colors"
                  style={{ color: "hsl(var(--mk-primary-deep))" }}
                >
                  <span className="transition-transform duration-300 hover:-translate-x-0.5">مشهد آخر</span>
                  <span aria-hidden="true">↺</span>
                </button>
              </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
