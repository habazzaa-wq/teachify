import { SectionLabel, CtaButton } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { STEPS, DEVELOPER_WHATSAPP } from "@/features/marketing/data/content";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden bg-[hsl(var(--mk-deep))] py-20 text-[hsl(var(--mk-deep-ink))] sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(44rem_26rem_at_90%_110%,hsl(var(--mk-primary)/0.12),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Sticky intro */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <SectionLabel className="mk-label-on-deep">كيف تبدأ</SectionLabel>
                <h2 className="mk-display mk-display-lg mt-5">
                  من الفكرة إلى الانطلاق…
                  <br />
                  <span style={{ color: "hsl(var(--mk-gold))" }}>خمس خطوات فقط</span>
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="mt-6 max-w-md text-base leading-8 text-[hsl(var(--mk-deep-muted))]">
                  لا كود، لا إعدادات معقدة، ولا سنوات انتظار. نتكفل بالبنية والتشغيل وأنت
                  تركّز على محتواك — تصل من الصفر إلى منصة منطلقة في أيام.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <CtaButton
                    variant="gold"
                    href={DEVELOPER_WHATSAPP}
                    external
                    ariaLabel="ناقش مشروعك عبر واتساب"
                  >
                    ناقش مشروعك
                  </CtaButton>
                  <span className="flex items-center gap-2 text-[0.8rem] font-bold text-[hsl(var(--mk-deep-muted))]">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--mk-gold))]" />
                    بيئة تجريبية كاملة أولًا
                  </span>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-7">
            <div className="space-y-8">
              {STEPS.map((s, i) => (
                <Reveal key={s.num} delay={i * 80}>
                  <div className="mk-step flex items-start gap-5">
                    <span className="mk-step-num">{s.num}</span>
                    <div className="pb-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg font-extrabold" style={{ color: "hsl(var(--mk-deep-ink))" }}>
                          {s.title}
                        </h3>
                        <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-extrabold text-[hsl(30_60%_10%)]" style={{ background: "hsl(var(--mk-gold) / 0.16)", color: "hsl(var(--mk-gold))" }}>
                          <s.icon size={12} aria-hidden="true" />
                          {s.num === "01" ? "أسبوع" : s.num === "02" ? "أيام" : s.num === "03" ? "أنت" : s.num === "04" ? "يوم الإطلاق" : "مستمر"}
                        </span>
                      </div>
                      <p className="mt-2 max-w-lg text-[0.86rem] leading-7 text-[hsl(var(--mk-deep-muted))]">
                        {s.description}
                      </p>
                    </div>
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
