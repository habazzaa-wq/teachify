import { Flame, Trophy, MessageCircleHeart } from "lucide-react";
import { SectionLabel } from "@/features/marketing/components/ui";
import { Reveal } from "@/features/marketing/components/Reveal";
import { CommunityPanel } from "@/features/marketing/sections/showcase/CommunityPanel";

const BENEFITS = [
  {
    icon: Flame,
    title: "قنوات ونقاشات حية",
    description: "مساحات منفصلة لكل مادة وسؤال وجواب، حيث يجد طلابك الإجابة بسرعة.",
  },
  {
    icon: Trophy,
    title: "تحفيز وتنافس",
    description: "نقاط تفاعل ولوحات ترتيب تشعل حماس الاستمرار بين طلابك.",
  },
  {
    icon: MessageCircleHeart,
    title: "علاقة أقوى مع طلابك",
    description: "تُبنى الثقة عندما يجد الطالب مجتمعًا يهتم به — فيبقى ويوصي بك.",
  },
];

export function CommunitySection() {
  return (
    <section id="community" className="relative scroll-mt-20 py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <div className="flex justify-center">
              <SectionLabel>المجتمع</SectionLabel>
            </div>
            <h2 className="mk-display mk-display-lg mt-5">
              مجتمعك الخاص…
              <br />
              <span style={{ color: "hsl(var(--mk-primary-deep))" }}>حيث يتعلّم طلابك معًا</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-base leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
              النقاش والتفاعل جزء أساسي من التعلم. داخل منصتك مجتمع كامل بقنوات، أسئلة،
              إعجابات، ومكافآت — تابعته وتحكمت فيه أنت.
            </p>
          </Reveal>
        </div>

        <Reveal delay={150} className="mt-12">
          <CommunityPanel />
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-4xl gap-3.5 sm:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={200 + i * 70}>
              <div className="h-full rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4 text-center">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--mk-gold-soft))] text-[hsl(var(--mk-gold-deep))]">
                  <b.icon size={16} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-[0.85rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                  {b.title}
                </h3>
                <p className="mt-1.5 text-[0.75rem] leading-5" style={{ color: "hsl(var(--mk-ink-soft))" }}>
                  {b.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
