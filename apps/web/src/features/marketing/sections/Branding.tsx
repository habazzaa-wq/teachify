import { GraduationCap, Palette, Globe, BadgeCheck } from "lucide-react";
import { SectionLabel } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";

function GenericBrandCard() {
  return (
    <div className="rounded-2xl border border-[hsl(var(--mk-deep-line))] bg-[hsl(var(--mk-deep-soft))] p-5 opacity-80">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--mk-deep-line))] text-[hsl(var(--mk-deep-muted))]">
          <GraduationCap size={18} />
        </span>
        <div className="h-3 w-24 rounded bg-[hsl(var(--mk-deep-line))]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-3/4 rounded bg-[hsl(var(--mk-deep-line))]" />
        <div className="h-2.5 w-full rounded bg-[hsl(var(--mk-deep-line))]" />
        <div className="h-2.5 w-2/3 rounded bg-[hsl(var(--mk-deep-line))]" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-7 w-20 rounded-lg bg-[hsl(var(--mk-deep-line))]" />
        <div className="h-7 w-14 rounded-lg bg-[hsl(var(--mk-deep-line))]" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--mk-deep-line))] pt-3 text-[0.65rem] font-bold text-[hsl(var(--mk-deep-muted))]">
        <span>لوحة تحكم عامة بلا هوية</span>
        <span className="rounded-md bg-[hsl(var(--mk-deep-line))] px-2 py-0.5 text-[hsl(var(--mk-deep-muted))]">platform.com</span>
      </div>
    </div>
  );
}

function BrandedCard() {
  return (
    <div className="rounded-2xl border border-[hsl(var(--mk-gold)/0.35)] bg-[hsl(var(--mk-deep-soft))] p-5 shadow-[0_24px_60px_-24px_hsl(var(--mk-gold)/0.2)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: "hsl(var(--mk-primary))" }}>
          <GraduationCap size={18} />
        </span>
        <div className="text-sm font-black" style={{ color: "hsl(var(--mk-deep-ink))" }}>
          أكاديمية الرياضيات
        </div>
        <span className="ms-auto rounded-md px-2 py-0.5 text-[0.6rem] font-extrabold text-[hsl(30_60%_10%)]" style={{ background: "hsl(var(--mk-gold))" }}>
          منصتك
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-3/4 rounded" style={{ background: "linear-gradient(to left, hsl(var(--mk-primary)), hsl(var(--mk-primary)/0.4))" }} />
        <div className="h-2.5 w-full rounded bg-[hsl(var(--mk-deep-line))]" />
        <div className="h-2.5 w-2/3 rounded bg-[hsl(var(--mk-deep-line))]" />
      </div>
      <div className="mt-4 flex gap-2">
        <span className="rounded-lg px-4 py-1.5 text-[0.7rem] font-extrabold text-white" style={{ background: "hsl(var(--mk-primary))" }}>
          ابدأ التعلم
        </span>
        <span className="rounded-lg border border-[hsl(var(--mk-deep-line))] px-4 py-1.5 text-[0.7rem] font-extrabold text-[hsl(var(--mk-deep-ink))]">
          تصفح الكورسات
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--mk-deep-line))] pt-3 text-[0.65rem] font-bold">
        <span style={{ color: "hsl(var(--mk-gold))" }}>بهويتك الكاملة</span>
        <span className="text-[hsl(var(--mk-deep-muted))]" dir="ltr">your-academy.com</span>
      </div>
    </div>
  );
}

const POINTS = [
  {
    icon: Globe,
    title: "نطاقك الخاص",
    description: "اسمك عنوانك: your-academy.com بدلًا من رابط عام يحمل اسم طرف ثالث.",
  },
  {
    icon: Palette,
    title: "شعار وألوان وخطوط",
    description: "نطبّق هويتك على كل شاشة في المنصة — من صفحة الدخول إلى الشهادات.",
  },
  {
    icon: BadgeCheck,
    title: "انطباع احترافي",
    description: "طلابك يثقون بالعلامات الواضحة؛ منصتك الخاصة تعزز مصداقيتك من اللحظة الأولى.",
  },
];

export function BrandingSection() {
  return (
    <section id="branding" className="relative scroll-mt-20 overflow-hidden bg-[hsl(var(--mk-deep))] py-20 text-[hsl(var(--mk-deep-ink))] sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(46rem_26rem_at_85%_0%,hsl(var(--mk-gold)/0.08),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Transformation composition */}
          <div className="lg:col-span-7">
            <div className="relative">
              <Reveal delay={80}>
                <GenericBrandCard />
              </Reveal>
              <div className="mk-transform-node relative my-4 flex items-center justify-center">
                <span className="mk-transform-step absolute -top-3 rounded-full px-3 py-1 text-[0.62rem] font-extrabold text-white" style={{ background: "hsl(var(--mk-primary))" }}>
                  هويتك تُضاف
                </span>
              </div>
              <Reveal delay={160}>
                <BrandedCard />
              </Reveal>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel className="mk-label-on-deep">علامتك التجارية</SectionLabel>
              <h2 className="mk-display mk-display-lg mt-5">
                منصة عامة…
                <br />
                <span style={{ color: "hsl(var(--mk-gold))" }}>إلى علامتك الخاصة</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-6 max-w-md text-base leading-8 text-[hsl(var(--mk-deep-muted))]">
                المنصات العامة تشبه بعضها؛ علامتك لا تُشبه أحدًا. نسلمك منصة تحمل اسمك وشعارك
                وألوانك في كل تفصيلة — دون أي ذكر لاسمنا.
              </p>
            </Reveal>
            <div className="mt-8 space-y-3">
              {POINTS.map((p, i) => (
                <Reveal key={p.title} delay={140 + i * 70}>
                  <div className="flex items-start gap-4 rounded-xl border border-[hsl(var(--mk-deep-line))] bg-[hsl(var(--mk-deep-soft))] p-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[hsl(30_60%_10%)]" style={{ background: "hsl(var(--mk-gold))" }}>
                      <p.icon size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-[0.9rem] font-extrabold" style={{ color: "hsl(var(--mk-deep-ink))" }}>
                        {p.title}
                      </h3>
                      <p className="mt-1 text-[0.78rem] leading-5 text-[hsl(var(--mk-deep-muted))]">
                        {p.description}
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
