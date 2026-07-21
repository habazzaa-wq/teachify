"use client";

import { memo, useState, useCallback } from "react";
import {
  Eye,
  RefreshCw,
  Shield,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Ban,
  Trash2,
  MoreHorizontal,
  Globe,
  Server,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import type { PlatformDomain } from "../types";

interface DomainRowActionsProps {
  domain: PlatformDomain;
  onView: () => void;
  onRefreshStatus: () => void;
  onRenewSsl: () => void;
  onDelete: () => void;
}

const DomainRowActions = memo(function DomainRowActions({
  domain,
  onView,
  onRefreshStatus,
  onRenewSsl,
  onDelete,
}: DomainRowActionsProps) {
  const [copied, setCopied] = useState(false);
  const [dnsCopied, setDnsCopied] = useState(false);

  const handleCopyDomain = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(domain.domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [domain.domain]);

  const handleOpenWebsite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://${domain.domain}`, "_blank", "noopener,noreferrer");
  }, [domain.domain]);

  const handleOpenAdmin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://${domain.domain}/admin`, "_blank", "noopener,noreferrer");
  }, [domain.domain]);

  const handleCopyDnsRecords = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const records = domain.dnsRecords
      .map((r) => `${r.type}\t${r.host}\t${r.value}\t${r.ttl}`)
      .join("\n");
    navigator.clipboard.writeText(records || "No DNS records");
    setDnsCopied(true);
    setTimeout(() => setDnsCopied(false), 2000);
  }, [domain.dnsRecords]);

  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات النطاق"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="w-52">
        <AppDropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4" />
          عرض التفاصيل
        </AppDropdownMenuItem>
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem onClick={onRefreshStatus}>
          <RefreshCw className="h-4 w-4" />
          فحص DNS الآن
        </AppDropdownMenuItem>
        {domain.ssl.status !== "active" && (
          <AppDropdownMenuItem onClick={onRenewSsl}>
            <Shield className="h-4 w-4" />
            إعادة محاولة SSL
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuItem onClick={onView}>
          <FileText className="h-4 w-4" />
          عرض السجلات
        </AppDropdownMenuItem>
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem onClick={handleCopyDomain}>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          {copied ? "تم النسخ" : "نسخ النطاق"}
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={handleOpenWebsite}>
          <Globe className="h-4 w-4" />
          فتح الموقع
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={handleOpenAdmin}>
          <Server className="h-4 w-4" />
          فتح لوحة التحكم
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={handleCopyDnsRecords}>
          {dnsCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          {dnsCopied ? "تم النسخ" : "نسخ سجلات DNS"}
        </AppDropdownMenuItem>
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem onClick={(e) => e.stopPropagation()}>
          <Ban className="h-4 w-4" />
          إيقاف مؤقت
        </AppDropdownMenuItem>
        <AppDropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </AppDropdownMenuItem>
      </AppDropdownMenuContent>
    </AppDropdownMenu>
  );
});

export { DomainRowActions };
