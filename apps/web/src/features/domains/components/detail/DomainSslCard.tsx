"use client";

import { RefreshCw, Info } from "lucide-react";
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppBadge,
  AppProgress,
  AppBanner,
  AppEmptyState,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { SSL_STATUS_CONFIG } from "../../constants";
import type { PlatformDomain } from "../../types";

interface DomainSslCardProps {
  domain: PlatformDomain;
  onRetrySsl: () => void;
  isRetrying: boolean;
}

function SslDetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}

function DomainSslCard({ domain, onRetrySsl, isRetrying }: DomainSslCardProps) {
  const { ssl } = domain;
  const sslConfig = SSL_STATUS_CONFIG[ssl.status];
  const remainingPct = ssl.remainingDays > 0
    ? Math.min(100, Math.round((ssl.remainingDays / 365) * 100))
    : 0;
  const isExpiringSoon = ssl.remainingDays > 0 && ssl.remainingDays <= 30;
  const isExpired = ssl.remainingDays <= 0 && ssl.status !== "none";

  if (ssl.status === "none") {
    return (
      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="text-sm">شهادة SSL</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <AppEmptyState
            title="لا توجد معلومات SSL"
            description="لم يتم إصدار شهادة SSL لهذا النطاق بعد."
            icon={Info}
            action={
              <AppButton onClick={onRetrySsl} loading={isRetrying} size="sm">
                <RefreshCw className="h-4 w-4" />
                إعادة محاولة
              </AppButton>
            }
          />
        </AppCardContent>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <AppCardHeader>
        <div className="flex items-center justify-between">
          <AppCardTitle className="text-sm">شهادة SSL</AppCardTitle>
          <div className="flex items-center gap-2">
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
              )} />
              {sslConfig.label}
            </AppBadge>
            {ssl.status !== "active" && (
              <AppButton variant="outline" size="sm" onClick={onRetrySsl} loading={isRetrying}>
                <RefreshCw className="h-3.5 w-3.5" />
                إعادة محاولة
              </AppButton>
            )}
          </div>
        </div>
      </AppCardHeader>
      <AppCardContent>
        {(isExpiringSoon || isExpired) && (
          <AppBanner
            variant={isExpired ? "destructive" : "warning"}
            title={isExpired ? "انتهت صلاحية الشهادة" : "الشهادة تنتهي صلاحيتها قريباً"}
            description={
              isExpired
                ? "انتهت صلاحية شهادة SSL. سيؤثر ذلك على أمان زوار موقعك."
                : `تنتهي صلاحية الشهادة خلال ${ssl.remainingDays} يوم. سيتم التجديد تلقائياً.`
            }
            className="mb-4"
          />
        )}

        <div className="space-y-1">
          <SslDetailRow label="المزود">
            <span className="font-mono text-sm">{ssl.provider}</span>
          </SslDetailRow>
          <SslDetailRow label="الحالة">
            <AppBadge
              variant={sslConfig.color as "success" | "warning" | "destructive" | "secondary" | "outline"}
              className="text-[10px]"
            >
              {sslConfig.label}
            </AppBadge>
          </SslDetailRow>
          <SslDetailRow label="تاريخ الإصدار">
            {formatDate(ssl.issuedAt)}
          </SslDetailRow>
          <SslDetailRow label="تاريخ الانتهاء">
            {formatDate(ssl.expiresAt)}
          </SslDetailRow>
          <SslDetailRow label="الجهة المصدقة">
            <span className="font-mono text-sm">{ssl.issuer || "—"}</span>
          </SslDetailRow>
          <SslDetailRow label="التجديد التلقائي">
            {ssl.autoRenewal ? "مفعّل" : "معطّل"}
          </SslDetailRow>
        </div>

        <div className="mt-4 rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">الجدول الزمني للشهادة</h4>
            <span className={cn(
              "text-xs font-medium tabular-nums",
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
      </AppCardContent>
    </AppCard>
  );
}

export { DomainSslCard };
