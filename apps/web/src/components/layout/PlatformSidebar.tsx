"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  ScrollText,
  Activity,
  Bell,
  Settings,
  LogOut,
  Search,
  Command,
  Star,
  Package,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { usePlatformAuth } from "@/providers/PlatformAuthProvider";
import { usePlatformLogout } from "@/hooks/usePlatformAuthMutations";
import { cn } from "@/lib/cn";
import { AppAvatar, AppAvatarFallback, ChevronStartIcon, ChevronEndIcon, AppSidebarItem, AppSidebarSection } from "@/components/ui";
import { initialsOf } from "@/lib/format";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { label: "لوحة القيادة", href: "/superadmin/dashboard", icon: LayoutDashboard },
  { label: "المشرفون", href: "/superadmin/admins", icon: Users },
  { label: "الصلاحيات", href: "/superadmin/roles", icon: ShieldCheck },
];

const customerNav: NavItem[] = [
  { label: "العملاء", href: "/superadmin/dashboard/tenants", icon: Building2 },
];

const platformNav: NavItem[] = [
  { label: "الباقات", href: "/superadmin/dashboard/plans", icon: Package },
  { label: "إدارة النطاقات", href: "/superadmin/dashboard/domains", icon: Globe },
];

const systemNav: NavItem[] = [
  { label: "سجل التدقيق", href: "/superadmin/audit", icon: ScrollText },
  { label: "النشاطات", href: "/superadmin/activity", icon: Activity },
  { label: "الإشعارات", href: "/superadmin/notifications", icon: Bell },
  { label: "الإعدادات", href: "/superadmin/settings", icon: Settings },
];

interface PlatformSidebarProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

function PlatformSidebar({ variant = "desktop", onNavigate }: PlatformSidebarProps) {
  const pathname = usePathname();
  const { user } = usePlatformAuth();
  const logout = usePlatformLogout();
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isCollapsed = collapsed && !hovered && variant === "desktop";
  const showLabels = !isCollapsed;

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const isActive = (href: string) =>
    href === "/superadmin/dashboard"
      ? pathname === href
      : pathname?.startsWith(href);

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
          <ShieldCheck className="h-5 w-5" />
        </div>
        {showLabels && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold tracking-tight">منصة</span>
            <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">super admin</span>
          </div>
        )}
      </div>

      {/* Search shortcut */}
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
                <Command className="h-3 w-3" />
                K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-4">
        <AppSidebarSection label="الرئيسية" collapsed={isCollapsed}>
          {mainNav.map((item) => (
            <AppSidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={isCollapsed}
              onClick={onNavigate}
            />
          ))}
        </AppSidebarSection>

        <AppSidebarSection label="إدارة العملاء" collapsed={isCollapsed}>
          {customerNav.map((item) => (
            <AppSidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={isCollapsed}
              onClick={onNavigate}
            />
          ))}
        </AppSidebarSection>

        <AppSidebarSection label="إدارة المنصة" collapsed={isCollapsed}>
          {platformNav.map((item) => (
            <AppSidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={isCollapsed}
              onClick={onNavigate}
            />
          ))}
        </AppSidebarSection>

        <AppSidebarSection label="النظام" collapsed={isCollapsed}>
          {systemNav.map((item) => (
            <AppSidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={isCollapsed}
              onClick={onNavigate}
            />
          ))}
        </AppSidebarSection>
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
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent",
          isCollapsed && "justify-center p-1.5",
        )}>
          <AppAvatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-border">
            <AppAvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initialsOf(user?.name)}
            </AppAvatarFallback>
          </AppAvatar>
          {showLabels && (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold leading-tight">{user?.name}</span>
              <span className="truncate text-[11px] text-muted-foreground">{user?.email}</span>
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

export { PlatformSidebar };
