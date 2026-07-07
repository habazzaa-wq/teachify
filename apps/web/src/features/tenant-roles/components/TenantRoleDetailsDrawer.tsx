"use client";

import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import {
  AppButton,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppDrawer,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { useTenantRole, useRoleUsers, useRoleActivities } from "../hooks";
import { TenantRoleOverviewTab } from "./TenantRoleOverviewTab";
import { TenantRoleUsersTab } from "./TenantRoleUsersTab";
import { TenantRolePermissionsSummaryTab } from "./TenantRolePermissionsSummaryTab";
import { TenantRoleActivityTab } from "./TenantRoleActivityTab";
import { TenantRoleNotesTab } from "./TenantRoleNotesTab";

interface TenantRoleDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string | null;
}

const TABS = [
  { value: "overview", label: "نظرة عامة" },
  { value: "users", label: "المستخدمون" },
  { value: "permissions", label: "الصلاحيات" },
  { value: "activity", label: "النشاطات" },
  { value: "notes", label: "ملاحظات" },
];

function TenantRoleDetailsDrawer({
  open,
  onOpenChange,
  roleId,
}: TenantRoleDetailsDrawerProps) {
  const { data: role, isLoading } = useTenantRole(roleId);
  const { data: users, isLoading: usersLoading } = useRoleUsers(open ? roleId : null);
  const { data: activities, isLoading: activitiesLoading } = useRoleActivities(open ? roleId : null);
  const [activeTab, setActiveTab] = useState("overview");
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(["overview"]));

  useEffect(() => {
    if (open) {
      setActiveTab("overview");
      setMountedTabs(new Set(["overview"]));
    }
  }, [open]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setMountedTabs((prev) => new Set(prev).add(value));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!role && isLoading) {
    return (
      <AppDrawer open={open} onOpenChange={onOpenChange} side="end" className="w-full sm:max-w-[80vw] lg:max-w-[900px] xl:max-w-[960px]">
        <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
          <header className="flex items-center justify-between border-b px-6 py-4 shrink-0">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </header>
          <div className="flex-1 p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </AppDrawer>
    );
  }

  const drawerTitle = role?.nameAr || "تفاصيل الدور";

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[80vw] lg:max-w-[900px] xl:max-w-[960px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label={drawerTitle}>
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${role?.color}1a`, color: role?.color }}
            >
              {role?.icon && <span className="text-lg">{role.icon === "Crown" ? "👑" : role.icon === "ShieldCheck" ? "🛡️" : role.icon === "UserCog" ? "⚙️" : role.icon === "GraduationCap" ? "🎓" : role.icon === "Headphones" ? "🎧" : role.icon === "BookOpen" ? "📖" : role.icon === "ChartBar" ? "📊" : role.icon === "Star" ? "⭐" : role.icon === "HeartHandshake" ? "🤝" : role.icon === "Key" ? "🔑" : role.icon === "Settings" ? "🔧" : "🛡️"}</span>}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight truncate">
                {drawerTitle}
              </h2>
              <p className="text-xs text-muted-foreground">{role?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b bg-background z-10">
          <div className="px-6 overflow-x-auto scrollbar-thin">
            <AppTabs value={activeTab} onValueChange={handleTabChange}>
              <AppTabsList className="flex h-auto gap-0 bg-transparent p-0 w-full border-0">
                {TABS.map((tab) => (
                  <AppTabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                      "bg-transparent shadow-none rounded-none",
                      "hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      "data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                      "data-[state=inactive]:text-muted-foreground",
                      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all after:duration-200",
                      "data-[state=active]:after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100",
                      "data-[state=inactive]:hover:after:bg-muted-foreground/20 data-[state=inactive]:hover:after:scale-x-100",
                    )}
                  >
                    {tab.label}
                  </AppTabsTrigger>
                ))}
              </AppTabsList>
            </AppTabs>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto min-h-0 bg-muted/10"
          style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin' }}
        >
          {role && (
            <div className="p-6">
              {(activeTab === "overview" || mountedTabs.has("overview")) && (
                <div style={{ display: activeTab === "overview" ? "block" : "none" }}>
                  <TenantRoleOverviewTab role={role} />
                </div>
              )}
              {(activeTab === "users" || mountedTabs.has("users")) && (
                <div style={{ display: activeTab === "users" ? "block" : "none" }}>
                  <TenantRoleUsersTab users={users} loading={usersLoading} />
                </div>
              )}
              {(activeTab === "permissions" || mountedTabs.has("permissions")) && (
                <div style={{ display: activeTab === "permissions" ? "block" : "none" }}>
                  <TenantRolePermissionsSummaryTab role={role} />
                </div>
              )}
              {(activeTab === "activity" || mountedTabs.has("activity")) && (
                <div style={{ display: activeTab === "activity" ? "block" : "none" }}>
                  <TenantRoleActivityTab activities={activities} loading={activitiesLoading} />
                </div>
              )}
              {(activeTab === "notes" || mountedTabs.has("notes")) && (
                <div style={{ display: activeTab === "notes" ? "block" : "none" }}>
                  <TenantRoleNotesTab role={role} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppDrawer>
  );
}

export { TenantRoleDetailsDrawer };
