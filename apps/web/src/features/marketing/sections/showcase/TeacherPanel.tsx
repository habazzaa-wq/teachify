import {
  Bell,
  BookOpen,
  Users,
  ClipboardCheck,
  Wallet,
  MessagesSquare,
  BarChart3,
  Settings,
  Search,
  GraduationCap,
} from "lucide-react";
import { WindowFrame } from "@/features/marketing/components/ui";
import { MockAvatar, MockAvatarRow, MockBar } from "@/features/marketing/components/mock/Mock";
import { BarsChart } from "@/features/marketing/components/mock/charts";

const SIDEBAR = [
  { icon: GraduationCap, label: "لوحة التحكم", active: true },
  { icon: BookOpen, label: "كورساتي" },
  { icon: Users, label: "طلابي" },
  { icon: ClipboardCheck, label: "الامتحانات" },
  { icon: Wallet, label: "المدفوعات" },
  { icon: MessagesSquare, label: "المجتمع" },
  { icon: BarChart3, label: "التحليلات" },
  { icon: Settings, label: "الإعدادات" },
];

const COURSES = [
  { name: "التفاضل والتكامل", students: "1,240", progress: 82, status: "منشور", tone: "coral" as const },
  { name: "الجبر والهندسة", students: "890", progress: 64, status: "مسودة", tone: "blue" as const },
  { name: "مراجعة ليلة الامتحان", students: "2,310", progress: 95, status: "منشور", tone: "green" as const },
];

export function TeacherPanel() {
  return (
    <WindowFrame
      url={
        <>
          <span className="mk-url-brand">أكاديميتك</span>.com/teacher/dashboard
        </>
      }
    >
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-44 shrink-0 flex-col border-e border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg-band))] p-3 sm:flex">
          <div className="mb-3 flex items-center gap-2 px-1.5">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg"
              style={{ background: "hsl(var(--mk-primary))" }}
            >
              <GraduationCap size={14} className="text-white" />
            </span>
            <span className="text-[0.72rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
              أكاديميتك
            </span>
          </div>
          {SIDEBAR.map((item) => (
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
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                لوحة التحكم
              </div>
              <div className="text-xs text-[hsl(var(--mk-muted))]">نظرة عامة على أكاديميتك اليوم</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] text-[hsl(var(--mk-muted))]">
                <Search size={13} />
              </span>
              <span className="relative grid h-8 w-8 place-items-center rounded-lg border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] text-[hsl(var(--mk-muted))]">
                <Bell size={13} />
                <span className="absolute -end-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--mk-surface))] bg-[hsl(var(--mk-primary))]" />
              </span>
              <MockAvatar initials="م" tone="coral" size={30} />
            </div>
          </div>

          {/* Metric cards */}
          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { v: "4,250 ر.س", l: "إيرادات هذا الشهر", c: "hsl(var(--mk-primary-deep))" },
              { v: "1,248", l: "طالب نشط", c: "hsl(var(--mk-ink))" },
              { v: "92%", l: "معدل الإتمام", c: "hsl(var(--mk-ok))" },
              { v: "6", l: "امتحانات بانتظار المراجعة", c: "hsl(var(--mk-gold-deep))" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-3.5"
              >
                <div className="text-lg font-extrabold leading-none" style={{ color: s.c }}>
                  {s.v}
                </div>
                <div className="mt-2 text-[0.68rem] font-medium text-[hsl(var(--mk-muted))]">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {/* Chart */}
            <div className="rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[0.78rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                  تسجيل الطلاب
                </span>
                <span className="mk-pill mk-pill-ok">+18% هذا الشهر</span>
              </div>
              <BarsChart data={[5, 8, 6, 11, 9, 14, 12, 17]} height={110} tone="gold" delay={200} />
              <div className="mt-1 flex justify-between text-[0.6rem] font-bold text-[hsl(var(--mk-muted))]">
                {["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>

            {/* Courses */}
            <div className="rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[0.78rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                  كورساتي
                </span>
                <span className="text-[0.68rem] font-bold text-[hsl(var(--mk-primary-deep))]">
                  عرض الكل
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {COURSES.map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[0.72rem] font-bold" style={{ color: "hsl(var(--mk-ink))" }}>
                        {c.name}
                      </span>
                      <span
                        className="shrink-0 text-[0.6rem] font-bold"
                        style={{
                          color: c.status === "منشور" ? "hsl(var(--mk-ok))" : "hsl(var(--mk-muted))",
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <MockBar value={c.progress} tone={c.tone === "coral" ? "coral" : c.tone === "blue" ? "blue" : "ok"} className="flex-1" />
                      <span className="text-[0.6rem] font-bold text-[hsl(var(--mk-muted))]">{c.students} طالب</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="mt-4 rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] p-4">
            <div className="text-[0.78rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
              أحدث الأنشطة
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MockAvatarRow
                  items={[
                    { initials: "س", tone: "coral" },
                    { initials: "ي", tone: "blue" },
                    { initials: "م", tone: "green" },
                    { initials: "ن", tone: "gold" },
                  ]}
                  size={26}
                />
                <div>
                  <div className="text-[0.72rem] font-bold" style={{ color: "hsl(var(--mk-ink))" }}>
                    4 طلاب جدد اليوم
                  </div>
                  <div className="text-[0.62rem] text-[hsl(var(--mk-muted))]">
                    انضموا إلى كورس التفاضل والتكامل
                  </div>
                </div>
              </div>
              <span className="mk-pill mk-pill-coral">أضف طالبًا</span>
            </div>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
