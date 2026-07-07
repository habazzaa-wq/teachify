"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { GraduationCap } from "lucide-react";
import { dashboardNav } from "@/constants/navigation";
import { useCan } from "@/hooks/useCan";
import { useUiStore } from "@/stores/ui.store";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { cn } from "@/lib/cn";
import { routes } from "@/constants/routes";

interface SidebarProps {
  /** On mobile, render inside a drawer instead of a fixed column. */
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

/**
 * Right-aligned dashboard navigation. Visibility is driven entirely by
 * permissions via useCan — never by role names. The sidebar is fixed to the
 * right in RTL layouts.
 */
function Sidebar({ variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const { tenant } = useActiveTenant();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-s border-sidebar-border bg-sidebar text-sidebar-foreground",
        collapsed && variant === "desktop" ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!collapsed || variant === "mobile" ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {tenant?.name ?? "أكاديميتي"}
            </p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <ul className="space-y-1">
          {dashboardNav.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={t(item.labelKey.replace("nav.", ""))}
              icon={item.icon}
              permission={item.permission}
              collapsed={collapsed && variant === "desktop"}
              active={isActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

interface SidebarItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string | null;
  collapsed: boolean;
  active: boolean;
  onNavigate?: () => void;
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  permission,
  collapsed,
  active,
  onNavigate,
}: SidebarItemProps) {
  const allowed = useCan(permission);

  if (!allowed) {
    return null;
  }

  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-foreground",
          collapsed && "justify-center",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed ? <span className="truncate">{label}</span> : null}
      </Link>
    </li>
  );
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }

  if (href === routes.dashboard) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export { Sidebar };
