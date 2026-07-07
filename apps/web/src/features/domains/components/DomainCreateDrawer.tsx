"use client";

import { useState, useCallback } from "react";
import { X, Save } from "lucide-react";
import {
  AppButton,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppDrawer,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CreateDomainPayload, DomainType } from "../types";
import { DomainGeneralTab } from "./DomainGeneralTab";
import { DomainDNSTab } from "./DomainDNSTab";
import { DomainSSLTab } from "./DomainSSLTab";
import { DomainRedirectTab } from "./DomainRedirectTab";
import { DomainAdvancedTab } from "./DomainAdvancedTab";
import type { DomainAdvanced } from "../types";

const TENANTS = [
  { id: "tenant_01", name: "أكاديمية النور" },
  { id: "tenant_02", name: "معهد الفكر" },
  { id: "tenant_03", name: "جامعة المستقبل" },
  { id: "tenant_04", name: "مدرسة الإبداع" },
  { id: "tenant_05", name: "أكاديمية المعرفة" },
];

interface DomainCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CreateDomainPayload) => void;
  saving?: boolean;
}

const TABS = [
  { value: "general", label: "عام" },
  { value: "dns", label: "DNS" },
  { value: "ssl", label: "SSL" },
  { value: "redirect", label: "التحويلات" },
  { value: "advanced", label: "متقدم" },
];

const defaultAdvanced: DomainAdvanced = {
  headers: { hsts: false, csp: false, xFrame: false, xssProtection: false },
  cache: false,
  compression: false,
  security: false,
};

function DomainCreateDrawer({
  open,
  onOpenChange,
  onSave,
  saving,
}: DomainCreateDrawerProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState<Partial<CreateDomainPayload>>({
    tenantId: "",
    domain: "",
    subdomain: "",
    type: "custom",
    isPrimary: false,
    active: true,
    notes: "",
  });
  const [redirectEnabled, setRedirectEnabled] = useState(false);
  const [httpToHttps, setHttpToHttps] = useState(false);
  const [wwwToNonWww, setWwwToNonWww] = useState(false);
  const [advanced, setAdvanced] = useState<DomainAdvanced>(defaultAdvanced);

  const handleChange = useCallback((data: Partial<CreateDomainPayload>) => {
    setFormData(data);
  }, []);

  const handleToggle = useCallback((key: string, value: boolean) => {
    if (key === "enabled") setRedirectEnabled(value);
    else if (key === "httpToHttps") setHttpToHttps(value);
    else if (key === "wwwToNonWww") setWwwToNonWww(value);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave({
      tenantId: formData.tenantId ?? "",
      domain: formData.domain ?? "",
      subdomain: formData.subdomain ?? "",
      type: (formData.type ?? "custom") as DomainType,
      isPrimary: formData.isPrimary ?? false,
      active: formData.active ?? true,
      notes: formData.notes ?? "",
    });
  }, [onSave, formData]);

  const isValid = formData.tenantId && formData.domain;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[80vw] lg:max-w-[900px] xl:max-w-[960px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="إضافة نطاق جديد">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              إضافة نطاق جديد
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="shrink-0 border-b bg-background z-10">
          <div className="px-6 overflow-x-auto scrollbar-thin">
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
          <div className="p-6">
            {activeTab === "general" && (
              <DomainGeneralTab
                data={formData}
                onChange={handleChange}
                tenants={TENANTS}
              />
            )}
            {activeTab === "dns" && (
              <DomainDNSTab records={[]} />
            )}
            {activeTab === "ssl" && (
              <DomainSSLTab
                ssl={{
                  provider: "Let's Encrypt",
                  status: "none",
                  issuedAt: null,
                  expiresAt: null,
                  autoRenewal: true,
                  issuer: null,
                  fingerprint: null,
                  remainingDays: 0,
                }}
                readOnly
              />
            )}
            {activeTab === "redirect" && (
              <DomainRedirectTab
                enabled={redirectEnabled}
                httpToHttps={httpToHttps}
                wwwToNonWww={wwwToNonWww}
                rules={[]}
                onToggle={handleToggle}
              />
            )}
            {activeTab === "advanced" && (
              <DomainAdvancedTab
                data={advanced}
                onChange={setAdvanced}
              />
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            سيتم إضافة النطاق بعد الحفظ
          </div>
          <div className="flex items-center gap-3">
            <AppButton variant="ghost" onClick={handleClose} className="text-sm">
              إلغاء
            </AppButton>
            {onSave && (
              <AppButton size="default" onClick={handleSave} loading={saving} disabled={!isValid} className="text-sm min-w-[100px]">
                <Save className="h-4 w-4" />
                حفظ
              </AppButton>
            )}
          </div>
        </footer>
      </div>
    </AppDrawer>
  );
}

export { DomainCreateDrawer };
