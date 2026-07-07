"use client";

import { Shield, RefreshCw, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  AppButton,
  AppBadge,
  AppProgress,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppSwitch,
  Label,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { SSL_STATUS_CONFIG } from "../constants";
import type { SslInfo, SslStatus } from "../types";

interface DomainSSLTabProps {
  ssl: SslInfo;
  readOnly?: boolean;
  onRenew?: () => void;
  renewing?: boolean;
}

function DomainSSLTab({ ssl, readOnly, onRenew, renewing }: DomainSSLTabProps) {
  const sslConfig = SSL_STATUS_CONFIG[ssl.status];
  const remainingPct = ssl.remainingDays > 0
    ? Math.min(100, Math.round((ssl.remainingDays / 365) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">مزود SSL</label>
          {readOnly ? (
            <div className="h-9 rounded-md border bg-muted/50 px-3 text-sm flex items-center">
              {ssl.provider}
            </div>
          ) : (
            <AppSelect value={ssl.provider} disabled={readOnly}>
              <AppSelectTrigger className="h-9">
                <AppSelectValue />
              </AppSelectTrigger>
              <AppSelectContent>
                <AppSelectItem value="Let&apos;s Encrypt">Let&apos;s Encrypt</AppSelectItem>
                <AppSelectItem value="Cloudflare">Cloudflare</AppSelectItem>
                <AppSelectItem value="AWS Certificate Manager">AWS Certificate Manager</AppSelectItem>
              </AppSelectContent>
            </AppSelect>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">الحالة</label>
          <div className="h-9 flex items-center">
            <AppBadge
              variant={sslConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
              className="gap-1"
            >
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                ssl.status === "active" && "bg-success",
                ssl.status === "pending" && "bg-warning",
                ssl.status === "expired" && "bg-destructive",
                ssl.status === "error" && "bg-destructive",
                ssl.status === "none" && "bg-muted-foreground/50",
              )} />
              {sslConfig.label}
            </AppBadge>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">تاريخ الإصدار</label>
          <p className="text-sm">{formatDate(ssl.issuedAt)}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">تاريخ الانتهاء</label>
          <p className="text-sm">{formatDate(ssl.expiresAt)}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">الجهة المصدقة</label>
          <p className="text-sm font-mono">{ssl.issuer || "—"}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">البصمة</label>
          <p className="text-sm font-mono">{ssl.fingerprint || "—"}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">الجدول الزمني للشهادة</h4>
          <span className={cn(
            "text-xs font-medium",
            ssl.remainingDays <= 0 && "text-destructive",
            ssl.remainingDays > 0 && ssl.remainingDays <= 30 && "text-warning",
            ssl.remainingDays > 30 && "text-success",
          )}>
            {ssl.remainingDays > 0
              ? `${ssl.remainingDays} يوم متبقي`
              : "منتهية الصلاحية"}
          </span>
        </div>
        <AppProgress
          value={remainingPct}
          max={100}
          variant={
            remainingPct <= 10 ? "destructive" :
            remainingPct <= 30 ? "warning" : "success"
          }
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="ssl-auto-renew" className="text-sm font-medium">التجديد التلقائي</Label>
          <p className="text-xs text-muted-foreground">تجديد الشهادة تلقائياً قبل انتهائها</p>
        </div>
        <AppSwitch
          id="ssl-auto-renew"
          checked={ssl.autoRenewal}
          disabled={readOnly}
          onCheckedChange={() => {}}
        />
      </div>

      {onRenew && ssl.status !== "active" && (
        <AppButton onClick={onRenew} loading={renewing} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4" />
          تجديد الشهادة
        </AppButton>
      )}
    </div>
  );
}

export { DomainSSLTab };
