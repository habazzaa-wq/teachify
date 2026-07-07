"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import {
  AppButton,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppDrawer,
  AppAvatar,
  AppAvatarFallback,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/lib/format";
import { useTenantUser, useTenantUserActivities, useTenantUserDevices, useTenantUserSessions } from "../hooks";
import { TenantUserOverviewTab } from "./TenantUserOverviewTab";
import { TenantUserActivityTab } from "./TenantUserActivityTab";
import { TenantUserDevicesTab } from "./TenantUserDevicesTab";
import { TenantUserSessionsTab } from "./TenantUserSessionsTab";
import { TenantUserSecurityTab } from "./TenantUserSecurityTab";
import { TenantUserNotesTab } from "./TenantUserNotesTab";

interface TenantUserDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onRevokeSession?: (userId: string, sessionId: string) => void;
  onToggleTrustDevice?: (userId: string, deviceId: string, trusted: boolean) => void;
}

const TABS = [
  { value: "overview", label: "نظرة عامة" },
  { value: "activity", label: "النشاطات" },
  { value: "devices", label: "الأجهزة" },
  { value: "sessions", label: "الجلسات" },
  { value: "security", label: "الأمان" },
  { value: "notes", label: "ملاحظات" },
];

function TenantUserDetailsDrawer({
  open,
  onOpenChange,
  userId,
  onRevokeSession,
  onToggleTrustDevice,
}: TenantUserDetailsDrawerProps) {
  const { data: user, isLoading } = useTenantUser(userId);
  const { data: activities, isLoading: activitiesLoading } = useTenantUserActivities(open ? userId : null);
  const { data: devices, isLoading: devicesLoading } = useTenantUserDevices(open ? userId : null);
  const { data: sessions, isLoading: sessionsLoading } = useTenantUserSessions(open ? userId : null);
  const [activeTab, setActiveTab] = useState("overview");
  const [emailCopied, setEmailCopied] = useState(false);
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

  const copyEmail = useCallback(() => {
    if (!user) return;
    navigator.clipboard.writeText(user.email);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }, [user]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleRevoke = useCallback((sessionId: string) => {
    if (userId && onRevokeSession) {
      onRevokeSession(userId, sessionId);
    }
  }, [userId, onRevokeSession]);

  const handleToggleTrust = useCallback((deviceId: string, trusted: boolean) => {
    if (userId && onToggleTrustDevice) {
      onToggleTrustDevice(userId, deviceId, trusted);
    }
  }, [userId, onToggleTrustDevice]);

  if (!user && isLoading) {
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

  const drawerTitle = user?.fullName || "تفاصيل المستخدم";

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
            <AppAvatar className="h-9 w-9">
              <AppAvatarFallback>{initialsOf(user?.fullName)}</AppAvatarFallback>
            </AppAvatar>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight truncate">
                {drawerTitle}
              </h2>
              <p className="text-xs text-muted-foreground">{user?.jobTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {user && (
              <button
                onClick={copyEmail}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="نسخ البريد"
                title={user.email}
              >
                {emailCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
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
          {user && (
            <div className="p-6">
              {(activeTab === "overview" || mountedTabs.has("overview")) && (
                <div style={{ display: activeTab === "overview" ? "block" : "none" }}>
                  <TenantUserOverviewTab user={user} />
                </div>
              )}
              {(activeTab === "activity" || mountedTabs.has("activity")) && (
                <div style={{ display: activeTab === "activity" ? "block" : "none" }}>
                  <TenantUserActivityTab activities={activities} loading={activitiesLoading} />
                </div>
              )}
              {(activeTab === "devices" || mountedTabs.has("devices")) && (
                <div style={{ display: activeTab === "devices" ? "block" : "none" }}>
                  <TenantUserDevicesTab devices={devices} loading={devicesLoading} onToggleTrust={handleToggleTrust} />
                </div>
              )}
              {(activeTab === "sessions" || mountedTabs.has("sessions")) && (
                <div style={{ display: activeTab === "sessions" ? "block" : "none" }}>
                  <TenantUserSessionsTab sessions={sessions} loading={sessionsLoading} onRevoke={handleRevoke} />
                </div>
              )}
              {(activeTab === "security" || mountedTabs.has("security")) && (
                <div style={{ display: activeTab === "security" ? "block" : "none" }}>
                  <TenantUserSecurityTab user={user} />
                </div>
              )}
              {(activeTab === "notes" || mountedTabs.has("notes")) && (
                <div style={{ display: activeTab === "notes" ? "block" : "none" }}>
                  <TenantUserNotesTab user={user} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppDrawer>
  );
}

export { TenantUserDetailsDrawer };
