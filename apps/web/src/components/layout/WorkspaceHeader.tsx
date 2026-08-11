"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Command,
  Bell,
  Sun,
  Moon,
  Menu,
  GraduationCap,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioDropdown } from "@/components/studio/overlays/StudioDropdown";
import { useUiStore } from "@/stores/ui.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useLogout } from "@/hooks/useAuthMutations";
import { useRouter } from "next/navigation";

const headerMotion = {
  initial: { y: -16, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export function WorkspaceHeader() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const setGlobalSearchOpen = useWorkspaceStore((s) => s.setGlobalSearchOpen);
  const setMobileMenuOpen = useWorkspaceStore((s) => s.setMobileMenuOpen);
  const { tenant } = useActiveTenant();
  const router = useRouter();
  const logout = useLogout();

  const tenantName = tenant?.name ?? "مساحة العمل";

  const handleSearchClick = useCallback(() => {
    setGlobalSearchOpen(true);
  }, [setGlobalSearchOpen]);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(true);
  }, [setMobileMenuOpen]);

  return (
    <motion.header
      {...headerMotion}
      className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-studio-border bg-studio-glass-toolbar text-studio-glass-toolbar-fg px-4 backdrop-blur-xl md:px-6"
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
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-studio-navbar-contrast text-studio-navbar text-sm font-semibold transition-all"
              aria-label="القائمة الشخصية"
            >
              <span aria-hidden="true">U</span>
            </button>
          }
          onSelect={(item) => {
            if (item.value === "profile") {
              router.push("/teacher/profile");
            } else if (item.value === "settings") {
              router.push("/teacher/settings");
            } else if (item.value === "logout") {
              logout.mutate();
            }
          }}
          items={[
            { value: "profile", label: "الملف الشخصي", icon: <Search className="h-4 w-4" /> },
            { value: "settings", label: "الإعدادات", icon: <Search className="h-4 w-4" /> },
            { separator: true },
            { value: "logout", label: "تسجيل الخروج", danger: true, icon: <Search className="h-4 w-4" /> },
          ]}
          align="end"
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
