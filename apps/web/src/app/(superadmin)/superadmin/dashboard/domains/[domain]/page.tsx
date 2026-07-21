"use client";

import { useState, useCallback, useRef, use } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
import {
  AppPage,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { usePlatformDomain as useDomain, usePlatformRefreshStatus as useRefreshStatus, usePlatformRenewSsl as useRenewSsl } from "@/features/domains/hooks";
import {
  DomainHero,
  DomainSidebar,
  DomainDetailSkeleton,
  DomainOverviewCard,
  DomainDnsCard,
  DomainSslCard,
  DomainHealthCard,
  DomainTimelineCard,
  DomainLogsCard,
  DomainAlerts,
} from "@/features/domains/components/detail";

const TABS = [
  { value: "overview", label: "نظرة عامة" },
  { value: "dns", label: "DNS" },
  { value: "ssl", label: "SSL" },
  { value: "health", label: "الصحة" },
  { value: "timeline", label: "الجدول الزمني" },
  { value: "logs", label: "السجلات" },
];

function DomainDetailPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: domainId } = use(params);
  const { data: domain, isLoading, isError } = useDomain(domainId);
  const refreshStatus = useRefreshStatus();
  const renewSsl = useRenewSsl();
  const [activeTab, setActiveTab] = useState("overview");
  const logsRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(() => {
    if (domain) refreshStatus.mutate(domain.id);
  }, [domain, refreshStatus]);

  const handleRenewSsl = useCallback(() => {
    if (domain) renewSsl.mutate(domain.id);
  }, [domain, renewSsl]);

  const handleScrollToLogs = useCallback(() => {
    setActiveTab("logs");
    logsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNavigateToTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  if (isLoading) {
    return (
      <SuperAdminGuard>
        <AppPage maxWidth="full">
          <DomainDetailSkeleton />
        </AppPage>
      </SuperAdminGuard>
    );
  }

  if (isError || !domain) {
    return (
      <SuperAdminGuard>
        <AppPage maxWidth="full">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium text-foreground">النطاق غير موجود</p>
            <p className="mt-2 text-sm text-muted-foreground">لم يتم العثور على هذا النطاق.</p>
            <Link href="/superadmin/dashboard/domains">
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                <ArrowRight className="h-4 w-4" />
                العودة للنطاقات
              </button>
            </Link>
          </div>
        </AppPage>
      </SuperAdminGuard>
    );
  }

  return (
    <SuperAdminGuard>
      <AppPage maxWidth="full">
        <div className="space-y-6">
          <DomainHero
            domain={domain}
            onRefresh={handleRefresh}
            onRenewSsl={handleRenewSsl}
            onScrollToLogs={handleScrollToLogs}
            isRefreshing={refreshStatus.isPending}
            isRenewing={renewSsl.isPending}
          />

          <DomainAlerts domain={domain} />

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-6" ref={logsRef}>
              <AppTabs value={activeTab} onValueChange={setActiveTab}>
                <AppTabsList className="flex h-auto gap-0 bg-transparent p-0 w-full border-0">
                  {TABS.map((tab) => (
                    <AppTabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        "relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                        "bg-transparent shadow-none rounded-none",
                        "hover:text-foreground",
                        "data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                        "data-[state=inactive]:text-muted-foreground",
                        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all after:duration-200",
                        "data-[state=active]:after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100",
                        "data-[state=inactive]:hover:after:bg-muted-foreground/20 data-[state=inactive]:hover:after:scale-x-100",
                      )}
                    >
                      {tab.label}
                    </AppTabsTrigger>
                  ))}
                </AppTabsList>
              </AppTabs>

              {activeTab === "overview" && (
                <DomainOverviewCard domain={domain} />
              )}
              {activeTab === "dns" && (
                <DomainDnsCard
                  domain={domain}
                  onRefresh={handleRefresh}
                  isRefreshing={refreshStatus.isPending}
                />
              )}
              {activeTab === "ssl" && (
                <DomainSslCard
                  domain={domain}
                  onRetrySsl={handleRenewSsl}
                  isRetrying={renewSsl.isPending}
                />
              )}
              {activeTab === "health" && (
                <DomainHealthCard domain={domain} />
              )}
              {activeTab === "timeline" && (
                <DomainTimelineCard domain={domain} />
              )}
              {activeTab === "logs" && (
                <DomainLogsCard domain={domain} />
              )}
            </div>

            <DomainSidebar domain={domain} onNavigateToTab={handleNavigateToTab} />
          </div>
        </div>
      </AppPage>
    </SuperAdminGuard>
  );
}

export default DomainDetailPage;
