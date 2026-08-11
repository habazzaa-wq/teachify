import {
  Bell,
  BookOpen,
  Timer,
  Award,
  MessagesSquare,
  Users,
  Wallet,
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { CtaButton, ArrowIcon } from "@/features/marketing/components/ui";
import {
  MockAvatar,
  MockBar,
  MockIconTile,
} from "@/features/marketing/components/mock/Mock";
import { BarsChart } from "@/features/marketing/components/mock/charts";

const MARQUEE = [
  "كورسات",
  "امتحانات",
  "طلاب",
  "مدفوعات",
  "شهادات",
  "مجتمع",
  "تحليلات",
  "SEO",
  "نطاق خاص",
  "دردشة مباشرة",
  "مكافآت",
  "لوحات ترتيب",
];

const FACTS = [
  { icon: Sparkles, text: "بدون برمجة" },
  { icon: Timer, text: "إطلاق خلال أيام" },
  { icon: GraduationCap, text: "تحكم كامل بعلامتك" },
];

export function HeroSection() {
  return (
    <div className="mk-hero">
      <div className="mk-hero-grid mk-grid-bg" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-14 sm:px-8 lg:px-10 lg:pb-20 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* ── Copy ── */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="mk-hero-enter" style={{ "--mk-d": "0.05s" } as React.CSSProperties}>
              <span className="mk-hero-chip">
                <span className="mk-tag-dot" style={{ background: "hsl(var(--mk-primary))" }} />
                منصة صناعة المنصات التعليمية
              </span>
            </div>

            <h1
              className="mk-display mk-display-xl mt-6 text-balance"
              style={{ color: "hsl(var(--mk-ink))" }}
            >
              <span className="mk-hero-enter block" style={{ "--mk-d": "0.12s" } as React.CSSProperties}>
                منصتك التعليمية،
              </span>
              <span
                className="mk-hero-enter block"
                style={
                  {
                    "--mk-d": "0.2s",
                    color: "hsl(var(--mk-primary-deep))",
                  } as React.CSSProperties
                }
              >
                بهويتك،
              </span>
              <span className="mk-hero-enter block" style={{ "--mk-d": "0.28s" } as React.CSSProperties}>
                وبكل قوة.
              </span>
            </h1>

            <p
              className="mk-hero-enter mt-6 max-w-lg text-base leading-8 sm:text-lg sm:leading-9"
              style={{ "--mk-d": "0.36s", color: "hsl(var(--mk-ink-soft))" } as React.CSSProperties}
            >
              تيتشيفاي تمنح المعلمين والأكاديميات بنية تحتية كاملة لإطلاق منصة تعليمية رقمية —
              كورسات، امتحانات، طلاب، مدفوعات، شهادات، ومجتمع تفاعلي — تحت علامتهم التجارية الخاصة.
            </p>

            <div
              className="mk-hero-enter mt-9 flex flex-wrap items-center gap-3"
              style={{ "--mk-d": "0.44s" } as React.CSSProperties}
            >
              <CtaButton href="/#cta" variant="primary">
                احجز منصتك
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </CtaButton>
              <CtaButton href="/#ecosystem" variant="ghost">
                استكشف الإمكانيات
                <ArrowIcon />
              </CtaButton>
            </div>

            <div
              className="mk-hero-enter mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
              style={{ "--mk-d": "0.52s" } as React.CSSProperties}
            >
              {FACTS.map((fact) => (
                <span
                  key={fact.text}
                  className="flex items-center gap-2 text-sm font-bold"
                  style={{ color: "hsl(var(--mk-ink-soft))" }}
                >
                  <fact.icon
                    className="h-4 w-4"
                    style={{ color: "hsl(var(--mk-primary-deep))" }}
                    aria-hidden="true"
                  />
                  {fact.text}
                </span>
              ))}
            </div>
          </div>

          {/* ── Visual composition ── */}
          <div className="relative lg:col-span-6 xl:col-span-6">
            <div className="mk-hero-enter-scale relative" style={{ "--mk-d": "0.3s" } as React.CSSProperties}>
              {/* Main teacher-dashboard window */}
              <div className="mk-hero-main">
                <div className="flex items-center gap-2 border-b border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] px-4 py-3">
                  <span className="mk-window-dot" style={{ background: "hsl(var(--mk-primary)/0.7)" }} />
                  <span className="mk-window-dot" style={{ background: "hsl(var(--mk-gold))" }} />
                  <span className="mk-window-dot" style={{ background: "hsl(var(--mk-line-strong))" }} />
                  <span className="ms-2 flex-1 truncate rounded-md border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-3 py-1 text-[0.68rem] text-[hsl(var(--mk-muted))]">
                    <span style={{ color: "hsl(var(--mk-primary-deep))" }} className="font-bold">
                      أكاديميتك
                    </span>
                    .com/teacher/dashboard
                  </span>
                </div>

                <div className="grid grid-cols-[auto_1fr]">
                  {/* Sidebar */}
                  <div
                    className="hidden flex-col gap-1 border-e border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] px-2.5 py-4 sm:flex"
                    aria-hidden="true"
                  >
                    {[
                      { icon: <GraduationCap size={13} />, label: "لوحة التحكم", active: true },
                      { icon: <BookOpen size={13} />, label: "كورساتي" },
                      { icon: <Users size={13} />, label: "طلابي" },
                      { icon: <BarChart3 size={13} />, label: "الامتحانات" },
                      { icon: <Wallet size={13} />, label: "المدفوعات" },
                      { icon: <MessagesSquare size={13} />, label: "المجتمع" },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[0.66rem] font-bold"
                        style={
                          item.active
                            ? { background: "hsl(var(--mk-primary-soft))", color: "hsl(var(--mk-primary-deep))" }
                            : { color: "hsl(var(--mk-muted))" }
                        }
                      >
                        {item.icon}
                        {item.label}
                      </span>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[0.8rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                          مساء الخير، أ. محمود 👋
                        </div>
                        <div className="text-[0.62rem] text-[hsl(var(--mk-muted))]">
                          هذا أسبوعك في أكاديميتك
                        </div>
                      </div>
                      <span className="relative grid h-8 w-8 place-items-center rounded-full border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))]">
                        <Bell size={14} style={{ color: "hsl(var(--mk-muted))" }} />
                        <span
                          className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full"
                          style={{ background: "hsl(var(--mk-primary))" }}
                        />
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { v: "4,250 ر.س", l: "إيرادات الشهر", c: "hsl(var(--mk-primary-deep))" },
                        { v: "1,248", l: "طالب نشط", c: "hsl(var(--mk-ink))" },
                        { v: "92%", l: "معدل الإتمام", c: "hsl(var(--mk-ok))" },
                      ].map((s) => (
                        <div key={s.l} className="rounded-lg border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-2.5 py-2.5">
                          <div className="text-sm font-extrabold leading-none" style={{ color: s.c }}>
                            {s.v}
                          </div>
                          <div className="mt-1.5 text-[0.58rem] font-medium text-[hsl(var(--mk-muted))]">
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-lg border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-3 pb-2 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.68rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                          تسجيل الطلاب هذا الشهر
                        </span>
                        <span className="text-[0.6rem] text-[hsl(var(--mk-muted))]">أسبوعيًا</span>
                      </div>
                      <BarsChart data={[4, 7, 5, 9, 8, 12, 11, 14]} height={64} tone="gold" delay={400} />
                    </div>

                    <div className="mt-3 space-y-2">
                      {[
                        { name: "سارة أحمد", meta: "اشتركت في التفاضل والتكامل", tone: "coral" as const },
                        { name: "يوسف كمال", meta: "أنهى امتحان الجبر — 18/20", tone: "green" as const },
                      ].map((row) => (
                        <div key={row.name} className="flex items-center gap-2.5">
                          <MockAvatar initials={row.name.charAt(0)} tone={row.tone} size={26} />
                          <div className="min-w-0">
                            <div className="truncate text-[0.68rem] font-bold" style={{ color: "hsl(var(--mk-ink))" }}>
                              {row.name}
                            </div>
                            <div className="truncate text-[0.58rem] text-[hsl(var(--mk-muted))]">{row.meta}</div>
                          </div>
                          <CheckCircle2
                            size={13}
                            className="ms-auto shrink-0"
                            style={{ color: "hsl(var(--mk-ok))" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating: active exam */}
              <div
                className="mk-hero-float mk-float-soft start-0 top-10 hidden w-52 rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-3.5 sm:block lg:-start-8"
                style={{ "--mk-float-dur": "6.5s", "--mk-float-delay": "0.4s" } as React.CSSProperties}
              >
                <div className="flex items-center gap-2">
                  <MockIconTile icon={<Timer size={15} />} tone="gold" size={28} />
                  <div className="min-w-0">
                    <div className="truncate text-[0.68rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                      امتحان الرياضيات
                    </div>
                    <div className="text-[0.6rem] text-[hsl(var(--mk-muted))]">السؤال 4 من 10</div>
                  </div>
                </div>
                <div className="mt-3">
                  <MockBar value={40} tone="gold" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[0.6rem] font-bold text-[hsl(var(--mk-muted))]">
                  <span>متبقي 18:24</span>
                  <span style={{ color: "hsl(var(--mk-primary-deep))" }}>مواصلة ←</span>
                </div>
              </div>

              {/* Floating: certificate */}
              <div
                className="mk-hero-float mk-float-soft bottom-10 end-0 hidden w-48 rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-3.5 sm:block lg:-end-6"
                style={{ "--mk-float-dur": "7.2s", "--mk-float-delay": "1.1s" } as React.CSSProperties}
              >
                <div className="flex items-center gap-2">
                  <MockIconTile icon={<Award size={15} />} tone="coral" size={28} />
                  <div className="min-w-0">
                    <div className="text-[0.68rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                      شهادة إتمام
                    </div>
                    <div className="text-[0.6rem] text-[hsl(var(--mk-muted))]">أحمد محمد</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[hsl(var(--mk-gold-soft))] px-2.5 py-2">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full"
                    style={{ background: "hsl(var(--mk-gold))" }}
                  >
                    <Award size={13} style={{ color: "hsl(30 60% 10%)" }} />
                  </span>
                  <span className="text-[0.6rem] font-bold" style={{ color: "hsl(var(--mk-gold-deep))" }}>
                    بإصدار بعلامتك
                  </span>
                </div>
              </div>

              {/* Floating: community reply */}
              <div
                className="mk-hero-float mk-float-soft -bottom-6 start-8 hidden w-56 rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-3.5 shadow-[hsl(var(--mk-ink)/0.18)] md:block"
                style={{ "--mk-float-dur": "5.8s", "--mk-float-delay": "1.8s" } as React.CSSProperties}
              >
                <div className="flex items-start gap-2.5">
                  <MockAvatar initials="س" tone="blue" size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="rounded-xl rounded-ts-sm bg-[hsl(var(--mk-bg-band))] px-3 py-2">
                      <div className="text-[0.62rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                        سارة
                      </div>
                      <div className="mt-0.5 text-[0.62rem] leading-4 text-[hsl(var(--mk-ink-soft))]">
                        فين ألاقي مذكرة المعادلات؟ 📚
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[0.58rem] font-bold text-[hsl(var(--mk-muted))]">
                      <span className="rounded-full border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-1.5 py-0.5">
                        👍 3
                      </span>
                      <span className="rounded-full border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-1.5 py-0.5">
                        ❤️ 1
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Capability strip ── */}
        <div
          className="mk-hero-enter relative mt-16 border-t border-[hsl(var(--mk-line))] pt-6 lg:mt-20"
          style={{ "--mk-d": "0.7s" } as React.CSSProperties}
        >
          <div className="mk-marquee flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            {MARQUEE.map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[hsl(var(--mk-muted))]">
                  {item}
                </span>
                {i < MARQUEE.length - 1 && (
                  <span className="h-1 w-1 rounded-full" style={{ background: "hsl(var(--mk-gold))" }} />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
