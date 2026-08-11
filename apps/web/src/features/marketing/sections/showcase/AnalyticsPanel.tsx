import { TrendingUp, Download, Share2 } from "lucide-react";
import { WindowFrame } from "@/features/marketing/components/ui";
import { MockAvatar, MockAvatarRow } from "@/features/marketing/components/mock/Mock";
import { AreaChart, Donut } from "@/features/marketing/components/mock/charts";

const TOP_COURSES = [
  { name: "التفاضل والتكامل", v: "1,240", g: "+12%" },
  { name: "قواعد اللغة الإنجليزية", v: "980", g: "+9%" },
  { name: "البرمجة للأطفال", v: "760", g: "+21%" },
  { name: "تحفيظ القرآن الكريم", v: "640", g: "+4%" },
];

export function AnalyticsPanel() {
  return (
    <WindowFrame url="أكاديميتك.com/teacher/analytics">
      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
        {/* Area chart */}
        <div className="rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[0.8rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                نمو الإيرادات الشهري
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-black" style={{ color: "hsl(var(--mk-ink))" }}>12,480 ر.س</span>
                <span className="mk-pill mk-pill-ok">+18%</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              {["شهري", "سنوي"].map((p) => (
                <span key={p} className="rounded-lg px-2.5 py-1 text-[0.6rem] font-bold" style={p === "شهري" ? { background: "hsl(var(--mk-ink))", color: "hsl(var(--mk-surface))" } : { color: "hsl(var(--mk-muted))" }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <AreaChart data={[2, 4, 3, 6, 5, 8, 7, 11, 9, 13, 12, 16]} height={130} tone="coral" id="analytics-area" delay={200} />
          <div className="mt-1 flex justify-between text-[0.58rem] font-bold text-[hsl(var(--mk-muted))]">
            {["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* Donut */}
        <div className="rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4">
          <div className="text-[0.78rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
            مصادر الطلاب
          </div>
          <div className="mt-3 flex items-center justify-center">
            <Donut
              segments={[
                { value: 58, tone: "coral" },
                { value: 24, tone: "gold" },
                { value: 18, tone: "blue" },
              ]}
              size={130}
              stroke={12}
              label="58%"
              sub="وسائل التواصل"
              delay={300}
            />
          </div>
          <div className="mt-3 space-y-1.5 text-[0.64rem] font-bold text-[hsl(var(--mk-muted))]">
            <span className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--mk-primary))]" /> وسائل التواصل</span> 58%</span>
            <span className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--mk-gold))]" /> النشر المباشر</span> 24%</span>
            <span className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--mk-blue))]" /> الكلمة الشفهية</span> 18%</span>
          </div>
        </div>

        {/* Top courses */}
        <div className="rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4 lg:col-span-2">
          <div className="text-[0.78rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
            الكورسات الأكثر مبيعًا
          </div>
          <div className="mt-3 space-y-2">
            {TOP_COURSES.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[hsl(var(--mk-bg-band))]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[0.62rem] font-black" style={{ background: i === 0 ? "hsl(var(--mk-gold-soft))" : "hsl(var(--mk-bg-band))", color: i === 0 ? "hsl(var(--mk-gold-deep))" : "hsl(var(--mk-muted))" }}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.72rem] font-bold" style={{ color: "hsl(var(--mk-ink))" }}>{c.name}</div>
                  <div className="text-[0.6rem] font-bold text-[hsl(var(--mk-muted))]">{c.v} طالب</div>
                </div>
                <span className="mk-pill mk-pill-ok">{c.g}</span>
                <Download size={13} className="text-[hsl(var(--mk-muted))]" />
              </div>
            ))}
          </div>
        </div>

        {/* Team card */}
        <div className="flex flex-col justify-between rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] p-4">
          <div>
            <div className="flex items-center gap-2 text-[0.78rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
              <TrendingUp size={14} className="text-[hsl(var(--mk-ok))]" />
              أسبوع قوي
            </div>
            <div className="mt-2 text-[0.66rem] leading-5 text-[hsl(var(--mk-muted))]">
              أضاف 42 طالبًا و4 تقييمات إيجابية جديدة هذا الأسبوع.
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <MockAvatarRow
              items={[
                { initials: "س", tone: "green" },
                { initials: "ل", tone: "violet" },
                { initials: "أ", tone: "coral" },
              ]}
              size={24}
            />
            <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.62rem] font-bold text-white" style={{ background: "hsl(var(--mk-ink))" }}>
              <Share2 size={11} /> التقرير الكامل
            </span>
          </div>
        </div>

        {/* Students row */}
        <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4 lg:col-span-3">
          <div className="flex items-center gap-3">
            <MockAvatar initials="س" tone="green" size={30} />
            <div>
              <div className="text-[0.72rem] font-bold" style={{ color: "hsl(var(--mk-ink))" }}>
                سارة الأحمد — أكملت اختبار التفاضل
              </div>
              <div className="text-[0.62rem] text-[hsl(var(--mk-muted))]">منذ 12 دقيقة · نتيجة: 96%</div>
            </div>
          </div>
          <span className="mk-pill mk-pill-ok">ممتاز</span>
        </div>
      </div>
    </WindowFrame>
  );
}
