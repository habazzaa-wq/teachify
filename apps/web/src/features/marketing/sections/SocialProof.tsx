import { Rocket, Layers, RefreshCcw, HeartHandshake } from "lucide-react";
import { SectionLabel } from "@/features/marketing/components/ui";
import { AnchorLink } from "@/features/marketing/components/AnchorLink";
import { Reveal } from "@/features/marketing/components/Reveal";

const FACTS = [
  {
    icon: Rocket,
    title: "مبنيّ بالفعل، ليس وعدًا",
    description:
      "هذه البنية تشغّل منصات حقيقية اليوم: متاجر، لوحات مدرّسين، امتحانات، ومجتمعات — ليست صورًا مرسومة على الورق.",
  },
  {
    icon: Layers,
    title: "يتوسع مع طلبك",
    description:
      "تبدأ بكورس واحد وتنمو إلى آلاف الطلاب — البنية قابلة للتوسع، والتصميم يظل متسقًا وبهويتك.",
  },
  {
    icon: RefreshCcw,
    title: "تتطور تلقائيًا",
    description:
      "تحسينات وتحديثات منتظمة تصل إلى منصتك دون رسوم إضافية أو أدوات منفصلة للاشتراك بها.",
  },
];

export function SocialProofSection() {
  return (
    <section id="trust" className="relative scroll-mt-20 py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Statement */}
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel>بلا مبالغات</SectionLabel>
              <h2 className="mk-display mk-display-lg mt-5">
                نفضّل أن تختبر…
                <br />
                <span style={{ color: "hsl(var(--mk-primary-deep))" }}>لا أن تثق بكلامنا</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-6 max-w-md text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                لن نذكر أرقامًا مختلقة أو شهادات وهمية. ما نقدمه لك قبل الاشتراك: بيئة تجريبية
                كاملة تلمسها بنفسك، وحديث مباشر مع من بنى هذا النظام.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <figure className="mt-9 border-s-[3px] ps-5" style={{ borderColor: "hsl(var(--mk-gold))" }}>
                <blockquote className="text-lg font-bold leading-8" style={{ color: "hsl(var(--mk-ink))" }}>
                  «أردنا منصة نتعلّم بها نحن أولًا، ثم نسلّمها لمن يستحق أن تُبنى باسمه.»
                </blockquote>
                <figcaption className="mt-3 flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "hsl(var(--mk-primary))" }}>
                    <HeartHandshake size={15} className="text-white" />
                  </span>
                  <span className="text-[0.8rem] font-extrabold" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                    فريق تيتشيفاي
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          </div>

          {/* Honest facts */}
          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-3">
              {FACTS.map((f, i) => (
                <Reveal key={f.title} delay={i * 90}>
                  <div className="flex h-full flex-col rounded-2xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[hsl(var(--mk-primary)/0.4)]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[hsl(var(--mk-primary-soft))] text-[hsl(var(--mk-primary-deep))]">
                      <f.icon size={19} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-[0.95rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                      {f.title}
                    </h3>
                    <p className="mt-2 text-[0.8rem] leading-6" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                      {f.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={280}>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-[hsl(var(--mk-line-strong))] bg-[hsl(var(--mk-surface))] px-6 py-5">
                <div>
                  <div className="text-[0.9rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                    بيئة تجريبية قبل أي التزام
                  </div>
                  <div className="mt-1 text-[0.78rem]" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                    جرّب لوحات التحكم والامتحانات بنفسك، ثم قرّر.
                  </div>
                </div>
                <AnchorLink href="/#cta" className="mk-btn mk-btn-ghost">
                  اطلب التجربة
                </AnchorLink>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
