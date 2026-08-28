"use client";

import { useMemo, useState } from "react";
import { GraduationCap, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useAuth } from "@/providers/AuthProvider";
import { StudentProfileDrawer } from "@/features/student-profile/components/StudentProfileDrawer";
import { AppButton } from "@/components/ui/AppButton";
import { AppAvatar, AppAvatarFallback, AppAvatarImage } from "@/components/ui/AppAvatar";

export function StudentHeader() {
  const { tenant } = useActiveTenant();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const tenantName = tenant?.name ?? "أكاديميتي";

  const displayName = useMemo(() => user?.name ?? "طالب", [user?.name]);
  const avatar = user?.avatar ?? null;

  return (
    <header
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-xl md:px-6"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold text-foreground">{tenantName}</h1>
          <p className="text-[11px] text-muted-foreground">لوحة الطالب</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <AppButton
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </AppButton>

        <AppButton
          variant="ghost"
          className="gap-2 px-2"
          onClick={() => setProfileOpen(true)}
          aria-label="الملف الشخصي"
        >
          <AppAvatar className="h-8 w-8">
            {avatar ? <AppAvatarImage src={avatar} alt={displayName} /> : null}
            <AppAvatarFallback className="bg-primary/10 text-primary">
              <UserRound className="h-4 w-4" />
            </AppAvatarFallback>
          </AppAvatar>
          <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
        </AppButton>

        <AppButton
          variant="ghost"
          size="icon"
          onClick={() => void logout()}
          aria-label="تسجيل الخروج"
        >
          <LogOut className="h-4 w-4" />
        </AppButton>
      </div>

      <StudentProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}
