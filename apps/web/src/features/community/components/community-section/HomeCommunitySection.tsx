"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  MessagesSquare,
  Users,
  Zap,
} from "lucide-react";
import { routes } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import {
  STAT_KEYS,
  useCommunityStats,
} from "@/features/community/hooks/useStats";

const PublicLoginCard = dynamic(
  () =>
    import("@/features/auth/components/PublicLoginCard").then(
      (m) => m.PublicLoginCard,
    ),
  { ssr: false },
);

/* ───────────────────────────────────────
   Homepage brand palette — each color is
   used on its own, never mixed together.
   ─────────────────────────────────────── */
const PRIMARY = "var(--brand-primary)";
const SECONDARY = "var(--brand-secondary)";

const FEATURES = [
  { icon: Zap, label: "إجابات سريعة من الزملاء والمعلمين" },
  { icon: BookOpen, label: "مساعدة في الواجبات والمراجعة" },
  { icon: MessagesSquare, label: "نقاشات منظمة في قنوات متخصصة" },
  { icon: FileText, label: "ملفات وملخصات ومصادر دراسية" },
];

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-4 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.06]">
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{ background: accent }}
      />
      <div
        className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: accent }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}

/**
 * Homepage "منتدى الطلاب" section — premium entry card into the community.
 * Guests see an attractive preview and are routed to login; signed-in users
 * see live community statistics and jump straight to /community.
 */
export function HomeCommunitySection() {
  const status = useAuthStore((s) => s.status);
  const isAuthenticated = status === "authenticated";
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const [loginOpen, setLoginOpen] = useState(false);

  const { data: stats } = useCommunityStats();

  const statsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const stat of stats ?? []) {
      map[stat.key] = stat.value;
    }
    return map;
  }, [stats]);

  const latestMessage = useMemo(() => {
    const latest = stats?.find((s) => s.key === STAT_KEYS.LATEST_MESSAGE);
    return latest?.payload as
      | { body_text?: string; author?: { name?: string } }
      | null
      | undefined;
  }, [stats]);

  const members = isAuthenticated
    ? new Intl.NumberFormat("ar").format(statsMap[STAT_KEYS.ACTIVE_MEMBERS] ?? 0)
    : "آلاف";
  const online = isAuthenticated
    ? new Intl.NumberFormat("ar").format(statsMap[STAT_KEYS.ONLINE_MEMBERS] ?? 0)
    : "+١٠٠";
  const today = isAuthenticated
    ? new Intl.NumberFormat("ar").format(statsMap[STAT_KEYS.TODAY_MESSAGES] ?? 0)
    : "يوميًا";
  const threads = isAuthenticated
    ? new Intl.NumberFormat("ar").format(statsMap[STAT_KEYS.TOTAL_THREADS] ?? 0)
    : "+١٠٠٠";

  const activity = latestMessage?.body_text
    ? latestMessage.body_text
    : "انضم إلى الطلاب الآن وابدأ أول نقاش لك مع زملائك ومعلميك.";

  return (
    <section dir="rtl" className="relative w-full overflow-hidden py-12 sm:py-16 lg:py-20">
      {/* Section background — matches the rest of the homepage */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(170deg, #0e0c14 0%, #16121c 55%, #0e0c14 100%)"
            : "linear-gradient(170deg, #fdfbf7 0%, #f7f1e7 55%, #fdfbf7 100%)",
        }}
      />

      {/* Ambient single-color glows */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-[2rem] border shadow-2xl backdrop-blur-xl"
          style={{
            background: isDark
              ? "linear-gradient(150deg, rgba(23,21,29,0.96) 0%, rgba(28,24,34,0.94) 55%, rgba(22,20,30,0.96) 100%)"
              : "linear-gradient(150deg, rgba(255,255,255,0.96) 0%, rgba(255,250,242,0.92) 50%, rgba(255,244,228,0.9) 100%)",
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)",
            boxShadow: isDark
              ? "0 24px 80px rgba(0,0,0,0.45)"
              : "0 24px 80px rgba(0,0,0,0.18)",
          }}
        >
          <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
            {/* Content side */}
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-[var(--brand-secondary-contrast)] shadow-md"
                style={{
                  backgroundColor: SECONDARY,
                  boxShadow: `0 6px 18px rgba(0,0,0,0.251)`,
                }}
              >
                <GraduationCap className="h-4 w-4" />
                منتدى الطلاب
              </span>

              <h2
                className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]"
                style={{ textShadow: "0 2px 24px rgba(0,0,0,0.12)" }}
              >
                <span className="block mb-2" style={{ color: PRIMARY }}>مكان يجتمع فيه الطلاب</span>
                <span className="block" style={{ color: SECONDARY }}>للمناقشة وتبادل المعرفة</span>
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                اطرح أسئلتك، شارك حلولك، وساعد زملاءك في قنوات منظمة —
                أسئلة، واجبات، موارد دراسية، ونصائح للمذاكرة. كل ذلك في
                مجتمع واحد يجمع طلاب أكاديميتك.
              </p>

              {/* Latest activity preview */}
              <div
                className="mt-6 flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-sm"
                style={{
                  borderColor: "var(--brand-secondary)",
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.75)",
                }}
              >
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow"
                  style={{ backgroundColor: SECONDARY }}
                >
                  <MessagesSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    آخر نشاط في المنتدى
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {latestMessage?.author?.name ? (
                      <>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {latestMessage.author.name}
                        </span>{" "}
                        : {activity}
                      </>
                    ) : (
                      activity
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {isAuthenticated ? (
                  <Link
                    href={routes.community}
                    className="group inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
                    style={{
                      backgroundColor: PRIMARY,
                      boxShadow: `0 10px 30px rgba(0,0,0,0.333)`,
                    }}
                  >
                    <MessagesSquare className="h-5 w-5" />
                    ادخل المنتدى الآن
                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setLoginOpen(true)}
                      className="group inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
                      style={{
                        backgroundColor: PRIMARY,
                        boxShadow: `0 10px 30px rgba(0,0,0,0.333)`,
                      }}
                    >
                      <MessagesSquare className="h-5 w-5" />
                      انضم للمجتمع الآن
                      <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    </button>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      سجّل دخولك للانضمام إلى النقاشات
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stats side */}
            <div className="flex flex-col justify-center gap-4">
              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  label="أعضاء المجتمع"
                  value={members}
                  icon={Users}
                  accent={PRIMARY}
                />
                <StatTile
                  label="متصل الآن"
                  value={online}
                  icon={CheckCircle2}
                  accent={SECONDARY}
                />
                <StatTile
                  label="مناقشات اليوم"
                  value={today}
                  icon={MessagesSquare}
                  accent={PRIMARY}
                />
                <StatTile
                  label="موضوعات ونقاشات"
                  value={threads}
                  icon={GraduationCap}
                  accent={SECONDARY}
                />
              </div>

              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FEATURES.map((feature, i) => (
                  <li
                    key={feature.label}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    <feature.icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: i % 2 === 0 ? PRIMARY : SECONDARY }}
                    />
                    {feature.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade to blend into the next section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
        style={{
          background: isDark
            ? "linear-gradient(to top, #0e0c14, transparent)"
            : "linear-gradient(to top, #fdfbf7, transparent)",
        }}
      />

      <PublicLoginCard
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
      />
    </section>
  );
}
