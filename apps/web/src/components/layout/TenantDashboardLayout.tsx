"use client";

import { useCallback, useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspace.store";
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

  // لوحة تحكم المدرس بتستخدم ألوان المنصة العالمية (platformBranding) اللي
  // بتطبّقها BrandThemeProvider على .tenant-theme — فمفيش حاجة نحقنها هنا.

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
    <div className="tenant-theme studio-atlas flex min-h-dvh flex-col bg-studio-bg text-studio-fg md:h-dvh md:overflow-hidden">
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
          className="tenant-aurora flex min-w-0 flex-1 flex-col md:overflow-hidden"
          role="main"
          aria-label="مساحة العمل الرئيسية"
        >
          <div className="flex-1 md:overflow-y-auto studio-scrollbar">
            <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:px-6 md:py-6 lg:px-8">
              {children}
            </div>
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
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-studio-overlay md:hidden"
            onClick={handleCloseMobile}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 w-[min(300px,88vw)] max-w-full pb-[env(safe-area-inset-bottom)] md:hidden shadow-2xl transition-transform duration-300 ease-in-out"
            role="dialog"
            aria-modal="true"
            aria-label="القائمة الجانبية"
          >
            <WorkspaceLeftSidebar />
          </aside>
        </>
      )}
    </div>
  );
}

export { TenantDashboardLayout };
