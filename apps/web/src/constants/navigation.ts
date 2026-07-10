import {
  LayoutDashboard,
  BookOpen,
  Users,
  FolderOpen,
  MessagesSquare,
  Bell,
  BarChart3,
  Award,
  Activity,
  ScrollText,
  Settings,
  Calendar,
  UserCircle,
  HelpCircle,
  GraduationCap,
  Images,
  type LucideIcon,
} from "lucide-react";
import { routes } from "./routes";

export const permissions = {
  dashboardView: null,
  coursesView: "courses.view",
  sectionsView: "sections.view",
  lessonsView: "lessons.view",
  studentsView: "students.view",
  contentView: "content.view",
  discussionsView: "discussions.view",
  notificationsView: null,
  analyticsView: "analytics.view",
  certificatesView: "certificates.view",
  mediaView: "media.view",
  activityLogView: null,
  auditLogView: "audit.view",
  settingsView: "tenant.manage",
  calendarView: null,
  profileView: null,
  helpView: null,
} as const;

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  permission: string | null;
  featureFlag?: string;
  badge?: () => number;
  children?: Omit<NavItem, "children">[];
  hidden?: boolean;
  disabled?: boolean;
}

export const dashboardNav: readonly NavItem[] = [
  {
    labelKey: "nav.dashboard",
    href: routes.dashboard,
    icon: LayoutDashboard,
    permission: permissions.dashboardView,
  },
  {
    labelKey: "nav.courses",
    href: routes.dashboardCourses,
    icon: BookOpen,
    permission: permissions.coursesView,
    featureFlag: "courses",
  },
  {
    labelKey: "nav.students",
    href: routes.dashboardStudents,
    icon: Users,
    permission: permissions.studentsView,
    featureFlag: "users",
  },
  {
    labelKey: "nav.content",
    href: routes.dashboardContent,
    icon: FolderOpen,
    permission: permissions.contentView,
  },
  {
    labelKey: "nav.lessons",
    href: routes.dashboardLessons,
    icon: GraduationCap,
    permission: permissions.lessonsView,
  },
  {
    labelKey: "nav.discussions",
    href: routes.dashboardDiscussions,
    icon: MessagesSquare,
    permission: permissions.discussionsView,
  },
  {
    labelKey: "nav.notifications",
    href: routes.dashboardNotifications,
    icon: Bell,
    permission: permissions.notificationsView,
  },
  {
    labelKey: "nav.analytics",
    href: routes.dashboardAnalytics,
    icon: BarChart3,
    permission: permissions.analyticsView,
    featureFlag: "analytics",
  },
  {
    labelKey: "nav.calendar",
    href: routes.dashboardCalendar,
    icon: Calendar,
    permission: permissions.calendarView,
  },
  {
    labelKey: "nav.certificates",
    href: routes.dashboardCertificates,
    icon: Award,
    permission: permissions.certificatesView,
    featureFlag: "certificates",
  },
  {
    labelKey: "nav.media",
    href: routes.dashboardMedia,
    icon: Images,
    permission: permissions.mediaView,
  },
  {
    labelKey: "nav.activityLog",
    href: routes.dashboardActivityLog,
    icon: Activity,
    permission: permissions.activityLogView,
  },
  {
    labelKey: "nav.auditLog",
    href: routes.dashboardAuditLog,
    icon: ScrollText,
    permission: permissions.auditLogView,
  },
  {
    labelKey: "nav.profile",
    href: routes.dashboardProfile,
    icon: UserCircle,
    permission: permissions.profileView,
  },
  {
    labelKey: "nav.settings",
    href: routes.dashboardSettings,
    icon: Settings,
    permission: permissions.settingsView,
  },
  {
    labelKey: "nav.help",
    href: routes.dashboardHelp,
    icon: HelpCircle,
    permission: permissions.helpView,
  },
] as const;

export const SIDEBAR_SECTIONS = [
  {
    label: "main",
    items: ["/teacher/dashboard", "/teacher/analytics", "/teacher/calendar"],
  },
  {
    label: "teaching",
    items: ["/teacher/courses", "/teacher/lessons", "/teacher/content", "/teacher/discussions"],
    featureFlag: "courses",
  },
  {
    label: "people",
    items: ["/teacher/students"],
    featureFlag: "users",
  },
  {
    label: "system",
    items: ["/teacher/notifications", "/teacher/activity-log", "/teacher/audit-log", "/teacher/profile", "/teacher/settings", "/teacher/help"],
  },
] as const;
