import { ArrowUpLeft, BookOpen, Check, GraduationCap, Users } from "lucide-react";
import { SectionLabel } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { DEMO_PLATFORMS } from "@/features/marketing/data/content";

export function DemosSection() {
  return (
    <section id="demos" className="relative scroll-mt-20 overflow-hidden bg-[hsl(var(--mk-bg-band))] py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,hsl(var(--mk-gold)/0.06),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <div className="flex justify-center">
              <SectionLabel>أمثلة على منصات</SectionLabel>
            </div>
            <h2 className="mk-display mk-display-lg mt-5">
              منصات مختلفة…
              <br />
              <span style={{ color: "hsl(var(--mk-primary-deep))" }}>وبنية واحدة قوية</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
              مدرّس، أكاديمية، مدرسة، أو مركز تدريب — تيتشيفاي تتكيف مع طبيعة تعليمك.
              هذه أمثلة توضيحية كيف قد تبدو كل منها.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {DEMO_PLATFORMS.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] shadow-[var(--mk-shadow-sm)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--mk-shadow)]">
                {/* Card header */}
                <div className="relative p-5 pb-4" style={{ background: `linear-gradient(135deg, ${p.accentSoft}, hsl(var(--mk-surface)) 70%)` }}>
                  <div className="flex items-center justify-between">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg"
                      style={{ background: p.accent }}
                    >
                      <p.icon size={20} aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-[hsl(var(--mk-line))] bg-white/70 px-2.5 py-1 text-[0.58rem] font-extrabold text-[hsl(var(--mk-muted))] backdrop-blur">
                      مثال توضيحي
                    </span>
                  </div>
                  <h3 className="mt-3.5 text-lg font-black leading-6" style={{ color: "hsl(var(--mk-ink))" }}>
                    {p.name}
                  </h3>
                  <p className="mt-0.5 text-[0.72rem] font-bold" style={{ color: p.accent }}>
                    {p.category}
                  </p>
                  <p className="mt-2 text-[0.78rem] leading-6" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                    {p.description}
                  </p>
                </div>

                {/* Course list */}
                <div className="flex-1 space-y-2 border-y border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4">
                  {p.courses.map((c) => (
                    <div key={c.title} className="flex items-center gap-2.5 rounded-lg border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] px-3 py-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white" style={{ background: p.accent }}>
                        <BookOpen size={13} />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[0.7rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                          {c.title}
                        </div>
                        <div className="text-[0.6rem] font-bold text-[hsl(var(--mk-muted))]">{c.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4">
                  <span className="flex items-center gap-1.5 text-[0.66rem] font-extrabold" style={{ color: p.accent }}>
                    <Check size={13} /> يبنيها تيتشيفاي
                  </span>
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-[-35deg]"
                    style={{ background: p.accentSoft, color: p.accent }}
                  >
                    <ArrowUpLeft size={14} />
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-3 rounded-full border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-6 py-3 text-[0.8rem] font-bold text-[hsl(var(--mk-ink-soft))]">
            <span className="flex items-center gap-1.5 text-[hsl(var(--mk-primary-deep))]">
              <GraduationCap size={15} />
            </span>
            منصتك القادمة قد تكون أيًا من هذه الصور — أو شيئًا جديدًا كليًا.
            <span className="flex items-center gap-1.5 font-extrabold" style={{ color: "hsl(var(--mk-primary-deep))" }}>
              <Users size={15} />
              نحن جاهزون
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
