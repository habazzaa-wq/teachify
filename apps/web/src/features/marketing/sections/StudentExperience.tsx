import { Bell, Search, PlayCircle, Home, BookOpen, Wallet, Award, MessagesSquare } from "lucide-react";
import { SectionLabel } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { STUDENT_EXPERIENCE } from "@/features/marketing/data/content";
import { MockAvatar, MockBar } from "@/features/marketing/components/mock/Mock";

const TONE_CLASS: Record<string, string> = {
  coral: "bg-[hsl(var(--mk-primary-soft))] text-[hsl(var(--mk-primary-deep))]",
  gold: "bg-[hsl(var(--mk-gold-soft))] text-[hsl(var(--mk-gold-deep))]",
  blue: "bg-[hsl(var(--mk-blue-soft))] text-[hsl(var(--mk-blue))]",
  green: "bg-[hsl(var(--mk-green-soft))] text-[hsl(var(--mk-green))]",
  violet: "bg-[hsl(var(--mk-violet-soft))] text-[hsl(var(--mk-violet))]",
  red: "bg-[hsl(var(--mk-red-soft))] text-[hsl(var(--mk-red))]",
};

const DOCK = [
  { icon: Home, label: "الرئيسية", active: true },
  { icon: BookOpen, label: "كورساتي" },
  { icon: Wallet, label: "المحفظة" },
  { icon: Award, label: "الشهادات" },
  { icon: MessagesSquare, label: "المجتمع" },
];

function PhoneMock() {
  return (
    <div className="mk-phone">
      <div className="mk-phone-screen">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pb-1 pt-2.5 text-[0.55rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
          <span>9:41</span>
          <span className="h-1.5 w-8 rounded-full bg-[hsl(var(--mk-ink))]" />
          <span>LTE</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <div className="text-[0.6rem] font-bold text-[hsl(var(--mk-muted))]">صباح الخير 👋</div>
            <div className="text-[0.82rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>محمد</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-[hsl(var(--mk-line))] text-[hsl(var(--mk-muted))]">
              <Bell size={12} />
            </span>
            <MockAvatar initials="م" tone="coral" size={28} />
          </div>
        </div>

        {/* Continue banner */}
        <div className="mx-4 mt-1 rounded-2xl p-4" style={{ background: "linear-gradient(135deg, hsl(var(--mk-primary)), hsl(var(--mk-gold)))" }}>
          <div className="text-[0.62rem] font-bold text-white/85">واصل من حيث توقفت</div>
          <div className="mt-0.5 text-[0.8rem] font-black text-white">التفاضل والتكامل · الدرس 12</div>
          <div className="mt-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[hsl(var(--mk-primary-deep))]">
              <PlayCircle size={14} />
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/40">
              <div className="h-full w-[72%] rounded-full bg-white" />
            </div>
            <span className="text-[0.58rem] font-extrabold text-white">72%</span>
          </div>
        </div>

        {/* Progress cards */}
        <div className="mx-4 mt-3 rounded-2xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-3.5">
          <div className="flex items-center justify-between">
            <div className="text-[0.66rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>تقدمي في هذا الفصل</div>
            <span className="rounded-md px-1.5 py-0.5 text-[0.52rem] font-extrabold" style={{ background: "hsl(var(--mk-gold-soft))", color: "hsl(var(--mk-gold-deep))" }}>
              أعلى 10%
            </span>
          </div>
          <div className="mt-2.5 space-y-2.5">
            {[
              { name: "التفاضل والتكامل", v: 82, tone: "coral" as const },
              { name: "الجبر والهندسة", v: 64, tone: "blue" as const },
            ].map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-[0.58rem] font-bold">
                  <span style={{ color: "hsl(var(--mk-ink))" }}>{c.name}</span>
                  <span className="text-[hsl(var(--mk-muted))]">{c.v}%</span>
                </div>
                <MockBar value={c.v} tone={c.tone} className="mt-1 h-1.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming exam */}
        <div className="mx-4 mt-3 rounded-2xl border border-[hsl(var(--mk-line))] p-3.5" style={{ background: "hsl(var(--mk-violet-soft))" }}>
          <div className="flex items-center justify-between">
            <div className="text-[0.62rem] font-extrabold" style={{ color: "hsl(var(--mk-violet))" }}>امتحان قريب ⏰</div>
            <span className="text-[0.55rem] font-bold text-[hsl(var(--mk-muted))]">بعد 18 ساعة</span>
          </div>
          <div className="mt-1.5 text-[0.7rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
            اختبار منتصف الفصل — الرياضيات
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-lg px-3 py-1.5 text-[0.58rem] font-extrabold text-white" style={{ background: "hsl(var(--mk-violet))" }}>
              جهّز نفسك
            </span>
            <span className="text-[0.55rem] font-bold text-[hsl(var(--mk-muted))]">25 سؤالًا · 60 دقيقة</span>
          </div>
        </div>

        {/* Search */}
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-3 py-2.5 text-[0.6rem] font-bold text-[hsl(var(--mk-muted))]">
          <Search size={12} />
          ابحث عن كورس أو مادة…
        </div>

        {/* Bottom dock */}
        <div className="mx-3 mt-3 mb-2 flex items-center justify-between rounded-2xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-3 py-2.5 shadow-[0_10px_30px_-12px_hsl(var(--mk-primary)/0.3)]">
          {DOCK.map((d) => (
            <span key={d.label} className="flex flex-col items-center gap-1">
              <span
                className="grid h-7 w-7 place-items-center rounded-xl"
                style={d.active ? { background: "hsl(var(--mk-primary-soft))", color: "hsl(var(--mk-primary-deep))" } : { color: "hsl(var(--mk-muted))" }}
              >
                <d.icon size={13} aria-hidden="true" />
              </span>
              <span className="text-[0.46rem] font-extrabold" style={{ color: d.active ? "hsl(var(--mk-primary-deep))" : "hsl(var(--mk-muted))" }}>
                {d.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentExperienceSection() {
  return (
    <section id="students" className="relative scroll-mt-20 overflow-hidden bg-[hsl(var(--mk-bg-band))] py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_90%_20%,hsl(var(--mk-gold)/0.08),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
          {/* Content */}
          <div className="order-2 lg:order-1 lg:col-span-6">
            <Reveal>
              <SectionLabel>تجربة الطالب</SectionLabel>
              <h2 className="mk-display mk-display-lg mt-5">
                تجربة تعليمية
                <br />
                <span style={{ color: "hsl(var(--mk-primary-deep))" }}>يعشقها الطالب</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-6 max-w-lg text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                من لحظة تسجيل الطالب حتى إصدار شهادته، كل خطوة مصممة لتكون سلسة وواضحة
                ومحفّزة — على الهاتف أو الحاسوب أو الجهاز اللوحي.
              </p>
            </Reveal>
            <div className="mt-9 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {STUDENT_EXPERIENCE.map((item, i) => (
                <Reveal key={item.title} delay={120 + i * 60}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONE_CLASS[item.tone]}`}>
                      <item.icon size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-[0.9rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[0.8rem] leading-6" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div className="order-1 flex justify-center lg:order-2 lg:col-span-6">
            <Reveal delay={150}>
              <PhoneMock />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
