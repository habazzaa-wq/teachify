"use client";

import { AppWidget, AppButton } from "@/components/ui";
import { Plus, Upload, Users, Bell, Send, FileText } from "lucide-react";
import Link from "next/link";
import { routes } from "@/constants/routes";
import { useCan } from "@/hooks";

const actions = [
  {
    label: "مساق جديد",
    icon: Plus,
    href: "/courses/new",
    color: "bg-primary/10 text-primary",
    permission: "courses.create",
  },
  {
    label: "رفع محتوى",
    icon: Upload,
    href: "/content/upload",
    color: "bg-success/10 text-success",
    permission: "content.create",
  },
  {
    label: "دعوة طلاب",
    icon: Users,
    href: "/students/invite",
    color: "bg-info/10 text-info",
    permission: "students.create",
  },
  {
    label: "إرسال إشعار",
    icon: Send,
    href: "/notifications/send",
    color: "bg-warning/10 text-warning",
    permission: "notifications.send",
  },
  {
    label: "تقرير جديد",
    icon: FileText,
    href: "/analytics/reports",
    color: "bg-destructive/10 text-destructive",
    permission: "analytics.view",
  },
];

export function QuickActions() {
  return (
    <AppWidget title="إجراءات سريعة">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const allowed = useCan(action.permission);
          if (!allowed) return null;

          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/50 p-4 text-center transition-all hover:border-border hover:shadow-sm hover:-translate-y-0.5"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </AppWidget>
  );
}
