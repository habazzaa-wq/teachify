"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Search,
  Command,
  GraduationCap,
  BookOpen,
  Users,
  FolderOpen,
  MessagesSquare,
  Bell,
  BarChart3,
  Calendar,
  Award,
  Activity,
  ScrollText,
  Settings,
  UserCircle,
  HelpCircle,
  Table2,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useLogout } from "@/hooks/useAuthMutations";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useTenantStore } from "@/stores/tenant.store";
import { usePermissions } from "@/hooks/usePermissions";
import { useFeatureFlags } from "@/hooks/useFeatureFlag";
import { cn } from "@/lib/cn";
import {
  AppAvatar,
  AppAvatarFallback,
  ChevronStartIcon,
  ChevronEndIcon,
  AppBadge,
  AppTooltip,
  AppTooltipContent,
  AppTooltipTrigger,
} from "@/components/ui";
import { initialsOf } from "@/lib/format";
import { routes } from "@/constants/routes";

interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: string | null;
  featureFlag?: string;
  badge?: number;
  disabled?: boolean;
}

interface NavSection {
  label: string;
  items: NavItemConfig[];
}

const ALL_SECTIONS: NavSection[] = [
  {
    label: "الرئيسية",
    items: [
      { label: "لوحة القيادة", href: routes.dashboard, icon: LayoutDashboard, permission: null },
      { label: "التحليلات", href: routes.dashboardAnalytics, icon: BarChart3, permission: "analytics.view", featureFlag: "analytics" },
      { label: "التقويم", href: routes.dashboardCalendar, icon: Calendar, permission: null },
    ],
  },
  {
    label: "التعليم",
    items: [
      { label: "المساقات", href: routes.dashboardCourses, icon: BookOpen, permission: "courses.view", featureFlag: "courses" },
      { label: "الأقسام", href: routes.dashboardSections, icon: Layers, permission: "sections.view", featureFlag: "courses" },
      { label: "الدروس", href: routes.dashboardLessons, icon: GraduationCap, permission: "lessons.view", featureFlag: "courses" },
      { label: "التصنيفات", href: routes.dashboardCategories, icon: FolderOpen, permission: "categories.view" },
      { label: "المناقشات", href: routes.dashboardDiscussions, icon: MessagesSquare, permission: "discussions.view" },
      { label: "الشهادات", href: routes.dashboardCertificates, icon: Award, permission: "certificates.view", featureFlag: "certificates" },
    ],
  },
  {
    label: "الوسائط",
    items: [
      { label: "مكتبة الوسائط", href: routes.dashboardMedia, icon: FolderOpen, permission: "media.view" },
    ],
  },
  {
    label: "الأعضاء",
    items: [
      { label: "الطلاب", href: routes.dashboardStudents, icon: Users, permission: "students.view", featureFlag: "users" },
    ],
  },
  {
    label: "النظام",
    items: [
      { label: "الإشعارات", href: routes.dashboardNotifications, icon: Bell, permission: null },
      { label: "سجل النشاطات", href: routes.dashboardActivityLog, icon: Activity, permission: null },
      { label: "سجل التدقيق", href: routes.dashboardAuditLog, icon: ScrollText, permission: "audit.view" },
      { label: "الملف الشخصي", href: routes.dashboardProfile, icon: UserCircle, permission: null },
      { label: "الإعدادات", href: routes.dashboardSettings, icon: Settings, permission: "tenant.manage" },
      { label: "مصفوفة الصلاحيات", href: routes.dashboardRolePermissionMatrix, icon: Table2, permission: null },
      { label: "المساعدة", href: routes.dashboardHelp, icon: HelpCircle, permission: null },
    ],
  },
];

function useFilteredSections(): NavSection[] {
  const { hasPermission } = usePermissions();
  const flags = useFeatureFlags();

  return useMemo(() => {
    return ALL_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.permission !== null && !hasPermission(item.permission)) return false;
          if (item.featureFlag && flags[item.featureFlag] === false) return false;
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [hasPermission, flags]);
}

interface TenantSidebarProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

function TenantSidebar({ variant = "desktop", onNavigate }: TenantSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const logout = useLogout();
  const { tenant } = useActiveTenant();
  const branding = useTenantStore((state) => state.branding);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isCollapsed = collapsed && !hovered && variant === "desktop";
  const showLabels = !isCollapsed;
  const sections = useFilteredSections();

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const isActive = useCallback(
    (href: string) => {
      if (href === routes.dashboard || href === routes.tenantDashboard) {
        return pathname === href;
      }
      return pathname === href || pathname?.startsWith(`${href}/`);
    },
    [pathname],
  );

  const tenantLogo = branding?.logo || branding?.lightLogo;
  const tenantName = tenant?.name ?? "الأكاديمية";

  return (
    <aside
      dir="rtl"
      className={cn(
        "flex h-full flex-col border-s border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[68px]" : "w-64",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
          {tenantLogo ? (
            <img src={tenantLogo} alt={tenantName} className="h-6 w-6 rounded object-contain" />
          ) : (
            <GraduationCap className="h-5 w-5" />
          )}
        </div>
        {showLabels && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold tracking-tight">{tenantName}</span>
            <div className="flex items-center gap-1">
              <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                {tenant?.slug ?? ""}
              </span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <AppBadge variant="secondary" className="h-4 px-1 text-[8px] font-medium">
                {tenant?.status === "trial" ? "تجريبي" : tenant?.status === "active" ? "نشط" : tenant?.status ?? ""}
              </AppBadge>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className={cn("px-3 pt-4", isCollapsed && "px-2")}>
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-all hover:border-border hover:bg-muted",
            isCollapsed && "justify-center px-0",
          )}
          aria-label="بحث"
        >
          <Search className="h-4 w-4 shrink-0" />
          {showLabels && (
            <>
              <span className="flex-1 text-start">بحث...</span>
              <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70 md:inline-flex items-center gap-0.5">
                <Command className="h-3 w-3" />K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            {showLabels && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      {variant === "desktop" && (
        <button
          onClick={toggleCollapsed}
          className="mx-2 mb-2 flex items-center justify-center rounded-lg py-1.5 text-muted-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
        >
          {isCollapsed ? (
            <ChevronStartIcon className="h-4 w-4" />
          ) : (
            <ChevronEndIcon className="h-4 w-4" />
          )}
          {showLabels && (
            <span className="me-2 text-xs">{isCollapsed ? "توسيع" : "طي"}</span>
          )}
        </button>
      )}

      {/* User profile */}
      <div className={cn("border-t border-sidebar-border p-3", isCollapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent",
            isCollapsed && "justify-center p-1.5",
          )}
        >
          <div className="relative shrink-0">
            <AppAvatar className="h-8 w-8 ring-2 ring-sidebar-border">
              <AppAvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initialsOf(user?.name)}
              </AppAvatarFallback>
            </AppAvatar>
            <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-success" />
          </div>
          {showLabels && (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold leading-tight">{user?.name}</span>
              <span className="truncate text-[10px] text-muted-foreground">{user?.email}</span>
            </div>
          )}
          {showLabels && (
            <button
              onClick={() => logout.mutate()}
              className="flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

interface SidebarNavItemProps {
  item: NavItemConfig;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

function SidebarNavItem({ item, active, collapsed, onNavigate }: SidebarNavItemProps) {
  const content = (
    <li>
      <Link
        href={item.disabled ? "#" : item.href}
        onClick={item.disabled ? (e) => e.preventDefault() : onNavigate}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          collapsed && "justify-center px-2",
          active
            ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary before:absolute before:end-0 before:top-1/2 before:h-5/6 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary before:shadow-sm before:shadow-primary/40"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          item.disabled && "pointer-events-none opacity-50",
        )}
        aria-current={active ? "page" : undefined}
      >
        <item.icon className={cn("h-5 w-5 shrink-0 transition-transform", active && "scale-110")} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );

  if (collapsed) {
    return (
      <AppTooltip>
        <AppTooltipTrigger asChild>{content}</AppTooltipTrigger>
        <AppTooltipContent side="right" sideOffset={8}>
          <p>{item.label}</p>
        </AppTooltipContent>
      </AppTooltip>
    );
  }

  return content;
}

export { TenantSidebar };
