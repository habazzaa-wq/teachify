"use client";

import { memo, useState, useCallback } from "react";
import {
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppBadge,
  AppProgress,
  AppCheckbox,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Copy, Check, ExternalLink, Star } from "lucide-react";
import {
  DOMAIN_TYPE_CONFIG,
  DOMAIN_STATUS_CONFIG,
  SSL_STATUS_CONFIG,
  DNS_STATUS_CONFIG,
  VERIFICATION_STATUS_CONFIG,
  HEALTH_STATUS_CONFIG,
} from "../constants";
import { DomainRowActions } from "./DomainRowActions";
import type { PlatformDomain } from "../types";

interface DomainsTableProps {
  domains: PlatformDomain[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (domain: PlatformDomain) => void;
  onEdit: (domain: PlatformDomain) => void;
  onRefreshStatus: (domain: PlatformDomain) => void;
  onRenewSsl: (domain: PlatformDomain) => void;
  onCopy: (domain: PlatformDomain) => void;
  onOpen: (domain: PlatformDomain) => void;
  onMakePrimary: (domain: PlatformDomain) => void;
  onDelete: (domain: PlatformDomain) => void;
}

const DomainsTableRow = memo(function DomainsTableRow({
  domain,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onRefreshStatus,
  onRenewSsl,
  onCopy,
  onOpen,
  onMakePrimary,
  onDelete,
}: {
  domain: PlatformDomain;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (domain: PlatformDomain) => void;
  onEdit: (domain: PlatformDomain) => void;
  onRefreshStatus: (domain: PlatformDomain) => void;
  onRenewSsl: (domain: PlatformDomain) => void;
  onCopy: (domain: PlatformDomain) => void;
  onOpen: (domain: PlatformDomain) => void;
  onMakePrimary: (domain: PlatformDomain) => void;
  onDelete: (domain: PlatformDomain) => void;
}) {
  const [domainCopied, setDomainCopied] = useState(false);
  const typeConfig = DOMAIN_TYPE_CONFIG[domain.type];
  const isChecked = selectedIds?.includes(domain.id) ?? false;

  const handleCheck = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    const next = isChecked
      ? selectedIds!.filter((id) => id !== domain.id)
      : [...(selectedIds ?? []), domain.id];
    onSelectionChange(next);
  }, [domain.id, isChecked, selectedIds, onSelectionChange]);
  const statusConfig = DOMAIN_STATUS_CONFIG[domain.status];
  const sslConfig = SSL_STATUS_CONFIG[domain.ssl.status];
  const dnsConfig = DNS_STATUS_CONFIG[domain.dnsStatus];
  const verificationConfig = VERIFICATION_STATUS_CONFIG[domain.verificationStatus];

  const copyDomain = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(domain.domain);
    setDomainCopied(true);
    setTimeout(() => setDomainCopied(false), 2000);
  };

  return (
    <AppTableRow className="group cursor-pointer" onClick={() => onEdit(domain)}>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <AppCheckbox checked={isChecked} onCheckedChange={handleCheck as never} />
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-medium truncate">{domain.domain}</span>
          {domain.isPrimary && (
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
          )}
          <button
            onClick={copyDomain}
            className="shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
            title="نسخ النطاق"
          >
            {domainCopied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </AppTableCell>
      <AppTableCell>
        <span className="text-xs text-muted-foreground">{domain.tenantName}</span>
      </AppTableCell>
      <AppTableCell>
        <AppBadge
          variant={typeConfig.color}
          className="text-[10px]"
        >
          {typeConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        {domain.isPrimary ? (
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </AppTableCell>
      <AppTableCell>
        <AppBadge
          variant={sslConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
          className="text-[10px] gap-1"
        >
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            domain.ssl.status === "active" && "bg-success",
            domain.ssl.status === "pending" && "bg-warning",
            domain.ssl.status === "expired" && "bg-destructive",
            domain.ssl.status === "error" && "bg-destructive",
            domain.ssl.status === "none" && "bg-muted-foreground/50",
          )} />
          {sslConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        <AppBadge
          variant={dnsConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
          className="text-[10px]"
        >
          {dnsConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        <AppBadge
          variant={verificationConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
          className="text-[10px]"
        >
          {verificationConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        <AppBadge
          variant={domain.redirect.httpToHttps ? "success" : "secondary"}
          className="text-[10px]"
        >
          {domain.redirect.httpToHttps ? "مفعل" : "معطل"}
        </AppBadge>
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-2 min-w-[80px]">
          <AppProgress
            value={domain.health.overall}
            max={100}
            size="sm"
            variant={
              domain.health.overall >= 90 ? "success" :
              domain.health.overall >= 50 ? "warning" : "destructive"
            }
            className="w-12"
          />
          <span className={cn(
            "text-xs tabular-nums",
            domain.health.status === "healthy" && "text-success",
            domain.health.status === "degraded" && "text-warning",
            domain.health.status === "unhealthy" && "text-destructive",
          )}>
            {domain.health.overall}%
          </span>
        </div>
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {formatDate(domain.createdAt)}
      </AppTableCell>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <DomainRowActions
          domain={domain}
          onView={() => onView(domain)}
          onEdit={() => onEdit(domain)}
          onRefreshStatus={() => onRefreshStatus(domain)}
          onRenewSsl={() => onRenewSsl(domain)}
          onCopy={() => onCopy(domain)}
          onOpen={() => onOpen(domain)}
          onMakePrimary={() => onMakePrimary(domain)}
          onDelete={() => onDelete(domain)}
        />
      </AppTableCell>
    </AppTableRow>
  );
});

function DomainsTable(props: DomainsTableProps) {
  const { domains, selectedIds, onSelectionChange, ...actions } = props;
  const allSelected = domains.length > 0 && selectedIds?.length === domains.length;

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(domains.map((d) => d.id));
    }
  }, [domains, allSelected, onSelectionChange]);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <AppTable>
        <AppTableHeader>
          <AppTableRow>
            <AppTableHead className="w-10">
              <AppCheckbox
                checked={allSelected}
                onCheckedChange={toggleAll as never}
              />
            </AppTableHead>
            <AppTableHead>النطاق</AppTableHead>
            <AppTableHead>العميل</AppTableHead>
            <AppTableHead>النوع</AppTableHead>
            <AppTableHead>أساسي</AppTableHead>
            <AppTableHead>SSL</AppTableHead>
            <AppTableHead>DNS</AppTableHead>
            <AppTableHead>التحقق</AppTableHead>
            <AppTableHead>التحويل</AppTableHead>
            <AppTableHead>الصحة</AppTableHead>
            <AppTableHead>تاريخ الإنشاء</AppTableHead>
            <AppTableHead className="w-10" />
          </AppTableRow>
        </AppTableHeader>
        <AppTableBody>
          {domains.map((domain) => (
            <DomainsTableRow key={domain.id} domain={domain} selectedIds={selectedIds} onSelectionChange={onSelectionChange} {...actions} />
          ))}
        </AppTableBody>
      </AppTable>
    </div>
  );
}

export { DomainsTable };
