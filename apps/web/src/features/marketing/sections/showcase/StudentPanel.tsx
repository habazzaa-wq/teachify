import { Home, BookOpen, Wallet, Award, MessagesSquare, PlayCircle, ChevronLeft } from "lucide-react";
import { WindowFrame } from "@/features/marketing/components/ui";
import { MockAvatarRow, MockBar } from "@/features/marketing/components/mock/Mock";

const DOCK = [
  { icon: Home, label: "الرئيسية", active: true },
  { icon: BookOpen, label: "كورساتي" },
  { icon: Wallet, label: "محفظتي" },
  { icon: Award, label: "شهاداتي" },
  { icon: MessagesSquare, label: "المجتمع" },
];

export function StudentPanel() {
  return (
    <WindowFrame url="أكاديميتك.com/student">
      <div className="flex">
        {/* Dock */}
        <div className="hidden w-44 shrink-0 flex-col border-e border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] p-3 sm:flex">
          <div className="mb-3 px-1.5 text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
            أهلًا يا محمد 👋
          </div>
          {DOCK.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.7rem] font-bold"
              style={
                item.active
                  ? { background: "hsl(var(--mk-primary-soft))", color: "hsl(var(--mk-primary-deep))" }
                  : { color: "hsl(var(--mk-muted))" }
              }
            >
              <item.icon size={13} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Continue course */}
            <div className="rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[0.8rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                    أكمل من حيث توقفت
                  </div>
                  <div className="mt-0.5 text-[0.68rem] text-[hsl(var(--mk-muted))]">
                    التفاضل والتكامل — الوحدة الثالثة
                  </div>
                </div>
                <span
                  className="grid h-9 w-9 place-items-center rounded-full"
                  style={{ background: "hsl(var(--mk-primary))" }}
                >
                  <PlayCircle size={16} className="text-white" />
                </span>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <MockBar value={72} tone="coral" className="flex-1" />
                <span className="text-[0.62rem] font-bold text-[hsl(var(--mk-muted))]">72%</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="mk-pill mk-pill-coral">استكمال</span>
                <span className="mk-pill">مدة الدرس 22 دقيقة</span>
                <span className="mk-pill">اختبار قصير بالوحدة</span>
              </div>
            </div>

            {/* Next exam card */}
            <div className="rounded-xl border border-[hsl(var(--mk-line))] p-4" style={{ background: "hsl(var(--mk-gold-soft))" }}>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--mk-gold))] text-white">
                  <Award size={15} />
                </span>
                <div className="text-[0.8rem] font-extrabold" style={{ color: "hsl(var(--mk-gold-deep))" }}>
                  امتحان غدًا
                </div>
              </div>
              <div className="mt-3 text-[0.7rem] font-bold leading-5" style={{ color: "hsl(var(--mk-ink))" }}>
                اختبار منتصف الفصل
              </div>
              <div className="mt-0.5 text-[0.65rem] text-[hsl(var(--mk-muted))]">60 دقيقة · 25 سؤالًا</div>
              <div className="mt-3 text-[0.62rem] font-bold text-[hsl(var(--mk-muted))]">يبدأ بعد 18 ساعة</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                <div className="h-full w-[70%] rounded-full bg-[hsl(var(--mk-gold))]" />
              </div>
            </div>

            {/* Progress ring cards */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4">
              <div className="grid h-12 w-12 place-items-center rounded-full border-[5px] border-[hsl(var(--mk-primary))]">
                <span className="text-[0.68rem] font-extrabold" style={{ color: "hsl(var(--mk-primary-deep))" }}>
                  82%
                </span>
              </div>
              <div>
                <div className="text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                  تقدم الفصل
                </div>
                <div className="text-[0.6rem] text-[hsl(var(--mk-muted))]">أنت من أعلى 10%</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4">
              <MockAvatarRow
                items={[
                  { initials: "ل", tone: "blue" },
                  { initials: "أ", tone: "green" },
                  { initials: "هـ", tone: "violet" },
                ]}
                size={28}
              />
              <div>
                <div className="text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                  ردود جديدة
                </div>
                <div className="text-[0.6rem] text-[hsl(var(--mk-muted))]">3 ردود في سؤالك</div>
              </div>
              <ChevronLeft size={14} className="text-[hsl(var(--mk-muted))]" />
            </div>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
