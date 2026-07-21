"use client";

import { useMemo } from "react";
import { AppBanner } from "@/components/ui";
import type { PlatformDomain } from "../../types";
import type { DomainDetailAlert } from "../../types/detail";

interface DomainAlertsProps {
  domain: PlatformDomain;
}

function useDomainAlerts(domain: PlatformDomain): DomainDetailAlert[] {
  return useMemo(() => {
    const alerts: DomainDetailAlert[] = [];

    if (domain.dnsStatus === "failed") {
      alerts.push({
        id: "dns-invalid",
        variant: "destructive",
        title: "سجلات DNS غير صحيحة",
        description: "سجلات DNS الحالية لا تشير إلى الخادم الصحيح. تأكد من تحديث سجل A أو CNAME.",
      });
    }

    if (domain.ssl.status === "error" || domain.ssl.status === "expired") {
      alerts.push({
        id: "ssl-failed",
        variant: "destructive",
        title: domain.ssl.status === "expired" ? "انتهت صلاحية شهادة SSL" : "فشل في شهادة SSL",
        description: domain.ssl.status === "expired"
          ? "انتهت صلاحية شهادة SSL. سيؤثر ذلك على أمان زوار موقعك."
          : "حدث خطأ أثناء إصدار أو تجديد شهادة SSL.",
      });
    }

    if (domain.ssl.remainingDays > 0 && domain.ssl.remainingDays <= 30) {
      alerts.push({
        id: "ssl-expiring",
        variant: "warning",
        title: "شهادة SSL تنتهي قريباً",
        description: `تنتهي صلاحية شهادة SSL خلال ${domain.ssl.remainingDays} يوم. سيتم التجديد تلقائياً إذا كان التجديد مفعّلاً.`,
      });
    }

    if (domain.status === "removed") {
      alerts.push({
        id: "domain-suspended",
        variant: "warning",
        title: "النطاق موقوف",
        description: "هذا النطاق تم إيقافه ولا يمكن الوصول إليه.",
      });
    }

    if (domain.status === "failed") {
      alerts.push({
        id: "domain-inactive",
        variant: "destructive",
        title: "النطاق غير نشط",
        description: "فشل في تفعيل هذا النطاق. تحقق من إعدادات DNS وحاول مرة أخرى.",
      });
    }

    return alerts;
  }, [domain]);
}

function DomainAlerts({ domain }: DomainAlertsProps) {
  const alerts = useDomainAlerts(domain);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <AppBanner
          key={alert.id}
          variant={alert.variant}
          title={alert.title}
          description={alert.description}
        />
      ))}
    </div>
  );
}

export { DomainAlerts };
