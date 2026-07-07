"use client";

import { ShieldCheck, ShieldX, KeyRound, Mail, Smartphone, LogIn, AlertTriangle } from "lucide-react";
import { AppBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { TenantUser } from "../types";

interface TenantUserSecurityTabProps {
  user: TenantUser;
}

function TenantUserSecurityTab({ user }: TenantUserSecurityTabProps) {
  const securityItems = [
    {
      icon: user.twoFactorEnabled ? ShieldCheck : ShieldX,
      label: "التحقق بخطوتين (2FA)",
      value: user.twoFactorEnabled ? "مفعل" : "غير مفعل",
      color: user.twoFactorEnabled ? "success" : "secondary",
    },
    {
      icon: KeyRound,
      label: "آخر تغيير لكلمة المرور",
      value: user.lastPasswordChange ? formatDate(user.lastPasswordChange) : "—",
      color: "default",
    },
    {
      icon: Mail,
      label: "البريد الاحتياطي",
      value: user.recoveryEmail ?? "غير محدد",
      color: "default",
    },
    {
      icon: Smartphone,
      label: "الأجهزة الموثوقة",
      value: "2 أجهزة", // mock
      color: "default",
    },
    {
      icon: LogIn,
      label: "الجلسات النشطة",
      value: "1 جلسة", // mock
      color: "default",
    },
    {
      icon: AlertTriangle,
      label: "محاولات تسجيل دخول فاشلة",
      value: "0 محاولة", // mock
      color: "default",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {securityItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-sm font-medium ${item.color === "success" ? "text-success" : ""} ${item.color === "destructive" ? "text-destructive" : ""}`}>
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning-foreground">توصيات أمنية</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {!user.twoFactorEnabled && (
                <li>· يُنصح بتفعيل التحقق بخطوتين (2FA) لتعزيز الأمان.</li>
              )}
              {!user.recoveryEmail && (
                <li>· يُنصح بإضافة بريد إلكتروني احتياطي لاستعادة الحساب.</li>
              )}
              {user.lastPasswordChange && (Date.now() - new Date(user.lastPasswordChange).getTime()) > 90 * 86400000 && (
                <li>· يُنصح بتغيير كلمة المرور حيث لم يتم تغييرها منذ أكثر من 90 يوماً.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TenantUserSecurityTab };
