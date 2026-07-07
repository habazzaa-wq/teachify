export interface DashboardStats {
  today_revenue: number;
  revenue_trend: number;
  students_count: number;
  students_trend: number;
  courses_count: number;
  courses_trend: number;
  active_users: number;
  active_users_trend: number;
  storage_used: number;
  storage_total: number;
  bandwidth_used: number;
  bandwidth_total: number;
  video_used: number;
  video_total: number;
  subscription_progress: number;
  subscription_days_left: number;
  trial_days_remaining: number;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  description: string;
  user: { name: string; avatar?: string };
  timestamp: string;
  type: "course" | "student" | "payment" | "system" | "notification";
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: "metric" | "chart" | "list" | "progress" | "usage";
  permission?: string;
  featureFlag?: string;
  order: number;
  component: string;
}

export interface DashboardConfig {
  widgets: DashboardWidget[];
  layout: Record<string, { x: number; y: number; w: number; h: number }>;
}
