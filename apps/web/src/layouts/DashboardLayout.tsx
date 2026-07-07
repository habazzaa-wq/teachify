"use client";

import { AppDialog, AppDialogContent, AppOfflineBanner } from "@/components/ui";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useUiStore } from "@/stores/ui.store";

/**
 * Dashboard shell. RTL-first: the sidebar is fixed to the right, content flows
 * to its left. On mobile the sidebar becomes a drawer (also anchored right).
 */
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore(
    (state) => state.setMobileSidebarOpen,
  );

  return (
    <div className="flex min-h-screen flex-row bg-muted/30">
      <AppOfflineBanner />

      {/* Desktop sidebar (right) */}
      <div className="hidden md:flex">
        <Sidebar variant="desktop" />
      </div>

      {/* Main column: header + content (to the left of the sidebar) */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      <AppDialog open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <AppDialogContent className="end-0 start-auto top-0 h-full max-w-[80vw] translate-x-0 translate-y-0 rounded-none rounded-s-lg sm:rounded-s-lg">
          <Sidebar
            variant="mobile"
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </AppDialogContent>
      </AppDialog>
    </div>
  );
}

export { DashboardLayout };
