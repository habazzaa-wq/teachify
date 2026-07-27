"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Command,
  Bell,
  Sun,
  Moon,
  Menu,
  GraduationCap,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioDropdown } from "@/components/studio/overlays/StudioDropdown";
import type { StudioDropdownItem } from "@/components/studio/overlays/StudioDropdown";
import { useUiStore } from "@/stores/ui.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useCurrentUser } from "@/hooks/useAuthStatus";
import { useAuth } from "@/providers/AuthProvider";
import { routes } from "@/constants/routes";
import { cn } from "@/lib/cn";

const headerMotion = {
  initial: { y: -16, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export function WorkspaceHeader() {
  const router = useRouter();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const setGlobalSearchOpen = useWorkspaceStore((s) => s.setGlobalSearchOpen);
  const setMobileMenuOpen = useWorkspaceStore((s) => s.setMobileMenuOpen);
  const { tenant } = useActiveTenant();
  const { user } = useCurrentUser();
  const { logout } = useAuth();

  const tenantName = tenant?.name ?? "مساحة العمل";

  const handleSearchClick = useCallback(() => {
    setGlobalSearchOpen(true);
  }, [setGlobalSearchOpen]);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(true);
  }, [setMobileMenuOpen]);

  const handleDropdownSelect = useCallback(
    (item: StudioDropdownItem) => {
      switch (item.value) {
        case "profile":
          router.push(routes.dashboardProfile);
          break;
        case "settings":
          router.push(routes.dashboardSettings);
          break;
        case "logout":
          void logout();
          break;
      }
    },
    [logout, router],
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <motion.header
      {...headerMotion}
      className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-studio-border bg-studio-glass-toolbar text-studio-glass-toolbar-fg px-4 backdrop-blur-xl md:px-6"
      role="banner"
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-studio-navbar-contrast text-studio-navbar">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="hidden text-sm font-semibold text-studio-glass-toolbar-fg md:block">
          {tenantName}
        </h1>
      </div>

      {/* Center: Search trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-auto">
        <button
          onClick={handleSearchClick}
          className="studio-glass-toolbar-soft-hover flex w-full items-center gap-3 rounded-xl border border-studio-glass-toolbar-border bg-studio-glass-toolbar-soft px-4 py-2 text-sm text-studio-glass-toolbar-fg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
          aria-label="فتح البحث العام"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-right">بحث في مساحة العمل...</span>
          <kbd className="hidden items-center gap-1 rounded-md border border-studio-glass-toolbar-border bg-studio-glass-toolbar-soft px-1.5 py-0.5 text-[10px] text-studio-glass-toolbar-fg-muted sm:inline-flex">
            <Command className="h-3 w-3" aria-hidden="true" />K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile search button */}
        <StudioButton
          variant="ghost"
          size="icon"
          onClick={handleSearchClick}
          className="md:hidden"
          aria-label="بحث"
        >
          <Search className="h-4 w-4" />
        </StudioButton>

        {/* Command palette button (desktop) */}
        <StudioButton
          variant="ghost"
          size="icon"
          onClick={handleSearchClick}
          className="hidden md:flex"
          aria-label="لوحة الأوامر"
        >
          <Command className="h-4 w-4" />
        </StudioButton>

        {/* Notifications */}
        <StudioButton
          variant="ghost"
          size="icon"
          aria-label="الإشعارات"
        >
          <Bell className="h-4 w-4" />
        </StudioButton>

        {/* Theme toggle */}
        <StudioButton
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </StudioButton>

        {/* User menu */}
        <StudioDropdown
          trigger={
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full bg-studio-navbar-contrast text-studio-navbar text-sm font-semibold transition-all overflow-hidden",
                "hover:ring-2 hover:ring-studio-ring/50 hover:ring-offset-2 hover:ring-offset-studio-glass-toolbar",
              )}
              aria-label="القائمة الشخصية"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden="true">
                  {user?.name ? getInitials(user.name) : "U"}
                </span>
              )}
            </div>
          }
          items={[
            {
              header: true,
              label: user?.name ?? "",
              description: user?.email ?? "",
              value: "user-header",
              icon: (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-studio-navbar-contrast text-studio-navbar text-sm font-bold shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{user?.name ? getInitials(user.name) : "U"}</span>
                  )}
                </div>
              ),
            },
            { separator: true },
            {
              label: "الملف الشخصي",
              value: "profile",
              icon: <User className="h-4 w-4" />,
            },
            {
              label: "الإعدادات",
              value: "settings",
              icon: <Settings className="h-4 w-4" />,
            },
            { separator: true },
            {
              label: "تسجيل الخروج",
              value: "logout",
              danger: true,
              icon: <LogOut className="h-4 w-4" />,
            },
          ]}
          onSelect={handleDropdownSelect}
          align="end"
          className="w-64"
        />

        {/* Mobile menu toggle */}
        <StudioButton
          variant="ghost"
          size="icon"
          onClick={handleMobileMenuToggle}
          className="md:hidden"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </StudioButton>
      </div>
    </motion.header>
  );
}
