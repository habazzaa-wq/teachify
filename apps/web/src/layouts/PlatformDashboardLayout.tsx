"use client";

import { AppDialog, AppDialogContent, AppOfflineBanner } from "@/components/ui";
import { PlatformSidebar } from "@/components/layout/PlatformSidebar";
import { PlatformHeader } from "@/components/layout/PlatformHeader";
import { useUiStore } from "@/stores/ui.store";

interface PlatformDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

function PlatformDashboardLayout({ children, title }: PlatformDashboardLayoutProps) {
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);

  return (
    <div className="flex min-h-screen flex-row bg-muted/30">
      <AppOfflineBanner />

      {/* Desktop sidebar (right) */}
      <div className="hidden md:flex">
        <PlatformSidebar variant="desktop" />
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <PlatformHeader title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      <AppDialog open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <AppDialogContent className="end-0 start-auto top-0 h-full max-w-[80vw] translate-x-0 translate-y-0 rounded-none rounded-s-lg border-l p-0 sm:rounded-s-lg">
          <PlatformSidebar
            variant="mobile"
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </AppDialogContent>
      </AppDialog>
    </div>
  );
}

export { PlatformDashboardLayout };
