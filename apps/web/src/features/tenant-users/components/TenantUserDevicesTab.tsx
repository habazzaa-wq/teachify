"use client";

import { Laptop, Smartphone, Tablet, ShieldCheck, ShieldOff } from "lucide-react";
import { AppBadge, AppButton, Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { TenantUserDevice } from "../types";

const deviceIcons = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

interface TenantUserDevicesTabProps {
  devices?: TenantUserDevice[];
  loading?: boolean;
  onToggleTrust?: (deviceId: string, trusted: boolean) => void;
}

function TenantUserDevicesTab({ devices, loading, onToggleTrust }: TenantUserDevicesTabProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Smartphone className="h-8 w-8 mb-2" />
        <p className="text-sm">لا توجد أجهزة موثقة</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => {
        const Icon = deviceIcons[device.type] ?? Laptop;
        return (
          <div key={device.id} className="flex items-start gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{device.name}</p>
                {device.trusted ? (
                  <AppBadge variant="success" className="text-[10px] gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    موثوق
                  </AppBadge>
                ) : (
                  <AppBadge variant="secondary" className="text-[10px] gap-1">
                    <ShieldOff className="h-3 w-3" />
                    غير موثوق
                  </AppBadge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {device.os} · {device.browser}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  آخر استخدام: {formatDateTime(device.lastUsed)}
                </span>
                {onToggleTrust && (
                  <AppButton
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onToggleTrust(device.id, !device.trusted)}
                  >
                    {device.trusted ? "إلغاء الثقة" : "توثيق"}
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { TenantUserDevicesTab };
