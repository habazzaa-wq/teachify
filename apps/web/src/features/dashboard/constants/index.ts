import {
  DollarSign,
  Users,
  BookOpen,
  Activity,
  HardDrive,
  Wifi,
  Video,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface DashboardMetricDef {
  key: string;
  label: string;
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "destructive" | "info";
  format?: "currency" | "number" | "percentage";
  permission?: string;
  featureFlag?: string;
}

export const DASHBOARD_METRICS: DashboardMetricDef[] = [
  {
    key: "today_revenue",
    label: "إيرادات اليوم",
    icon: DollarSign,
    color: "success",
    format: "currency",
    permission: "finance.view",
  },
  {
    key: "students_count",
    label: "الطلاب",
    icon: Users,
    color: "primary",
    format: "number",
    permission: "students.view",
  },
  {
    key: "courses_count",
    label: "المساقات",
    icon: BookOpen,
    color: "info",
    format: "number",
    permission: "courses.view",
  },
  {
    key: "active_users",
    label: "المستخدمون النشطون",
    icon: Activity,
    color: "warning",
    format: "number",
    permission: undefined,
  },
];

export const USAGE_METRICS = [
  {
    key: "storage_used",
    label: "مساحة التخزين",
    icon: HardDrive,
    color: "primary" as const,
    totalKey: "storage_total",
    unit: "GB",
  },
  {
    key: "bandwidth_used",
    label: "النطاق الترددي",
    icon: Wifi,
    color: "info" as const,
    totalKey: "bandwidth_total",
    unit: "GB",
  },
  {
    key: "video_used",
    label: "مساحة الفيديو",
    icon: Video,
    color: "warning" as const,
    totalKey: "video_total",
    unit: "GB",
  },
];

export const DASHBOARD_WIDGET_ORDER = [
  "metrics",
  "usage",
  "subscription",
  "activity",
  "notifications",
  "quick-actions",
] as const;
