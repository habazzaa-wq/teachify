"use client";

import { useState, useCallback } from "react";
import { Moon, Sun, PanelRight, Command, User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { usePlatformAuth } from "@/providers/PlatformAuthProvider";
import { usePlatformLogout } from "@/hooks/usePlatformAuthMutations";
import { useUiStore } from "@/stores/ui.store";
import {
  AppAvatar,
  AppAvatarFallback,
  AppButton,
  AppDropdownMenu,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuLabel,
  AppDropdownMenuSeparator,
  AppDropdownMenuTrigger,
  AppBadge,
  AppNotificationMenu,
  AppCommandPalette,
} from "@/components/ui";
import { initialsOf } from "@/lib/format";

interface PlatformHeaderProps {
  title?: string;
}

function PlatformHeader({ title }: PlatformHeaderProps) {
  const { user } = usePlatformAuth();
  const logout = usePlatformLogout();
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);
  const [commandOpen, setCommandOpen] = useState(false);

  const handleToggleCommand = useCallback(() => {
    setCommandOpen((prev) => !prev);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
        {/* Right side: mobile toggle + breadcrumb area */}
        <div className="flex items-center gap-3">
          <AppButton
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="فتح القائمة"
          >
            <PanelRight className="h-5 w-5" />
          </AppButton>

          {title && (
            <div className="flex items-center gap-2">
              <div className="h-5 w-px bg-border md:hidden" />
              <h1 className="text-base font-bold tracking-tight md:text-lg">{title}</h1>
            </div>
          )}

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
            <span className="font-medium text-foreground/80">المنصة</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-muted-foreground">الإدارة</span>
          </nav>
        </div>

        {/* Left side: actions */}
        <div className="flex items-center gap-1">
          {/* Command palette shortcut */}
          <AppButton
            variant="ghost"
            size="sm"
            onClick={handleToggleCommand}
            className="hidden gap-2 text-muted-foreground hover:text-foreground md:flex"
          >
            <Command className="h-4 w-4" />
            <span className="text-xs">بحث سريع</span>
            <kbd className="rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
              ⌘K
            </kbd>
          </AppButton>

          {/* Notification bell */}
          <AppNotificationMenu
            notifications={[]}
            unreadCount={0}
            onMarkAllRead={() => {}}
            onViewAll={() => {}}
          />

          {/* Theme toggle */}
          <AppButton
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </AppButton>

          {/* Profile dropdown */}
          <AppDropdownMenu>
            <AppDropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 outline-none transition-colors hover:bg-accent">
                <AppAvatar className="h-8 w-8 ring-2 ring-border ring-offset-2 ring-offset-background">
                  <AppAvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initialsOf(user?.name)}
                  </AppAvatarFallback>
                </AppAvatar>
              </button>
            </AppDropdownMenuTrigger>
            <AppDropdownMenuContent align="start" className="w-64" sideOffset={8}>
              <AppDropdownMenuLabel className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                <AppBadge variant="default" className="mt-1 w-fit text-[10px]">
                  <ShieldCheck className="h-3 w-3" />
                  Super Admin
                </AppBadge>
              </AppDropdownMenuLabel>
              <AppDropdownMenuSeparator />
              <AppDropdownMenuItem onClick={() => {}}>
                <User className="h-4 w-4" />
                الملف الشخصي
              </AppDropdownMenuItem>
              <AppDropdownMenuItem onClick={() => {}}>
                <Settings className="h-4 w-4" />
                الإعدادات
              </AppDropdownMenuItem>
              <AppDropdownMenuSeparator />
              <AppDropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => logout.mutate()}
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </AppDropdownMenuItem>
            </AppDropdownMenuContent>
          </AppDropdownMenu>
        </div>
      </header>

      {/* Command Palette */}
      {commandOpen && <AppCommandPalette />}
    </>
  );
}

export { PlatformHeader };
