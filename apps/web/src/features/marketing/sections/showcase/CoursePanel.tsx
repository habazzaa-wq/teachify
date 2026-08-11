import { Star, Users, PlayCircle, Check, Clock, ChevronLeft } from "lucide-react";
import { WindowFrame } from "@/features/marketing/components/ui";
import { MockAvatarRow } from "@/features/marketing/components/mock/Mock";

const LESSONS = [
  { title: "مقدمة إلى التفاضل", dur: "12 دقيقة", done: true },
  { title: "قواعد الاشتقاق الأساسية", dur: "22 دقيقة", done: true },
  { title: "مشتقة الدوال المركبة", dur: "25 دقيقة", active: true },
  { title: "الاشتقاق الضمني", dur: "18 دقيقة", done: false },
  { title: "تطبيقات على المعدلات الزمنية", dur: "30 دقيقة", done: false },
];

export function CoursePanel() {
  return (
    <WindowFrame url="أكاديميتك.com/courses/algebra">
      <div className="grid lg:grid-cols-5">
        {/* Course cover + content */}
        <div className="lg:col-span-3">
          <div className="relative h-32 overflow-hidden sm:h-40">
            <div className="absolute inset-0 bg-[hsl(var(--mk-gold))]" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_180%_at_80%_20%,transparent_0%,hsl(var(--mk-primary))_45%,transparent_100%)] opacity-70" />
            <div className="absolute inset-0 flex items-end justify-between p-4">
              <div>
                <div className="text-[0.62rem] font-bold text-white/80">الرياضيات</div>
                <div className="text-base font-black text-white sm:text-xl">التفاضل والتكامل</div>
              </div>
              <span className="mk-pill bg-white/20 text-white backdrop-blur">+1,240 طالب</span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-[0.68rem] font-bold" style={{ color: "hsl(var(--mk-gold-deep))" }}>
                <Star size={12} fill="currentColor" /> 4.9
              </span>
              <span className="flex items-center gap-1 text-[0.68rem] text-[hsl(var(--mk-muted))]">
                <Users size={12} /> 1,240 طالب
              </span>
              <span className="flex items-center gap-1 text-[0.68rem] text-[hsl(var(--mk-muted))]">
                <Clock size={12} /> 34 درسًا · 12 ساعة
              </span>
              <span className="mk-pill mk-pill-ok">اللغة العربية</span>
            </div>
            <p className="mt-3 text-[0.74rem] leading-6 text-[hsl(var(--mk-muted))]">
              تعلم أساسيات التفاضل خطوة بخطوة مع تمارين تفاعلية واختبارات فورية. مناسب لطلاب
              المرحلة الثانوية والمقبلين على الجامعة.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-lg px-4 py-2 text-[0.75rem] font-extrabold text-white" style={{ background: "hsl(var(--mk-primary))" }}>
                اشترك الآن — 129 ر.س/شهر
              </span>
              <span className="text-[0.68rem] font-bold text-[hsl(var(--mk-muted))]">معاينة مجانية · إلغاء في أي وقت</span>
            </div>
            <div className="mt-5 rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] p-4">
              <div className="text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                ماذا ستتعلم
              </div>
              <div className="mt-3 grid gap-2 text-[0.68rem] font-medium text-[hsl(var(--mk-muted))] sm:grid-cols-2">
                {["قواعد الاشتقاق وتطبيقاتها", "رسم الدوال وتحليل سلوكها", "حل مسائل معدلات التغير", "الاستعداد الكامل للاختبارات"].map((f) => (
                  <span key={f} className="flex items-center gap-1.5">
                    <Check size={12} style={{ color: "hsl(var(--mk-ok))" }} /> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lessons sidebar */}
        <div className="border-t border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] p-4 lg:col-span-2 lg:border-s lg:border-t-0">
          <div className="text-[0.74rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
            محتوى الكورس
          </div>
          <div className="mt-3 space-y-2">
            {LESSONS.map((l) => (
              <div
                key={l.title}
                className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5"
                style={
                  l.active
                    ? { background: "hsl(var(--mk-primary-soft))", borderColor: "hsl(var(--mk-primary)/0.35)" }
                    : { background: "hsl(var(--mk-surface))", borderColor: "hsl(var(--mk-line))" }
                }
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
                  style={
                    l.done
                      ? { background: "hsl(var(--mk-ok))" }
                      : l.active
                        ? { background: "hsl(var(--mk-primary))" }
                        : { background: "hsl(var(--mk-bg-band))", border: "1px solid hsl(var(--mk-line))" }
                  }
                >
                  {l.done ? (
                    <Check size={12} className="text-white" />
                  ) : (
                    <span className="text-[0.58rem] font-bold" style={{ color: l.active ? "#fff" : "hsl(var(--mk-muted))" }}>
                      {l.title.length > 2 ? "3" : "—"}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.7rem] font-bold" style={{ color: "hsl(var(--mk-ink))" }}>
                  {l.title}
                </span>
                {l.active ? (
                  <span className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[0.6rem] font-extrabold text-[hsl(var(--mk-primary-deep))]">
                    <PlayCircle size={11} /> تشغيل
                  </span>
                ) : (
                  <span className="shrink-0 text-[0.6rem] font-bold text-[hsl(var(--mk-muted))]">{l.dur}</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-[hsl(var(--mk-line-strong))] p-3">
            <MockAvatarRow
              items={[
                { initials: "د", tone: "green" },
                { initials: "س", tone: "coral" },
                { initials: "ن", tone: "violet" },
              ]}
              size={24}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[0.68rem] font-bold" style={{ color: "hsl(var(--mk-ink))" }}>
                3 طلاب يدرسون هذا الكورس الآن
              </div>
              <div className="flex items-center gap-1 text-[0.6rem] font-bold" style={{ color: "hsl(var(--mk-primary-deep))" }}>
                انضم إليهم <ChevronLeft size={11} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
