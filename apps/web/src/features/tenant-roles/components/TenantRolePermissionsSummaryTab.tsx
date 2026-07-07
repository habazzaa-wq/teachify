"use client";

import { Key, Shield, UserCheck, BookOpen, Settings, BarChart, Mail, HeartHandshake, DollarSign, Headphones, Star } from "lucide-react";
import { AppBadge } from "@/components/ui";
import type { TenantRole } from "../types";

interface TenantRolePermissionsSummaryTabProps {
  role: TenantRole;
}

const PLACEHOLDER_MODULES = [
  { name: "لوحة القيادة", icon: BarChart, permissionCount: 5, accessLevel: "كامل" },
  { name: "المستخدمون", icon: UserCheck, permissionCount: 8, accessLevel: "كامل" },
  { name: "الأدوار والصلاحيات", icon: Shield, permissionCount: 6, accessLevel: "كامل" },
  { name: "المحتوى التعليمي", icon: BookOpen, permissionCount: 12, accessLevel: "محدود" },
  { name: "الإعدادات", icon: Settings, permissionCount: 10, accessLevel: "كامل" },
  { name: "التقارير", icon: BarChart, permissionCount: 4, accessLevel: "قراءة فقط" },
  { name: "التسويق", icon: Star, permissionCount: 6, accessLevel: "محدود" },
  { name: "المبيعات", icon: DollarSign, permissionCount: 5, accessLevel: "محدود" },
  { name: "الدعم", icon: Headphones, permissionCount: 3, accessLevel: "كامل" },
  { name: "شؤون الطلاب", icon: HeartHandshake, permissionCount: 7, accessLevel: "محدود" },
  { name: "البريد الإلكتروني", icon: Mail, permissionCount: 4, accessLevel: "محدود" },
];

const accessColorMap: Record<string, string> = {
  "كامل": "success",
  "محدود": "warning",
  "قراءة فقط": "secondary",
};

function TenantRolePermissionsSummaryTab({ role }: TenantRolePermissionsSummaryTabProps) {
  const totalPermissionCount = PLACEHOLDER_MODULES.reduce((acc, m) => acc + m.permissionCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="rounded-lg border bg-card px-4 py-2">
          <p className="text-xs text-muted-foreground">إجمالي الصلاحيات</p>
          <p className="text-lg font-semibold">{role.permissionsCount}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-2">
          <p className="text-xs text-muted-foreground">الوحدات النمطية</p>
          <p className="text-lg font-semibold">{PLACEHOLDER_MODULES.length}</p>
        </div>
      </div>

      <div className="rounded-lg border divide-y">
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground">
          <div className="flex-1">الوحدة النمطية</div>
          <div className="w-24 text-center">عدد الصلاحيات</div>
          <div className="w-24 text-center">مستوى الوصول</div>
        </div>
        {PLACEHOLDER_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <div key={mod.name} className="flex items-center gap-4 px-4 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">{mod.name}</span>
              </div>
              <div className="w-24 text-center text-sm tabular-nums text-muted-foreground">
                {mod.permissionCount}
              </div>
              <div className="w-24 text-center">
                <AppBadge
                  variant={(accessColorMap[mod.accessLevel] || "secondary") as "success" | "secondary" | "warning"}
                  className="text-[10px]"
                >
                  {mod.accessLevel}
                </AppBadge>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        هذه البيانات نموذجية — سيتم تفعيل إدارة الصلاحيات في الوحدة القادمة
      </p>
    </div>
  );
}

export { TenantRolePermissionsSummaryTab };
