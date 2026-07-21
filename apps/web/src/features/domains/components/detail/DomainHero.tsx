"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Activity,
  FileText,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import {
  AppButton,
  AppBadge,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  AppTooltip,
  AppTooltipTrigger,
  AppTooltipContent,
  AppTooltipProvider,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime } from "@/lib/format";
import { DomainStatusBadge } from "../DomainStatusBadge";
import {
  DOMAIN_TYPE_CONFIG,
} from "../../constants";
import type { PlatformDomain } from "../../types";

interface DomainHeroProps {
  domain: PlatformDomain;
  onRefresh: () => void;
  onRenewSsl: () => void;
  onScrollToLogs: () => void;
  isRefreshing: boolean;
  isRenewing: boolean;
}

function DomainHero({
  domain,
  onRefresh,
  onRenewSsl,
  onScrollToLogs,
  isRefreshing,
  isRenewing,
}: DomainHeroProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const openWebsite = useCallback(() => {
    window.open(`https://${domain.domain}`, "_blank", "noopener,noreferrer");
  }, [domain.domain]);

  const typeConfig = DOMAIN_TYPE_CONFIG[domain.type];

  return (
    <div className="space-y-5">
      <Link
        href="/superadmin/dashboard/domains"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للنطاقات
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {domain.domain}
            </h1>
            {domain.isPrimary && (
              <span className="shrink-0 rounded bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                نطاق أساسي
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DomainStatusBadge type="status" value={domain.status} />
            <DomainStatusBadge type="ssl" value={domain.ssl.status} />
            <DomainStatusBadge type="dns" value={domain.dnsStatus} />
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">{domain.tenantName}</span>
            </span>
            <span className="text-border">|</span>
            <AppBadge
              variant={typeConfig.color as "default" | "secondary" | "destructive" | "success" | "warning" | "outline"}
              className="text-[10px]"
            >
              {typeConfig.label}
            </AppBadge>
            <span className="text-border">|</span>
            <span>
              أُنشئ: <span className="text-foreground">{formatDate(domain.createdAt)}</span>
            </span>
            {domain.health.lastChecked && (
              <>
                <span className="text-border">|</span>
                <AppTooltipProvider delayDuration={200}>
                  <AppTooltip>
                    <AppTooltipTrigger asChild>
                      <span className="cursor-help text-xs text-muted-foreground tabular-nums">
                        آخر فحص: <span className="text-foreground">{formatDateTime(domain.health.lastChecked)}</span>
                      </span>
                    </AppTooltipTrigger>
                    <AppTooltipContent side="top">
                      <p className="text-xs">{formatDateTime(domain.health.lastChecked)}</p>
                    </AppTooltipContent>
                  </AppTooltip>
                </AppTooltipProvider>
              </>
            )}
          </div>
        </div>

        <AppDropdownMenu>
          <AppDropdownMenuTrigger asChild>
            <AppButton variant="outline" size="sm" className="shrink-0">
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              إجراءات سريعة
            </AppButton>
          </AppDropdownMenuTrigger>
          <AppDropdownMenuContent align="end" className="w-56">
            <AppDropdownMenuItem onClick={openWebsite}>
              <ExternalLink className="h-4 w-4" />
              فتح الموقع
            </AppDropdownMenuItem>
            <AppDropdownMenuItem onClick={() => copyToClipboard(domain.domain, "domain")}>
              {copied === "domain" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied === "domain" ? "تم النسخ" : "نسخ النطاق"}
            </AppDropdownMenuItem>
            <AppDropdownMenuItem onClick={() => copyToClipboard(domain.domain, "dns")}>
              {copied === "dns" ? <Check className="h-4 w-4 text-success" /> : <ClipboardList className="h-4 w-4" />}
              {copied === "dns" ? "تم النسخ" : "نسخ سجلات DNS"}
            </AppDropdownMenuItem>
            <AppDropdownMenuSeparator />
            <AppDropdownMenuItem onClick={onRefresh} disabled={isRefreshing}>
              <Activity className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              فحص DNS الآن
            </AppDropdownMenuItem>
            <AppDropdownMenuItem onClick={onRenewSsl} disabled={isRenewing}>
              <Shield className={cn("h-4 w-4", isRenewing && "animate-spin")} />
              إعادة محاولة SSL
            </AppDropdownMenuItem>
            <AppDropdownMenuSeparator />
            <AppDropdownMenuItem onClick={onScrollToLogs}>
              <FileText className="h-4 w-4" />
              عرض السجلات
            </AppDropdownMenuItem>
          </AppDropdownMenuContent>
        </AppDropdownMenu>
      </div>
    </div>
  );
}

export { DomainHero };
