import { ArrowIcon, SectionLabel } from "@/features/marketing/components/ui";
import { AnchorLink } from "@/features/marketing/components/AnchorLink";
import { Reveal } from "@/features/marketing/components/Reveal";
import { WHY_ITEMS } from "@/features/marketing/data/content";

const TONE_CLASS: Record<string, string> = {
  coral: "bg-[hsl(var(--mk-primary-soft))] text-[hsl(var(--mk-primary-deep))]",
  gold: "bg-[hsl(var(--mk-gold-soft))] text-[hsl(var(--mk-gold-deep))]",
  blue: "bg-[hsl(var(--mk-blue-soft))] text-[hsl(var(--mk-blue))]",
  green: "bg-[hsl(var(--mk-green-soft))] text-[hsl(var(--mk-green))]",
  violet: "bg-[hsl(var(--mk-violet-soft))] text-[hsl(var(--mk-violet))]",
  red: "bg-[hsl(var(--mk-red-soft))] text-[hsl(var(--mk-red))]",
};

export function WhyTeachifySection() {
  return (
    <section id="why" className="relative scroll-mt-20 py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* ── Sticky editorial rail ── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <SectionLabel>لماذا تيتشيفاي</SectionLabel>
                <h2 className="mk-display mk-display-lg mt-5">
                  بنية تحتية كاملة…
                  <br />
                  <span style={{ color: "hsl(var(--mk-primary-deep))" }}>وأنت صاحب المنصة</span>
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="mt-6 max-w-md text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                  لا نبيعك موقعًا جاهزًا يخصنا. نبني لك منصة تعليمية تعمل بكامل طاقتها — وتحمل
                  اسمك أنت. هذه هي الأفكار التي بنينا عليها كل قرار في تيتشيفاي.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <AnchorLink href="/#showcase" className="mk-link-arrow mt-8">
                  شاهد المنصة في العمل
                  <ArrowIcon />
                </AnchorLink>
              </Reveal>
            </div>
          </div>

          {/* ── Numbered editorial list ── */}
          <div className="lg:col-span-7">
            <div className="border-t border-[hsl(var(--mk-line))]">
              {WHY_ITEMS.map((item, i) => (
                <Reveal key={item.num} delay={i * 60}>
                  <div className="group flex items-start gap-5 border-b border-[hsl(var(--mk-line))] py-7 transition-colors duration-300 hover:bg-[hsl(var(--mk-bg-band)/0.5)] sm:gap-7 sm:px-3">
                    <span
                      className="mt-1 w-12 shrink-0 text-2xl font-black tracking-tight transition-colors duration-300 group-hover:text-[hsl(var(--mk-primary))] sm:w-16"
                      style={{ color: "hsl(var(--mk-line-strong))" }}
                    >
                      {item.num}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`grid h-8 w-8 place-items-center rounded-lg ${TONE_CLASS[item.tone]}`}>
                          <item.icon size={16} aria-hidden="true" />
                        </span>
                        <h3
                          className="text-lg font-extrabold sm:text-xl"
                          style={{ color: "hsl(var(--mk-ink))", transition: "color .3s ease" }}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <p
                        className="mt-2.5 max-w-lg text-sm leading-7 sm:text-[0.95rem]"
                        style={{ color: "hsl(var(--mk-ink-soft))" }}
                      >
                        {item.description}
                      </p>
                    </div>
                    <ArrowIcon className="mt-2 hidden w-5 shrink-0 -scale-x-100 text-[hsl(var(--mk-line-strong))] transition-all duration-300 group-hover:text-[hsl(var(--mk-primary))] md:block" />
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
