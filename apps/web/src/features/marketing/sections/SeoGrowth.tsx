import { SectionLabel } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { SEO_CAPABILITIES } from "@/features/marketing/data/content";

function GoogleResult() {
  return (
    <div className="mk-google p-5">
      <div className="mk-google-logo flex items-center gap-1 text-[1.05rem] font-black tracking-tight" dir="ltr">
        {["G", "o", "o", "g", "l", "e"].map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2.5 rounded-full border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] px-4 py-2">
        <span
          className="grid h-5 w-5 place-items-center rounded-full text-[0.55rem] font-black text-white"
          style={{ background: "hsl(var(--mk-primary))" }}
        >
          أ
        </span>
        <span className="text-[0.75rem] font-bold text-[hsl(var(--mk-ink))]" dir="ltr">
          your-academy.com
        </span>
      </div>
      <div className="mt-4">
        <div className="text-lg font-bold text-[#1a0dab]" dir="ltr">
          أكاديمية الرياضيات | كورسات تأسيس وتفوق
        </div>
        <div className="mt-1 text-[0.78rem] leading-6 text-[#4d5156]">
          منصة تعليمية متكاملة باسم أكاديمية الرياضيات: دروس تفاعلية، امتحانات دورية،
          ونتائج فورية. انضم إلى أكثر من 1,000 طالب.
        </div>
        <div className="mt-0.5 text-[0.75rem] font-bold text-[#70757a]" dir="ltr">
          your-academy.com/courses
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[0.68rem] font-bold text-[hsl(var(--mk-muted))]">
        <span className="rounded-full bg-[hsl(var(--mk-ok-soft))] px-2.5 py-1 text-[hsl(var(--mk-ok))]">
          ✓ بيانات منظمة
        </span>
        <span className="rounded-full bg-[hsl(var(--mk-gold-soft))] px-2.5 py-1 text-[hsl(var(--mk-gold-deep))]">
          ✓ روابط سليمة
        </span>
        <span className="rounded-full bg-[hsl(var(--mk-primary-soft))] px-2.5 py-1 text-[hsl(var(--mk-primary-deep))]">
          ✓ تحديث تلقائي
        </span>
      </div>
    </div>
  );
}

export function SeoGrowthSection() {
  return (
    <section id="seo" className="relative scroll-mt-20 py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Sticky intro + Google mock */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <SectionLabel>النمو وظهورك في البحث</SectionLabel>
                <h2 className="mk-display mk-display-lg mt-5">
                  يجدك طلابك الجدد…
                  <br />
                  <span style={{ color: "hsl(var(--mk-primary-deep))" }}>حين يبحثون على Google</span>
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="mt-6 max-w-md text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                  منصتك ليست فقط مكانًا لتعلّم الطلاب الحاليين — إنها وجهة يجدها الطلاب الجدد.
                  بنية SEO كاملة مدمجة، من فهرسة الصفحات إلى البيانات المنظمة.
                </p>
              </Reveal>
              <Reveal delay={200} className="mt-9">
                <GoogleResult />
              </Reveal>
            </div>
          </div>

          {/* SEO capability rows */}
          <div className="lg:col-span-7">
            <div className="flex flex-col gap-3">
              {SEO_CAPABILITIES.map((c, i) => (
                <Reveal key={c.title} delay={i * 70}>
                  <div className="mk-seo-row">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--mk-primary-soft))] text-[hsl(var(--mk-primary-deep))]">
                      <c.icon size={17} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[0.9rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                        {c.title}
                      </h3>
                      <p className="mt-0.5 text-[0.78rem] leading-5" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                        {c.description}
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
