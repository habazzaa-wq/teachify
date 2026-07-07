"use client";

import { useState, useCallback } from "react";
import { Moon, Sun, PanelRight, Command, User, Settings, LogOut, GraduationCap, Shield, Key, CreditCard, HelpCircle, Search, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useLogout } from "@/hooks/useAuthMutations";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useSubscription } from "@/hooks/useSubscription";
import { useTenantStore } from "@/stores/tenant.store";
import { useUiStore } from "@/stores/ui.store";
import {
  AppAvatar,
  AppAvatarFallback,
  AppButton,
  AppBadge,
  AppDropdownMenu,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuLabel,
  AppDropdownMenuSeparator,
  AppDropdownMenuTrigger,
  AppNotificationMenu,
  AppCommandPalette,
  AppBreadcrumb,
  type AppBreadcrumbItem,
} from "@/components/ui";
import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { routes } from "@/constants/routes";

interface TenantHeaderProps {
  title?: string;
  breadcrumbs?: AppBreadcrumbItem[];
}

const breadcrumbMap: Record<string, AppBreadcrumbItem[]> = {
  "/": [
    { label: "لوحة القيادة" },
  ],
  "/analytics": [
    { label: "لوحة القيادة", href: "/" },
    { label: "التحليلات" },
  ],
  "/calendar": [
    { label: "لوحة القيادة", href: "/" },
    { label: "التقويم" },
  ],
  "/notifications": [
    { label: "لوحة القيادة", href: "/" },
    { label: "الإشعارات" },
  ],
  "/profile": [
    { label: "لوحة القيادة", href: "/" },
    { label: "الملف الشخصي" },
  ],
  "/settings": [
    { label: "لوحة القيادة", href: "/" },
    { label: "الإعدادات" },
  ],
  "/help": [
    { label: "لوحة القيادة", href: "/" },
    { label: "المساعدة" },
  ],
  "/courses": [
    { label: "لوحة القيادة", href: "/" },
    { label: "المساقات" },
  ],
  "/students": [
    { label: "لوحة القيادة", href: "/" },
    { label: "الطلاب" },
  ],
};

function TenantHeader({ title, breadcrumbs }: TenantHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const logout = useLogout();
  const { tenant } = useActiveTenant();
  const sub = useSubscription();
  const branding = useTenantStore((state) => state.branding);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);
  const [commandOpen, setCommandOpen] = useState(false);

  const handleToggleCommand = useCallback(() => {
    setCommandOpen((prev) => !prev);
  }, []);

  const resolvedBreadcrumbs = breadcrumbs ?? breadcrumbMap[pathname] ?? [
    { label: tenant?.name ?? "لوحة القيادة" },
  ];

  const tenantLogo = branding?.logo || branding?.lightLogo;
  const tenantName = tenant?.name ?? "الأكاديمية";

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
        {/* Right side */}
        <div className="flex items-center gap-3">
          <AppButton
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="فتح القائمة"
          >
            <PanelRight className="h-5 w-5" />
          </AppButton>

          <div className="hidden md:flex items-center gap-2">
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="h-7 w-7 rounded-lg object-contain" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
            )}
          </div>

          {title && (
            <div className="flex items-center gap-2">
              <div className="h-5 w-px bg-border md:hidden" />
              <h1 className="text-base font-bold tracking-tight md:text-lg">{title}</h1>
            </div>
          )}

          <AppBreadcrumb items={resolvedBreadcrumbs} className="hidden md:flex" />
        </div>

        {/* Left side */}
        <div className="flex items-center gap-1">
          {/* Tenant info badge (desktop) */}
          <div className="hidden lg:flex items-center gap-2 me-2 ps-2 border-s border-border/40">
            <AppBadge variant="secondary" className="gap-1 px-2 py-0.5 text-[10px] font-medium">
              <GraduationCap className="h-3 w-3" />
              {sub.planName}
            </AppBadge>
            {sub.daysRemaining > 0 && sub.daysRemaining <= 30 && (
              <AppBadge
                variant={sub.daysRemaining <= 7 ? "destructive" : "warning"}
                className="px-2 py-0.5 text-[10px] font-medium"
              >
                {sub.daysRemaining} يوم متبقي
              </AppBadge>
            )}
          </div>

          {/* Search */}
          <AppButton
            variant="ghost"
            size="sm"
            onClick={handleToggleCommand}
            className="hidden gap-2 text-muted-foreground hover:text-foreground md:flex"
          >
            <Search className="h-4 w-4" />
            <span className="text-xs">بحث سريع</span>
            <kbd className="rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
              ⌘K
            </kbd>
          </AppButton>

          {/* Notification bell */}
          <AppNotificationMenu
            notifications={[]}
            unreadCount={0}
            onMarkAllRead={() => {}}
            onViewAll={() => {}}
          />

          {/* Theme toggle */}
          <AppButton
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </AppButton>

          {/* Profile dropdown */}
          <AppDropdownMenu>
            <AppDropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 outline-none transition-colors hover:bg-accent">
                <AppAvatar className="h-8 w-8 ring-2 ring-border ring-offset-2 ring-offset-background">
                  <AppAvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initialsOf(user?.name)}
                  </AppAvatarFallback>
                </AppAvatar>
                <div className="hidden md:block text-start">
                  <p className="text-sm font-medium leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{tenantName}</p>
                </div>
                <ChevronDown className="hidden md:block h-3 w-3 text-muted-foreground/60" />
              </button>
            </AppDropdownMenuTrigger>
            <AppDropdownMenuContent align="start" className="w-64" sideOffset={8}>
              <AppDropdownMenuLabel className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AppAvatar className="h-10 w-10">
                    <AppAvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {initialsOf(user?.name)}
                    </AppAvatarFallback>
                  </AppAvatar>
                  <div>
                    <span className="text-sm font-semibold">{user?.name}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <AppBadge variant="secondary" className="text-[10px]">
                    <GraduationCap className="h-3 w-3" />
                    {sub.planName}
                  </AppBadge>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                    </span>
                    متصل
                  </span>
                </div>
              </AppDropdownMenuLabel>
              <AppDropdownMenuSeparator />
              <AppDropdownMenuItem onClick={() => {}}>
                <User className="h-4 w-4" />
                الملف الشخصي
              </AppDropdownMenuItem>
              <AppDropdownMenuItem onClick={() => {}}>
                <Shield className="h-4 w-4" />
                الحساب والأمان
              </AppDropdownMenuItem>
              <AppDropdownMenuItem onClick={() => {}}>
                <Key className="h-4 w-4" />
                مفاتيح API
              </AppDropdownMenuItem>
              <AppDropdownMenuItem onClick={() => {}}>
                <CreditCard className="h-4 w-4" />
                الفوترة
              </AppDropdownMenuItem>
              <AppDropdownMenuSeparator />
              <AppDropdownMenuItem onClick={() => {}}>
                <HelpCircle className="h-4 w-4" />
                المساعدة
              </AppDropdownMenuItem>
              <AppDropdownMenuSeparator />
              <AppDropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => logout.mutate()}
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </AppDropdownMenuItem>
            </AppDropdownMenuContent>
          </AppDropdownMenu>
        </div>
      </header>

      {commandOpen && <AppCommandPalette />}
    </>
  );
}

export { TenantHeader };
