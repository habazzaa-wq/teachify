import { ArrowIcon, SectionLabel } from "@/features/marketing/components/ui";
import { AnchorLink } from "@/features/marketing/components/AnchorLink";
import { Reveal } from "@/features/marketing/components/Reveal";
import { AnalyticsPanel } from "@/features/marketing/sections/showcase/AnalyticsPanel";

const METRICS = [
  { value: "+18%", label: "متوسط نمو الإيرادات شهريًا" },
  { value: "92%", label: "معدل إتمام الكورسات" },
  { value: "4.9", label: "متوسط تقييم المنصات" },
];

export function AnalyticsSection() {
  return (
    <section id="analytics" className="relative scroll-mt-20 overflow-hidden bg-[hsl(var(--mk-bg-band))] py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_10%_10%,hsl(var(--mk-primary)/0.06),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Content rail */}
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel>التحليلات</SectionLabel>
              <h2 className="mk-display mk-display-lg mt-5">
                قرارات مبنية على أرقام…
                <br />
                <span style={{ color: "hsl(var(--mk-primary-deep))" }}>ليست على التخمين</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-6 max-w-md text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                تابع إيراداتك، نمو طلابك، وأداء كل كورس في لوحة واحدة واضحة. اعرف أي كورس
                يحقق أفضل نتائج، وأي طالب يحتاج إلى دعم — قبل أن يسألك.
              </p>
            </Reveal>
            <div className="mt-9 space-y-6">
              {METRICS.map((m, i) => (
                <Reveal key={m.label} delay={140 + i * 70}>
                  <div className="flex items-center gap-5 border-b border-[hsl(var(--mk-line))] pb-5">
                    <span className="text-3xl font-black tracking-tight" style={{ color: "hsl(var(--mk-primary-deep))" }}>
                      {m.value}
                    </span>
                    <span className="text-[0.85rem] font-bold" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                      {m.label}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={360}>
              <AnchorLink href="/#showcase" className="mk-link-arrow mt-8">
                راجع بقية مكونات المنصة
                <ArrowIcon />
              </AnchorLink>
            </Reveal>
          </div>

          {/* Mockup */}
          <div className="lg:col-span-7">
            <Reveal delay={120}>
              <AnalyticsPanel />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
