"use client";

import { useState } from "react";
import { Copy, Check, ShieldCheck } from "lucide-react";
import {
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppBadge,
  AppButton,
} from "@/components/ui";
import { DNS_STATUS_CONFIG } from "../constants";
import type { DnsRecord, DnsStatus } from "../types";

interface DomainDNSTabProps {
  records: DnsRecord[];
  onVerify?: () => void;
  verifying?: boolean;
}

function DomainDNSTab({ records, onVerify, verifying }: DomainDNSTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyValue = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">سجلات DNS</h3>
          <p className="text-xs text-muted-foreground">أضف هذه السجلات إلى مزود DNS الخاص بك</p>
        </div>
        {onVerify && (
          <AppButton variant="outline" size="sm" onClick={onVerify} loading={verifying}>
            <ShieldCheck className="h-4 w-4" />
            التحقق من DNS
          </AppButton>
        )}
      </div>

      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">لا توجد سجلات DNS مهيأة بعد</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <AppTable>
            <AppTableHeader>
              <AppTableRow>
                <AppTableHead>النوع</AppTableHead>
                <AppTableHead>المضيف</AppTableHead>
                <AppTableHead>القيمة</AppTableHead>
                <AppTableHead>TTL</AppTableHead>
                <AppTableHead>الحالة</AppTableHead>
                <AppTableHead className="w-10" />
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
                          className="shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-foreground"
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
                      <span className="text-xs text-muted-foreground">{record.ttl}s</span>
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
                        onClick={() => copyValue(record.id, record.value)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="نسخ القيمة"
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
      )}

      <div className="rounded-lg border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-2">تعليمات إعداد DNS</h4>
        <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
          <li>سجّل الدخول إلى لوحة تحكم مزود DNS الخاص بك</li>
          <li>أضف السجلات الموضحة أعلاه مع القيم المحددة</li>
          <li>قد يستغرق نشر التغييرات من 5 دقائق إلى 24 ساعة</li>
          <li>بعد إضافة السجلات، انقر على &quot;التحقق من DNS&quot;</li>
        </ol>
      </div>
    </div>
  );
}

export { DomainDNSTab };
