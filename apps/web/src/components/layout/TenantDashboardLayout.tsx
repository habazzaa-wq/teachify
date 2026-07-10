"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useUiStore } from "@/stores/ui.store";
import { useDashboardThemeStore } from "@/stores/dashboard-theme.store";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { generateThemeColors } from "@/lib/color";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceLeftSidebar } from "./WorkspaceLeftSidebar";
import { WorkspaceRightInspector } from "./WorkspaceRightInspector";
import { WorkspaceStatusBar } from "./WorkspaceStatusBar";
import { WorkspaceGlobalSearch } from "./WorkspaceGlobalSearch";

interface TenantDashboardLayoutProps {
  children: React.ReactNode;
}

function TenantDashboardLayout({ children }: TenantDashboardLayoutProps) {
  const mobileMenuOpen = useWorkspaceStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useWorkspaceStore((s) => s.setMobileMenuOpen);

  const { primaryColor, secondaryColor, isActive, setColors } = useDashboardThemeStore();
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const rootRef = useRef<HTMLDivElement>(null);

  // Auto-apply the tenant's control-panel primary/secondary colors the first
  // time they're available, unless the user already customized them.
  useEffect(() => {
    const branding = tenant?.branding;
    const primary = branding?.primary_color;
    const secondary = branding?.secondary_color;
    if (primary && secondary && !isActive) {
      setColors(primary, secondary);
    }
  }, [tenant, isActive, setColors]);

  // Inject the tenant-themed palette (primary = navbar/accent, secondary =
  // sidebar/content) across the whole control panel, with dark-mode support.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const styleId = "dash-custom-theme";
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!isActive) {
      if (styleTag) styleTag.remove();
      return;
    }
    const colors = generateThemeColors(primaryColor, secondaryColor, theme === "dark");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    const vars = Object.entries(colors)
      .map(([k, v]) => `${k}: ${v};`)
      .join("");
    styleTag.textContent = `.tenant-theme { ${vars} }`;
  }, [primaryColor, secondaryColor, isActive, theme]);

  const handleCloseMobile = useCallback(() => {
    setMobileMenuOpen(false);
  }, [setMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  return (
    <div ref={rootRef} className="tenant-theme flex h-screen flex-col bg-studio-bg text-studio-fg overflow-hidden">
      {/* Header */}
      <WorkspaceHeader />

      {/* Main area: sidebar | center | inspector */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop left sidebar */}
        <div className="hidden md:flex">
          <WorkspaceLeftSidebar />
        </div>

        {/* Center viewport */}
        <main
          className="tenant-aurora flex min-w-0 flex-1 flex-col overflow-hidden"
          role="main"
          aria-label="مساحة العمل الرئيسية"
        >
          <div className="flex-1 overflow-y-auto studio-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key="workspace-content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Right inspector */}
        <div className="hidden lg:flex">
          <WorkspaceRightInspector />
        </div>
      </div>

      {/* Status bar */}
      <WorkspaceStatusBar />

      {/* Global search overlay */}
      <WorkspaceGlobalSearch />

      {/* Mobile overlay: sidebar as drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-studio-overlay md:hidden"
              onClick={handleCloseMobile}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 w-[280px] md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="القائمة الجانبية"
            >
              <WorkspaceLeftSidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export { TenantDashboardLayout };
