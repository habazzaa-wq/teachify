import { Sparkles } from "lucide-react";
import { SectionLabel } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { ECOSYSTEM_NODES } from "@/features/marketing/data/content";

const NODE_POSITIONS: Record<string, { x: string; y: string; svgX: number; svgY: number }> = {
  teachers: { x: "50%", y: "17.7%", svgX: 480, svgY: 110 },
  courses: { x: "66.1%", y: "33.1%", svgX: 635, svgY: 205 },
  students: { x: "71.9%", y: "54.8%", svgX: 690, svgY: 340 },
  exams: { x: "66.1%", y: "76.6%", svgX: 635, svgY: 475 },
  certificates: { x: "50%", y: "82.3%", svgX: 480, svgY: 510 },
  payments: { x: "33.9%", y: "76.6%", svgX: 325, svgY: 475 },
  analytics: { x: "28.1%", y: "54.8%", svgX: 270, svgY: 340 },
  community: { x: "33.9%", y: "33.1%", svgX: 325, svgY: 205 },
};

const TONE_COLORS: Record<string, string> = {
  coral: "hsl(var(--mk-primary))",
  gold: "hsl(var(--mk-gold))",
  blue: "hsl(var(--mk-blue))",
  green: "hsl(var(--mk-green))",
  violet: "hsl(var(--mk-violet))",
};

export function EcosystemSection() {
  return (
    <section
      id="ecosystem"
      className="relative scroll-mt-20 overflow-hidden bg-[hsl(var(--mk-deep))] py-20 text-[hsl(var(--mk-deep-ink))] sm:py-24 lg:py-32"
    >
      {/* faint grid on the deep band */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--mk-deep-line)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--mk-deep-line)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black, transparent 72%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel onDeep className="justify-center">
            النظام المتكامل
          </SectionLabel>
          <h2 className="mk-display mk-display-lg mt-5">
            أكثر من موقع كورسات…
            <br />
            <span style={{ color: "hsl(var(--mk-gold))" }}>بيئة تعليمية كاملة</span>
          </h2>
          <p className="mt-5 text-base leading-8 text-[hsl(var(--mk-deep-muted))]">
            من تسجيل الطالب الأول حتى استلامه شهادته، كل مرحلة مدعومة ببنية تحتية متكاملة تعمل
            معًا بسلاسة داخل منصتك.
          </p>
        </Reveal>

        {/* ── Diagram (desktop) ── */}
        <Reveal variant="fade" delay={120} className="relative mx-auto mt-16 hidden max-w-5xl lg:block">
          <div className="relative aspect-[960/620]">
            <svg
              viewBox="0 0 960 620"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {ECOSYSTEM_NODES.map((node, i) => {
                const pos = NODE_POSITIONS[node.id]!;
                return (
                  <line
                    key={node.id}
                    x1="480"
                    y1="310"
                    x2={pos.svgX}
                    y2={pos.svgY}
                    className="mk-diagram-line"
                    style={{ "--mk-delay": `${240 + i * 70}ms` } as React.CSSProperties}
                  />
                );
              })}
              {/* center halo */}
              <circle cx="480" cy="310" r="120" fill="hsl(var(--mk-primary) / 0.06)" />
              <circle cx="480" cy="310" r="86" fill="none" stroke="hsl(var(--mk-primary) / 0.22)" strokeWidth="1" strokeDasharray="2 6" />
            </svg>

            {/* Center node */}
            <div
              className="mk-diagram-center absolute z-10 grid w-44 place-items-center rounded-2xl border border-[hsl(var(--mk-primary)/0.5)] text-center"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                background: "hsl(var(--mk-primary))",
                boxShadow: "0 24px 60px -20px hsl(var(--mk-primary) / 0.5)",
              }}
            >
              <div className="py-5">
                <Sparkles className="mx-auto h-6 w-6 text-white/90" aria-hidden="true" />
                <div className="mt-2 text-xl font-black text-white">منصتك</div>
                <div className="text-[0.68rem] font-bold text-white/80">بكل مكوناتها</div>
              </div>
            </div>

            {/* Orbiting nodes */}
            {ECOSYSTEM_NODES.map((node, i) => {
              const pos = NODE_POSITIONS[node.id]!;
              const Icon = node.icon;
              return (
                <div
                  key={node.id}
                  className="mk-diagram-node absolute flex w-36 flex-col items-center gap-1.5 rounded-xl border border-[hsl(var(--mk-deep-line))] bg-[hsl(var(--mk-deep-soft))] px-2 py-2.5 text-center"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    "--mk-delay": `${140 + i * 90}ms`,
                    zIndex: 5,
                  } as React.CSSProperties}
                >
                  <Icon size={18} style={{ color: TONE_COLORS[node.tone] }} aria-hidden="true" />
                  <span className="text-[0.78rem] font-extrabold text-[hsl(var(--mk-deep-ink))]">
                    {node.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* ── Flow list (mobile / tablet) ── */}
        <Reveal className="mt-12 lg:hidden">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {ECOSYSTEM_NODES.map((node) => {
              const Icon = node.icon;
              return (
                <span
                  key={node.id}
                  className="flex items-center gap-2 rounded-full border border-[hsl(var(--mk-deep-line))] bg-[hsl(var(--mk-deep-soft))] px-3.5 py-2 text-[0.78rem] font-extrabold"
                >
                  <Icon size={14} style={{ color: TONE_COLORS[node.tone] }} aria-hidden="true" />
                  {node.label}
                </span>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm leading-7 text-[hsl(var(--mk-deep-muted))]">
            الكورسات، الامتحانات، المدفوعات، الشهادات والمجتمع — كلها تعمل معًا داخل منصة واحدة.
          </p>
        </Reveal>

        {/* Supporting stat-free note */}
        <Reveal delay={80} className="mt-14 hidden justify-center lg:flex">
          <p className="flex items-center gap-3 text-sm font-bold text-[hsl(var(--mk-deep-muted))]">
            <span className="h-px w-10 bg-[hsl(var(--mk-gold)/0.5)]" aria-hidden="true" />
            كل مكوّن مصمم ليتكامل مع الباقي — لا أدوات منفصلة، لا بيانات متناثرة.
            <span className="h-px w-10 bg-[hsl(var(--mk-gold)/0.5)]" aria-hidden="true" />
          </p>
        </Reveal>
      </div>
    </section>
  );
}
