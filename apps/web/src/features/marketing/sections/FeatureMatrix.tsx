import { SectionLabel } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { MATRIX_GROUPS } from "@/features/marketing/data/content";

const TONE_CLASS: Record<string, string> = {
  coral: "bg-[hsl(var(--mk-primary-soft))] text-[hsl(var(--mk-primary-deep))]",
  gold: "bg-[hsl(var(--mk-gold-soft))] text-[hsl(var(--mk-gold-deep))]",
  blue: "bg-[hsl(var(--mk-blue-soft))] text-[hsl(var(--mk-blue))]",
  green: "bg-[hsl(var(--mk-green-soft))] text-[hsl(var(--mk-green))]",
  violet: "bg-[hsl(var(--mk-violet-soft))] text-[hsl(var(--mk-violet))]",
  red: "bg-[hsl(var(--mk-red-soft))] text-[hsl(var(--mk-red))]",
};

export function FeatureMatrixSection() {
  return (
    <section id="features" className="relative scroll-mt-20 py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <div className="flex justify-center">
              <SectionLabel>كل المكونات</SectionLabel>
            </div>
            <h2 className="mk-display mk-display-lg mt-5">
              ماذا تحصل عليه بالضبط؟
              <br />
              <span style={{ color: "hsl(var(--mk-primary-deep))" }}>كل شيء، في نظام واحد</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
              خريطة كاملة بمكونات منصتك، مصنّفة لتستوعب ما بين يديك قبل أن تبدأ — وبلا مفاجآت
              لاحقة.
            </p>
          </Reveal>
        </div>

        <div className="mt-12">
          {MATRIX_GROUPS.map((g, i) => (
            <Reveal key={g.title} delay={Math.min(i * 50, 250)}>
              <div className="mk-matrix-row items-center">
                <div className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONE_CLASS[g.tone]}`}>
                    <g.icon size={17} aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                    {g.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.features.map((f) => (
                    <span key={f} className="mk-matrix-feature">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
