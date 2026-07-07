"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ExternalLink, Copy, Check } from "lucide-react";
import {
  AppButton,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppDrawer,
  AppBadge,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import {
  DOMAIN_TYPE_CONFIG,
  DOMAIN_STATUS_CONFIG,
  SSL_STATUS_CONFIG,
  DNS_STATUS_CONFIG,
  VERIFICATION_STATUS_CONFIG,
  HEALTH_STATUS_CONFIG,
} from "../constants";
import { useDomain } from "../hooks";
import { DomainHealthWidget } from "./DomainHealthWidget";
import { DomainVerificationFlow } from "./DomainVerificationFlow";
import { DomainDNSTab } from "./DomainDNSTab";
import { DomainSSLTab } from "./DomainSSLTab";
import { DomainRedirectTab } from "./DomainRedirectTab";
import type { PlatformDomain, RedirectRule } from "../types";

interface DomainDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainId: string | null;
}

const TABS = [
  { value: "overview", label: "نظرة عامة" },
  { value: "dns", label: "DNS" },
  { value: "ssl", label: "SSL" },
  { value: "redirects", label: "التحويلات" },
  { value: "activity", label: "النشاط" },
  { value: "history", label: "السجل" },
];

function DomainDetailsDrawer({
  open,
  onOpenChange,
  domainId,
}: DomainDetailsDrawerProps) {
  const { data: domain, isLoading } = useDomain(domainId);
  const [activeTab, setActiveTab] = useState("overview");
  const [urlCopied, setUrlCopied] = useState(false);
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(["overview"]));

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("overview");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMountedTabs(new Set(["overview"]));
    }
  }, [open]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setMountedTabs((prev) => new Set(prev).add(value));
  }, []);

  const copyUrl = useCallback(() => {
    if (!domain) return;
    navigator.clipboard.writeText(domain.domain);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }, [domain]);

  const openUrl = useCallback(() => {
    if (!domain) return;
    window.open(`https://${domain.domain}`, "_blank", "noopener,noreferrer");
  }, [domain]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!domain && isLoading) {
    return (
      <AppDrawer open={open} onOpenChange={onOpenChange} side="end" className="w-full sm:max-w-[80vw] lg:max-w-[900px] xl:max-w-[960px]">
        <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
          <header className="flex items-center justify-between border-b px-6 py-4 shrink-0">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </header>
          <div className="flex-1 p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </AppDrawer>
    );
  }

  const drawerTitle = domain?.domain || "تفاصيل النطاق";

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[80vw] lg:max-w-[900px] xl:max-w-[960px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label={drawerTitle}>
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0 flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight truncate">
                {drawerTitle}
              </h2>
              {domain && (
                <AppBadge
                  variant={DOMAIN_STATUS_CONFIG[domain.status].color as "success" | "warning" | "destructive" | "secondary" | "outline"}
                  className="text-[10px]"
                >
                  {DOMAIN_STATUS_CONFIG[domain.status].label}
                </AppBadge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {domain && (
              <>
                <button
                  onClick={copyUrl}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="نسخ النطاق"
                  title={domain.domain}
                >
                  {urlCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={openUrl}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="فتح في تبويب جديد"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b bg-muted/20 px-6 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {domain?.tenantName} — {domain?.type === "platform" ? "النظام الأساسي" : domain?.type === "custom" ? "مخصص" : domain?.type === "wildcard" ? "شامل" : "مؤقت"}
          </span>
        </div>

        <div className="shrink-0 border-b bg-background z-10">
          <div className="px-6 overflow-x-auto scrollbar-thin">
            <AppTabs value={activeTab} onValueChange={handleTabChange}>
              <AppTabsList className="flex h-auto gap-0 bg-transparent p-0 w-full border-0">
                {TABS.map((tab) => (
                  <AppTabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                      "bg-transparent shadow-none rounded-none",
                      "hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
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
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto min-h-0 bg-muted/10"
          style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin' }}
        >
          {domain && (
            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <DomainHealthWidget health={domain.health} />
                  <DomainVerificationFlow status={domain.verificationStatus} />
                </div>
              )}
              {activeTab === "dns" && (
                <DomainDNSTab records={domain.dnsRecords} />
              )}
              {activeTab === "ssl" && (
                <DomainSSLTab ssl={domain.ssl} readOnly />
              )}
              {activeTab === "redirects" && (
                <DomainRedirectTab
                  enabled={domain.redirect.enabled}
                  httpToHttps={domain.redirect.httpToHttps}
                  wwwToNonWww={domain.redirect.wwwToNonWww}
                  rules={domain.redirect.rules}
                  readOnly
                />
              )}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">النشاطات الأخيرة</h3>
                  <div className="space-y-2">
                    {[
                      { action: "تم تحديث حالة النطاق", date: domain.updatedAt },
                      { action: domain.verifiedAt ? "تم التحقق من النطاق" : null, date: domain.verifiedAt },
                      { action: domain.ssl.issuedAt ? "تم إصدار شهادة SSL" : null, date: domain.ssl.issuedAt },
                      { action: "تم إنشاء النطاق", date: domain.createdAt },
                    ]
                      .filter((a) => a.action && a.date)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm">{item.action}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {activeTab === "history" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">سجل التغييرات</h3>
                  <div className="rounded-lg border bg-card">
                    <div className="divide-y">
                      {[
                        { field: "الحالة", from: "قيد الانتظار", to: "نشط", date: domain.updatedAt },
                        { field: "SSL", from: "قيد الإصدار", to: "نشط", date: domain.ssl.issuedAt },
                        { field: "DNS", from: "غير مهيأ", to: "موثّق", date: domain.updatedAt },
                        { field: "النطاق الأساسي", from: "لا", to: domain.isPrimary ? "نعم" : "لا", date: domain.createdAt },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground min-w-[60px]">{item.field}:</span>
                            <span className="text-muted-foreground/60 line-through">{item.from}</span>
                            <span>→</span>
                            <span className="font-medium">{item.to}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{item.date ? formatDate(item.date) : "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppDrawer>
  );
}

export { DomainDetailsDrawer };
