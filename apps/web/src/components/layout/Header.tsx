"use client";

import { useTranslations } from "next-intl";
import { Bell, LogOut, Moon, PanelRight, Sun, User } from "lucide-react";
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
} from "@/components/ui";
import { useCurrentUser } from "@/hooks";
import { useLogout } from "@/hooks";
import { useUiStore } from "@/stores/ui.store";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { initialsOf } from "@/lib/format";

/**
 * Top dashboard header. Holds the sidebar toggle, breadcrumb area,
 * notification bell (architecture-only), theme toggle, and user menu.
 */
function Header() {
  const t = useTranslations();
  const { user } = useCurrentUser();
  const logout = useLogout();
  const { tenant } = useActiveTenant();

  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        {/* Desktop collapse toggle */}
        <AppButton
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={toggleSidebar}
          aria-label="طي القائمة"
        >
          <PanelRight className="h-5 w-5" />
        </AppButton>

        {/* Breadcrumb area */}
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          {tenant ? (
            <span className="truncate font-medium text-foreground">
              {tenant.name}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Notification bell — architecture only, no dropdown content yet */}
        <AppButton
          variant="ghost"
          size="icon"
          aria-label={t("nav.notifications")}
        >
          <Bell className="h-5 w-5" />
        </AppButton>

        {/* Theme toggle */}
        <AppButton
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={t("theme.toggle")}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </AppButton>

        {/* User dropdown */}
        <AppDropdownMenu>
          <AppDropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1 outline-none transition-colors hover:bg-accent">
              <AppAvatar className="h-8 w-8">
                <AppAvatarFallback>
                  {initialsOf(user?.name)}
                </AppAvatarFallback>
              </AppAvatar>
            </button>
          </AppDropdownMenuTrigger>
          <AppDropdownMenuContent align="start" className="w-56">
            <AppDropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {user?.email}
              </span>
            </AppDropdownMenuLabel>
            <AppDropdownMenuSeparator />
            <AppDropdownMenuItem
              onClick={() => {
                /* profile page is a future module */
              }}
            >
              <User className="h-4 w-4" />
              {t("user.profile")}
            </AppDropdownMenuItem>
            <AppDropdownMenuSeparator />
            <AppDropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                void logout.mutateAsync();
              }}
            >
              <LogOut className="h-4 w-4" />
              {t("auth.logout")}
            </AppDropdownMenuItem>
          </AppDropdownMenuContent>
        </AppDropdownMenu>

        {/* Mobile sidebar open */}
        <AppButton
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="فتح القائمة"
        >
          <PanelRight className="h-5 w-5" />
        </AppButton>
      </div>
    </header>
  );
}

export { Header };
