import { Check } from "lucide-react";
import { SectionLabel, CtaButton } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { EXAM_FEATURES, DEVELOPER_WHATSAPP } from "@/features/marketing/data/content";
import { ExamPanel } from "@/features/marketing/sections/showcase/ExamPanel";

export function ExamsSection() {
  return (
    <section id="exams" className="relative scroll-mt-20 overflow-hidden bg-[hsl(var(--mk-deep))] py-20 text-[hsl(var(--mk-deep-ink))] sm:py-24 lg:py-32">
      {/* Deep band décor */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(46rem_30rem_at_15%_0%,hsl(var(--mk-primary)/0.14),transparent_60%),radial-gradient(40rem_26rem_at_100%_100%,hsl(var(--mk-gold)/0.1),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mk-grid-bg" style={{ backgroundImage: "linear-gradient(to right, hsl(var(--mk-deep-ink)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--mk-deep-ink)) 1px, transparent 1px)" }} />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Mockup */}
          <div className="lg:col-span-7">
            <Reveal delay={120}>
              <div className="overflow-hidden rounded-[0.9rem]">
                <ExamPanel />
              </div>
            </Reveal>
          </div>

          {/* Content */}
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel className="mk-label-on-deep">الامتحانات والتقييم</SectionLabel>
              <h2 className="mk-display mk-display-lg mt-5">
                امتحانات حقيقية…
                <br />
                <span style={{ color: "hsl(var(--mk-gold))" }}>ونتائج فورية</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-6 max-w-md text-base leading-8 text-[hsl(var(--mk-deep-muted))]">
                من بناء بنوك الأسئلة إلى إطلاق الامتحان ثم نشر النتائج — تجربة كاملة تحاكي
                الامتحان الورقي الحقيقي، مع تصحيح تلقائي وتحليل أداء يوفّر عليك أيامًا من العمل.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {EXAM_FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={140 + i * 60}>
                  <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--mk-deep-line))] bg-[hsl(var(--mk-deep-soft))] p-4">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[hsl(var(--mk-gold))] text-[hsl(30_60%_10%)]">
                      <f.icon size={15} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-[0.85rem] font-extrabold" style={{ color: "hsl(var(--mk-deep-ink))" }}>
                        {f.title}
                      </h3>
                      <p className="mt-1 text-[0.75rem] leading-5 text-[hsl(var(--mk-deep-muted))]">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={300}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <CtaButton
                  variant="gold"
                  href={DEVELOPER_WHATSAPP}
                  external
                  ariaLabel="احجز منصتك عبر واتساب"
                >
                  احجز منصتك
                </CtaButton>
                <span className="flex items-center gap-2 text-[0.8rem] font-bold text-[hsl(var(--mk-deep-muted))]">
                  <Check size={15} className="text-[hsl(var(--mk-gold))]" />
                  بدون حدود على عدد الامتحانات
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
