"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { AppTooltip, AppTooltipContent, AppTooltipTrigger } from "./AppTooltip";

interface AppSidebarItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  collapsed?: boolean;
  badge?: number;
  disabled?: boolean;
  onClick?: () => void;
}

const AppSidebarItem = React.forwardRef<HTMLAnchorElement, AppSidebarItemProps>(
  ({ href, label, icon: Icon, active, collapsed, badge, disabled, onClick }, ref) => {
    const content = (
      <Link
        ref={ref}
        href={disabled ? "#" : href}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          collapsed && "justify-center px-2",
          active
            ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary before:absolute before:end-0 before:top-1/2 before:h-5/6 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary before:shadow-sm before:shadow-primary/40"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          disabled && "pointer-events-none opacity-50",
        )}
        aria-current={active ? "page" : undefined}
      >
        <Icon className={cn("h-5 w-5 shrink-0 transition-transform", active && "scale-110")} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge !== undefined && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                {badge}
              </span>
            )}
          </>
        )}
        {collapsed && badge !== undefined && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground">
            {badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <AppTooltip>
          <AppTooltipTrigger asChild>
            {content}
          </AppTooltipTrigger>
          <AppTooltipContent side="right" sideOffset={8}>
            <p>{label}{badge ? ` (${badge})` : ""}</p>
          </AppTooltipContent>
        </AppTooltip>
      );
    }

    return content;
  },
);
AppSidebarItem.displayName = "AppSidebarItem";

export { AppSidebarItem, type AppSidebarItemProps };
