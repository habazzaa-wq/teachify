"use client";

import { useState, useCallback } from "react";
import { Copy, Check, RefreshCw, Info } from "lucide-react";
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppBadge,
  AppBanner,
  AppEmptyState,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DNS_STATUS_CONFIG } from "../../constants";
import type { PlatformDomain, DnsRecord } from "../../types";

interface DomainDnsCardProps {
  domain: PlatformDomain;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function generateDnsRecords(domain: PlatformDomain): DnsRecord[] {
  const records: DnsRecord[] = [];

  if (domain.type === "custom" || domain.type === "wildcard") {
    records.push({
      id: `${domain.id}-a`,
      type: "A",
      host: domain.domain,
      value: "185.199.108.153",
      ttl: 3600,
      status: domain.dnsStatus,
    });
    records.push({
      id: `${domain.id}-cname`,
      type: "CNAME",
      host: `www.${domain.domain}`,
      value: domain.domain,
      ttl: 3600,
      status: domain.dnsStatus,
    });
  } else if (domain.type === "platform") {
    records.push({
      id: `${domain.id}-cname`,
      type: "CNAME",
      host: domain.subdomain || domain.domain,
      value: "teachify.tech",
      ttl: 3600,
      status: domain.dnsStatus,
    });
  }

  if (domain.verificationToken) {
    records.push({
      id: `${domain.id}-txt`,
      type: "TXT",
      host: domain.domain,
      value: domain.verificationToken,
      ttl: 3600,
      status: domain.dnsStatus,
    });
  }

  return records;
}

function DomainDnsCard({ domain, onRefresh, isRefreshing }: DomainDnsCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const records = domain.dnsRecords.length > 0 ? domain.dnsRecords : generateDnsRecords(domain);

  const copyValue = useCallback((id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const copyRecord = useCallback((record: DnsRecord) => {
    const text = `${record.type}\t${record.host}\t${record.value}\t${record.ttl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const hasDnsIssue = domain.dnsStatus === "failed" || domain.dnsStatus === "pending";

  return (
    <AppCard>
      <AppCardHeader>
        <div className="flex items-center justify-between">
          <AppCardTitle className="text-sm">سجلات DNS</AppCardTitle>
          <AppButton
            variant="outline"
            size="sm"
            onClick={onRefresh}
            loading={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            تحديث DNS
          </AppButton>
        </div>
      </AppCardHeader>
      <AppCardContent>
        {hasDnsIssue && (
          <AppBanner
            variant={domain.dnsStatus === "failed" ? "destructive" : "warning"}
            title={domain.dnsStatus === "failed" ? "سجلات DNS غير صحيحة" : "بانتظار التحقق من DNS"}
            description={
              domain.dnsStatus === "failed"
                ? "سجلات DNS الحالية لا تشير إلى خادمنا. تأكد من إضافة سجل A أو CNAME الصحيح."
                : "لم يتم التحقق من سجلات DNS بعد. قد يستغرق النشر بضع دقائق إلى 24 ساعة."
            }
            className="mb-4"
          />
        )}

        {records.length === 0 ? (
          <AppEmptyState
            title="لا توجد سجلات DNS"
            description="لم يتم العثور على سجلات DNS لهذا النطاق."
            icon={Info}
          />
        ) : (
          <>
            <div className="rounded-xl border overflow-hidden">
              <AppTable>
                <AppTableHeader>
                  <AppTableRow>
                    <AppTableHead className="w-20">النوع</AppTableHead>
                    <AppTableHead>المضيف</AppTableHead>
                    <AppTableHead>القيمة</AppTableHead>
                    <AppTableHead className="w-16">TTL</AppTableHead>
                    <AppTableHead className="w-20">الحالة</AppTableHead>
                    <AppTableHead className="w-20" />
                  </AppTableRow>
                </AppTableHeader>
                <AppTableBody>
                  {records.map((record) => {
                    const dnsConfig = DNS_STATUS_CONFIG[record.status];
                    return (
                      <AppTableRow key={record.id}>
                        <AppTableCell>
                          <span className="font-mono text-xs font-semibold">{record.type}</span>
                        </AppTableCell>
                        <AppTableCell>
                          <span className="font-mono text-xs">{record.host}</span>
                        </AppTableCell>
                        <AppTableCell className="max-w-[200px]">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs truncate">{record.value}</span>
                            <button
                              onClick={() => copyValue(record.id, record.value)}
                              className="shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors"
                              aria-label="نسخ القيمة"
                            >
                              {copiedId === record.id ? (
                                <Check className="h-3 w-3 text-success" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </AppTableCell>
                        <AppTableCell>
                          <span className="text-xs text-muted-foreground tabular-nums">{record.ttl}s</span>
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
                          <button
                            onClick={() => copyRecord(record)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="نسخ السجل"
                          >
                            {copiedId === record.id ? (
                              <Check className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </AppTableCell>
                      </AppTableRow>
                    );
                  })}
                </AppTableBody>
              </AppTable>
            </div>

            <div className="mt-4 rounded-lg border border-dashed p-4">
              <h4 className="text-xs font-semibold mb-2">تعليمات إعداد DNS</h4>
              <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                <li>سجّل الدخول إلى لوحة تحكم مزود DNS الخاص بك</li>
                <li>أضف السجلات الموضحة أعلاه مع القيم المحددة</li>
                <li>قد يستغرق نشر التغييرات من 5 دقائق إلى 24 ساعة</li>
                <li>سيتم التحقق تلقائياً من سجلات DNS</li>
              </ol>
            </div>
          </>
        )}
      </AppCardContent>
    </AppCard>
  );
}

export { DomainDnsCard };
