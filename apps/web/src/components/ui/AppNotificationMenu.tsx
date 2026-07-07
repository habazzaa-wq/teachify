"use client";

import { Bell, CheckCheck, Settings, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppButton } from "./AppButton";
import { AppBadge } from "./AppBadge";
import { AppAvatar, AppAvatarFallback } from "./AppAvatar";
import {
  AppDropdownMenu,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuLabel,
  AppDropdownMenuSeparator,
  AppDropdownMenuTrigger,
} from "./AppDropdown";

interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  initials?: string;
}

interface AppNotificationMenuProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
}

function AppNotificationMenu({
  notifications,
  unreadCount,
  onMarkAllRead,
  onViewAll,
}: AppNotificationMenuProps) {
  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <AppButton variant="ghost" size="icon" className="relative" aria-label="الإشعارات">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute end-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
          )}
        </AppButton>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="start" className="w-80" sideOffset={8}>
        <AppDropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">الإشعارات</span>
            {unreadCount > 0 && (
              <AppBadge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {unreadCount}
              </AppBadge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3" />
              تحديد الكل مقروء
            </button>
          )}
        </AppDropdownMenuLabel>
        <AppDropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="mb-2 h-8 w-8 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">
              لا توجد إشعارات
            </p>
            <p className="text-xs text-muted-foreground/60">
              ستظهر الإشعارات الجديدة هنا
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.slice(0, 8).map((notification) => (
              <button
                key={notification.id}
                className={cn(
                  "flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/50",
                  !notification.read && "bg-primary/[0.02]",
                )}
              >
                <AppAvatar className="h-9 w-9 shrink-0">
                  {notification.initials && (
                    <AppAvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {notification.initials}
                    </AppAvatarFallback>
                  )}
                </AppAvatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {notification.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notification.description}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    {notification.timestamp}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <>
            <AppDropdownMenuSeparator />
            <AppDropdownMenuItem onClick={onViewAll} className="justify-center gap-2 text-xs font-medium">
              <ExternalLink className="h-3.5 w-3.5" />
              عرض جميع الإشعارات
            </AppDropdownMenuItem>
          </>
        )}
      </AppDropdownMenuContent>
    </AppDropdownMenu>
  );
}

export { AppNotificationMenu, type AppNotificationMenuProps, type NotificationItem };
