"use client";

import { Mail, Phone, Globe, Building2, Briefcase, Calendar, Clock, ShieldCheck, ShieldX, Languages } from "lucide-react";
import { AppBadge } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { USER_STATUS_CONFIG, USER_ROLE_CONFIG, DEPARTMENT_CONFIG } from "../constants";
import type { TenantUser } from "../types";

interface TenantUserOverviewTabProps {
  user: TenantUser;
}

function TenantUserOverviewTab({ user }: TenantUserOverviewTabProps) {
  const statusConfig = USER_STATUS_CONFIG[user.status];
  const roleConfig = USER_ROLE_CONFIG[user.role.slug];
  const deptConfig = DEPARTMENT_CONFIG[user.department];

  const rows = [
    { icon: Mail, label: "البريد الإلكتروني", value: user.email },
    { icon: Phone, label: "رقم الهاتف", value: user.phone || "—" },
    { icon: Building2, label: "القسم", value: deptConfig.label },
    { icon: Briefcase, label: "المسمى الوظيفي", value: user.jobTitle },
    { icon: Globe, label: "المنطقة الزمنية", value: user.timezone },
    { icon: Languages, label: "اللغة", value: user.language === "ar" ? "العربية" : user.language === "en" ? "English" : user.language === "fr" ? "Français" : user.language },
    { icon: Clock, label: "آخر تسجيل دخول", value: user.lastLogin ? formatDateTime(user.lastLogin) : "—" },
    { icon: Calendar, label: "تاريخ الإنشاء", value: formatDate(user.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <AppBadge variant={statusConfig.color as "success" | "secondary" | "destructive"}>
          {statusConfig.label}
        </AppBadge>
        <AppBadge variant={roleConfig.color as "default" | "secondary" | "destructive" | "success" | "warning" | "outline"}>
          {roleConfig.label}
        </AppBadge>
        {user.twoFactorEnabled ? (
          <AppBadge variant="success">
            <ShieldCheck className="h-3 w-3" />
            2FA مفعل
          </AppBadge>
        ) : (
          <AppBadge variant="secondary">
            <ShieldX className="h-3 w-3" />
            2FA غير مفعل
          </AppBadge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium truncate">{row.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {user.notes && (
        <div className="rounded-lg border p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">ملاحظات</h4>
          <p className="text-sm">{user.notes}</p>
        </div>
      )}
    </div>
  );
}

export { TenantUserOverviewTab };
