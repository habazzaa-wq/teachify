"use client";

import { AppDialog, AppDialogContent, AppOfflineBanner } from "@/components/ui";
import { TenantSidebar } from "@/components/layout/TenantSidebar";
import { TenantHeader } from "@/components/layout/TenantHeader";
import { useUiStore } from "@/stores/ui.store";
import type { AppBreadcrumbItem } from "@/components/ui";

interface TenantDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: AppBreadcrumbItem[];
}

function TenantDashboardLayout({ children, title, breadcrumbs }: TenantDashboardLayoutProps) {
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);

  return (
    <div className="flex min-h-screen flex-row bg-muted/30">
      <AppOfflineBanner />

      {/* Desktop sidebar (right) */}
      <div className="hidden md:flex">
        <TenantSidebar variant="desktop" />
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TenantHeader title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      <AppDialog open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <AppDialogContent className="end-0 start-auto top-0 h-full max-w-[80vw] translate-x-0 translate-y-0 rounded-none rounded-s-lg border-l p-0 sm:rounded-s-lg">
          <TenantSidebar
            variant="mobile"
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </AppDialogContent>
      </AppDialog>
    </div>
  );
}

export { TenantDashboardLayout };
