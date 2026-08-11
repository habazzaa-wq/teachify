import { GraduationCap, Mail, MessageCircle } from "lucide-react";
import { SectionLabel } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { FaqAccordion } from "@/features/marketing/components/FaqAccordion";
import { SITE_NAME_AR, DEVELOPER_WHATSAPP, CONTACT_EMAIL } from "@/features/marketing/data/content";

export function FinalCtaSection() {
  return (
    <>
      {/* FAQ */}
      <section id="faq" className="relative scroll-mt-20 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <Reveal>
                <SectionLabel>أسئلة شائعة</SectionLabel>
                <h2 className="mk-display mk-display-lg mt-5">
                  كل ما تريد معرفته…
                  <br />
                  <span style={{ color: "hsl(var(--mk-primary-deep))" }}>قبل أن تبدأ</span>
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="mt-6 max-w-md text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                  إجابات مباشرة على الأسئلة الأكثر تكرارًا. وإن كان سؤالك غير موجود هنا —
                  نحن على بُعد رسالة.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-7">
              <Reveal delay={120}>
                <FaqAccordion />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="relative scroll-mt-20 pb-20 sm:pb-24 lg:pb-32">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal>
            <div className="mk-cta-panel px-6 py-14 text-center sm:px-12 sm:py-20">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--mk-primary))] shadow-[0_18px_40px_-12px_hsl(var(--mk-primary)/0.6)]">
                <GraduationCap size={26} className="text-white" />
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl mk-display mk-display-lg" style={{ color: "hsl(var(--mk-deep-ink))" }}>
                منصتك التعليمية في انتظارك
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-8" style={{ color: "hsl(var(--mk-deep-muted))" }}>
                احجز منصتك اليوم، وابدأ ببيئة تجريبية كاملة قبل أي التزام. نردّ عليك شخصيًا
                خلال وقت قصير — من فريقٍ بنى هذا النظام ويديره.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={DEVELOPER_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mk-btn mk-btn-gold"
                  aria-label="احجز منصتك عبر واتساب"
                >
                  <MessageCircle size={17} />
                  احجز منصتك الآن
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mk-btn mk-btn-ghost-deep"
                  aria-label="راسلنا عبر البريد الإلكتروني"
                >
                  <Mail size={16} />
                  {CONTACT_EMAIL}
                </a>
              </div>
              <p className="mt-7 text-[0.75rem] font-bold text-[hsl(var(--mk-deep-muted))]">
                {SITE_NAME_AR} — منصتك، بهويتك، وبكل قوة.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
