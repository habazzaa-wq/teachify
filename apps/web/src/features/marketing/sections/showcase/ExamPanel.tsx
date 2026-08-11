import { Timer, Flag, ChevronLeft, X } from "lucide-react";
import { WindowFrame } from "@/features/marketing/components/ui";
import { MockAvatar } from "@/features/marketing/components/mock/Mock";

const OPTIONS = [
  { text: "6x", correct: false },
  { text: "6x²", correct: true, chosen: true },
  { text: "3x²", correct: false },
  { text: "9x", correct: false },
];

const PALETTE: ("answered" | "flagged" | "current" | "idle")[] = [
  "answered", "answered", "answered", "flagged", "answered", "answered",
  "current", "idle", "idle", "answered", "idle", "idle",
  "answered", "flagged", "idle", "answered", "idle", "answered",
  "idle", "idle", "answered", "idle", "answered", "idle", "idle",
];

export function ExamPanel() {
  return (
    <WindowFrame url="أكاديميتك.com/exam/endterm-3">
      <div className="flex flex-col lg:flex-row">
        {/* Question area */}
        <div className="flex-1 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                اختبار منتصف الفصل
              </span>
              <span className="mk-pill">السؤال 7 من 25</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.7rem] font-extrabold" style={{ background: "hsl(var(--mk-red-soft))", color: "hsl(var(--mk-red))" }}>
              <Timer size={13} /> 42:15
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-5">
            <div className="text-[0.95rem] font-extrabold leading-7" style={{ color: "hsl(var(--mk-ink))" }}>
              ما مشتقة الدالة{" "}
              <span className="rounded bg-[hsl(var(--mk-bg-band))] px-2 py-0.5 text-[hsl(var(--mk-primary-deep))]">f(x) = 3x²</span>
              {" "}؟
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {OPTIONS.map((o) => (
                <div
                  key={o.text}
                  className="flex items-center justify-between rounded-lg border px-3.5 py-3 text-[0.78rem] font-bold"
                  style={
                    o.chosen
                      ? { background: "hsl(var(--mk-primary-soft))", borderColor: "hsl(var(--mk-primary))", color: "hsl(var(--mk-primary-deep))" }
                      : { background: "hsl(var(--mk-bg-band))", borderColor: "hsl(var(--mk-line))", color: "hsl(var(--mk-ink))" }
                  }
                >
                  <span className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-current text-[0.58rem]">
                      {o.correct ? "ب" : "أ"}
                    </span>
                    {o.text}
                  </span>
                  {o.chosen && <span className="text-[0.6rem] font-extrabold text-[hsl(var(--mk-primary))]">إجابتك</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--mk-line))] px-3 py-2 text-[0.68rem] font-bold text-[hsl(var(--mk-muted))]">
              <Flag size={12} /> وضع علامة للمراجعة
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-lg px-3 py-2 text-[0.68rem] font-bold text-[hsl(var(--mk-muted))]">
                <ChevronLeft size={13} /> السابق
              </span>
              <span className="rounded-lg px-5 py-2 text-[0.72rem] font-extrabold text-white" style={{ background: "hsl(var(--mk-primary))" }}>
                التالي
              </span>
            </div>
          </div>
        </div>

        {/* Palette sidebar */}
        <div className="border-t border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] p-5 lg:w-56 lg:border-s lg:border-t-0">
          <div className="flex items-center justify-between">
            <span className="text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
              خريطة الأسئلة
            </span>
            <span className="text-[0.62rem] font-bold text-[hsl(var(--mk-muted))]">أجبت 6 من 25</span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-4">
            {PALETTE.map((state, i) => {
              const style =
                state === "current"
                  ? { background: "hsl(var(--mk-primary))", color: "#fff" }
                  : state === "answered"
                    ? { background: "hsl(var(--mk-primary-soft))", color: "hsl(var(--mk-primary-deep))" }
                    : state === "flagged"
                      ? { background: "hsl(var(--mk-gold-soft))", color: "hsl(var(--mk-gold-deep))" }
                      : { background: "hsl(var(--mk-surface))", color: "hsl(var(--mk-muted))", border: "1px solid hsl(var(--mk-line))" };
              return (
                <span
                  key={i}
                  className="grid aspect-square place-items-center rounded-lg text-[0.62rem] font-extrabold"
                  style={style}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
          <div className="mt-5 space-y-1.5 text-[0.62rem] font-bold text-[hsl(var(--mk-muted))]">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-[hsl(var(--mk-primary-soft))]" /> تمت الإجابة</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-[hsl(var(--mk-gold-soft))]" /> للمراجعة</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))]" /> لم تُجب بعد</span>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "hsl(var(--mk-red-soft))" }}>
            <span className="text-[0.66rem] font-extrabold" style={{ color: "hsl(var(--mk-red))" }}>إنهاء وتسليم</span>
            <X size={13} className="text-[hsl(var(--mk-red))]" />
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-[hsl(var(--mk-line))] pt-3">
            <MockAvatar initials="م" tone="coral" size={24} />
            <span className="text-[0.62rem] font-bold text-[hsl(var(--mk-muted))]">محمد · مقيم سريع</span>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
