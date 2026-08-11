import { Hash, Star, Send, MessageSquare, ThumbsUp, Medal } from "lucide-react";
import { WindowFrame } from "@/features/marketing/components/ui";
import { MockAvatar, MockAvatarRow } from "@/features/marketing/components/mock/Mock";

const CHANNELS = [
  { icon: Hash, label: "الطلاب", active: true },
  { icon: Hash, label: "سؤال وجواب" },
  { icon: Hash, label: "الإعلانات" },
  { icon: Hash, label: "التحديات" },
];

const LEADERBOARD = [
  { initials: "ن", tone: "coral" as const, name: "نورة", pts: "2,340" },
  { initials: "أ", tone: "green" as const, name: "أحمد", pts: "2,180" },
  { initials: "س", tone: "violet" as const, name: "سارة", pts: "1,970" },
];

export function CommunityPanel() {
  return (
    <WindowFrame url="أكاديميتك.com/community/students">
      <div className="grid lg:grid-cols-4">
        {/* Channels */}
        <div className="border-b border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] p-4 lg:border-b-0 lg:border-e lg:col-span-1">
          <div className="text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
            مجتمع أكاديميتك
          </div>
          <div className="mt-3 space-y-1">
            {CHANNELS.map((c) => (
              <span
                key={c.label}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.7rem] font-bold"
                style={c.active ? { background: "hsl(var(--mk-primary-soft))", color: "hsl(var(--mk-primary-deep))" } : { color: "hsl(var(--mk-muted))" }}
              >
                <c.icon size={13} aria-hidden="true" /> {c.label}
              </span>
            ))}
          </div>
          <div className="mt-5 border-t border-[hsl(var(--mk-line))] pt-4">
            <div className="flex items-center gap-1.5 text-[0.66rem] font-extrabold" style={{ color: "hsl(var(--mk-gold-deep))" }}>
              <Medal size={13} /> صدارة التفاعل
            </div>
            <div className="mt-3 space-y-2.5">
              {LEADERBOARD.map((u, i) => (
                <div key={u.name} className="flex items-center gap-2">
                  <span className="text-[0.58rem] font-black text-[hsl(var(--mk-muted))]">{i + 1}</span>
                  <MockAvatar initials={u.initials} tone={u.tone} size={24} />
                  <span className="flex-1 truncate text-[0.66rem] font-bold" style={{ color: "hsl(var(--mk-ink))" }}>{u.name}</span>
                  <span className="text-[0.62rem] font-black" style={{ color: "hsl(var(--mk-primary-deep))" }}>{u.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Thread list + chat */}
        <div className="grid lg:col-span-3 lg:grid-cols-5">
          {/* Threads */}
          <div className="border-b border-[hsl(var(--mk-line))] p-4 lg:col-span-2 lg:border-b-0 lg:border-e">
            <div className="text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
              الأسئلة النشطة
            </div>
            <div className="mt-3 space-y-2">
              {[
                { q: "حدّوا التكامل من 0 إلى 3؟", who: "سارة", tone: "violet" as const, rep: 8, solved: false },
                { q: "مشتقة الدوال المثلثية…", who: "فيصل", tone: "green" as const, rep: 3, solved: true },
                { q: "الفرق بين الجذر والفاصل؟", who: "لمى", tone: "coral" as const, rep: 5, solved: false },
              ].map((t) => (
                <div key={t.q} className="rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-3">
                  <div className="flex items-start gap-2.5">
                    <MockAvatar initials={t.who.charAt(0)} tone={t.tone} size={24} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.7rem] font-bold" style={{ color: "hsl(var(--mk-ink))" }}>{t.q}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[0.6rem] font-bold text-[hsl(var(--mk-muted))]">
                        <span>{t.who}</span>·<span className="flex items-center gap-1"><MessageSquare size={10} /> {t.rep}</span>
                      </div>
                    </div>
                    {t.solved && <span className="mk-pill mk-pill-ok">تم الحل</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active chat */}
          <div className="flex flex-col p-4 lg:col-span-3">
            <div className="flex items-center gap-2 border-b border-[hsl(var(--mk-line))] pb-3">
              <MockAvatarRow
                items={[
                  { initials: "ن", tone: "coral" },
                  { initials: "أ", tone: "green" },
                  { initials: "س", tone: "violet" },
                ]}
                size={26}
              />
              <div>
                <div className="text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                  سؤال وجواب — الوحدة الثالثة
                </div>
                <div className="text-[0.6rem] font-bold" style={{ color: "hsl(var(--mk-ok))" }}>48 متصلًا الآن</div>
              </div>
              <Star size={14} className="ms-auto text-[hsl(var(--mk-gold))]" />
            </div>

            <div className="flex-1 space-y-3 py-4">
              <div className="flex items-end gap-2">
                <MockAvatar initials="ن" tone="coral" size={26} />
                <div className="max-w-[75%] rounded-2xl rounded-es-md border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-3.5 py-2.5 text-[0.7rem] leading-5" style={{ color: "hsl(var(--mk-ink))" }}>
                  في المسألة 12 ليه استخدمنا قاعدة السلسلة؟
                  <div className="mt-1 text-[0.58rem] font-bold text-[hsl(var(--mk-muted))]">نورة · منذ 4 دقائق</div>
                </div>
              </div>
              <div className="flex flex-row-reverse items-end gap-2">
                <MockAvatar initials="د" tone="green" size={26} />
                <div className="max-w-[75%] rounded-2xl rounded-se-md px-3.5 py-2.5 text-[0.7rem] leading-5 text-white" style={{ background: "hsl(var(--mk-primary))" }}>
                  لأن جذر الدالة مركب، فالمشتقة تمر عبر كل طبقة.
                  <div className="mt-1 text-[0.58rem] font-bold text-white/70">د.خالد · الآن</div>
                </div>
              </div>
              <div className="mr-7 flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.62rem] font-bold" style={{ background: "hsl(var(--mk-gold-soft))", color: "hsl(var(--mk-gold-deep))" }}>
                  <ThumbsUp size={11} /> 14 إعجابًا
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-[hsl(var(--mk-line))] pt-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-[hsl(var(--mk-line))] text-[hsl(var(--mk-muted))]">
                +
              </span>
              <span className="flex-1 rounded-lg border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] px-3 py-2 text-[0.68rem] font-bold text-[hsl(var(--mk-muted))]">
                اكتب سؤالك أو إجابتك…
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--mk-primary))] text-white">
                <Send size={13} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
