"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Images,
  LayoutDashboard,
  LogOut,
  Users,
  Newspaper,
  Award,
  Video,
} from "lucide-react";
import { useInstructorAuth } from "./InstructorAuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { getTeacherAvatar } from "@/lib/teacher-avatar";

const navigation = [
  { href: "/instructor", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/instructor/courses", label: "الدورات", icon: BookOpen },
  { href: "/instructor/video-library", label: "مكتبة الفيديوهات", icon: Video },
  { href: "/instructor/media-library", label: "مكتبة الوسائط", icon: Images },
  { href: "/instructor/students", label: "الطلاب", icon: Users },
  { href: "/instructor/certificates", label: "الشهادات", icon: Award },
  { href: "/instructor/exams", label: "مكتبة الاختبارات", icon: GraduationCap },
  { href: "/instructor/grading", label: "تصحيح الإجابات", icon: ClipboardCheck },
];

export function InstructorWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useInstructorAuth();
  const { activeTenant } = useTenantContext();
  const blogEnabled = activeTenant?.feature_flags?.has_blog === true;

  if (pathname === "/instructor/login" || pathname === "/instructor/change-password") {
    return <>{children}</>;
  }

  return (
    <div className="tenant-theme flex min-h-dvh flex-col bg-studio-bg text-studio-fg md:h-dvh md:overflow-hidden">
      <header className="z-10 flex min-h-16 items-center justify-between border-b border-studio-border bg-studio-panel/95 px-4 backdrop-blur md:px-6">
        <Link href="/instructor" className="flex items-center gap-3 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block leading-tight">مساحة المدرّب</span>
            <span className="text-xs font-normal text-muted-foreground">إدارة التعليم والمحتوى</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/profile"
            className="hidden items-center gap-2 rounded-xl border border-studio-border px-3 py-2 text-sm transition hover:border-primary sm:flex"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getTeacherAvatar(user?.avatar, user?.gender)}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="max-w-40 truncate">{user?.name}</span>
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-xl border border-studio-border px-3 py-2 text-sm transition hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="border-b border-studio-border bg-studio-panel md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-l">
          <div className="flex gap-2 overflow-x-auto p-3 md:block md:space-y-1 md:p-4">
            <p className="hidden px-3 pb-2 pt-1 text-[11px] font-semibold tracking-wider text-muted-foreground md:block">
              مساحة العمل
            </p>
            {[...navigation, ...(blogEnabled ? [{ href: "/instructor/blog", label: "المدونة", icon: Newspaper }] : [])].map(({ href, label, icon: Icon }) => {
              const active = href === "/instructor"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition md:w-full ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-studio-hover hover:text-studio-fg"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
            <Link
              href="/instructor/profile"
              aria-current={pathname === "/instructor/profile" ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition md:w-full ${
                pathname === "/instructor/profile"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-studio-hover hover:text-studio-fg"
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>الملف الشخصي</span>
            </Link>
          </div>
          <div className="mx-4 mb-4 hidden rounded-2xl border border-studio-border bg-studio-bg p-4 md:block">
            <p className="text-xs font-semibold">مساحة آمنة ومستقلة</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              تعرض هذه اللوحة الدورات والطلاب والملفات المرتبطة بحسابك فقط.
            </p>
          </div>
        </aside>

        <main className="tenant-aurora min-h-0 flex-1 md:overflow-y-auto studio-scrollbar" role="main">
          <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:px-6 md:py-6 lg:px-8">{children}</div>
        </main>
      </div>
      <footer className="hidden h-8 items-center justify-between border-t border-studio-border bg-studio-panel px-5 text-[11px] text-muted-foreground md:flex">
        <span>مساحة المدرّب</span>
        <span>بياناتك معزولة عن حسابات المدرّبين الآخرين</span>
      </footer>
    </div>
  );
}
