import { ArrowIcon, SectionLabel } from "@/features/marketing/components/ui";
import { AnchorLink } from "@/features/marketing/components/AnchorLink";
import { Reveal } from "@/features/marketing/components/Reveal";
import { TEACHER_CAPABILITIES } from "@/features/marketing/data/content";

const TONE_CLASS: Record<string, string> = {
  coral: "bg-[hsl(var(--mk-primary-soft))] text-[hsl(var(--mk-primary-deep))]",
  gold: "bg-[hsl(var(--mk-gold-soft))] text-[hsl(var(--mk-gold-deep))]",
  blue: "bg-[hsl(var(--mk-blue-soft))] text-[hsl(var(--mk-blue))]",
  green: "bg-[hsl(var(--mk-green-soft))] text-[hsl(var(--mk-green))]",
  violet: "bg-[hsl(var(--mk-violet-soft))] text-[hsl(var(--mk-violet))]",
  red: "bg-[hsl(var(--mk-red-soft))] text-[hsl(var(--mk-red))]",
};

export function ForTeachersSection() {
  return (
    <section id="for-teachers" className="relative scroll-mt-20 py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Editorial intro */}
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel>للمعلّمين</SectionLabel>
              <h2 className="mk-display mk-display-lg mt-5">
                ركّز على التدريس…
                <br />
                <span style={{ color: "hsl(var(--mk-primary-deep))" }}>ودَع الباقي لنا</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-6 max-w-md text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                بدلًا من التنقل بين منصات منفصلة وجداول مبعثرة، اجمع محتواك وطلابك ومدفوعاتك
                ومجتمعك في مكان واحد — ببيئة نظيفة صُممت خصيصًا لطريقة عمل المدرّس العربي.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <AnchorLink href="/#cta" className="mk-btn mk-btn-primary">
                  ابدأ منصتك الآن
                </AnchorLink>
                <AnchorLink href="/#analytics" className="mk-link-arrow">
                  تعرّف على التحليلات
                  <ArrowIcon />
                </AnchorLink>
              </div>
            </Reveal>
          </div>

          {/* Capability tiles */}
          <div className="lg:col-span-7">
            <div className="grid gap-3.5 sm:grid-cols-2">
              {TEACHER_CAPABILITIES.map((c, i) => (
                <Reveal key={c.title} delay={(i % 2) * 80 + Math.floor(i / 2) * 60}>
                  <div className="group h-full rounded-2xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[hsl(var(--mk-primary)/0.4)] hover:shadow-[0_16px_40px_-16px_hsl(var(--mk-primary)/0.25)]">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-10 w-10 place-items-center rounded-xl ${TONE_CLASS[c.tone]}`}>
                        <c.icon size={18} aria-hidden="true" />
                      </span>
                      <h3 className="text-[0.95rem] font-extrabold leading-6" style={{ color: "hsl(var(--mk-ink))" }}>
                        {c.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-[0.82rem] leading-6" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                      {c.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
