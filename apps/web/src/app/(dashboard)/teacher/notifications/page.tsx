"use client";

import { useState } from "react";
import { AppPageHeader, AppTabs, AppTabsList, AppTabsTrigger, AppTabsContent, AppWidget, AppEmptyState, AppBadge, AppButton } from "@/components/ui";
import { Bell, CheckCheck, Settings } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  read: boolean;
  type?: "info" | "warning" | "success" | "error";
}

function NotificationsPage() {
  const [notifications] = useState<NotificationItem[]>([]);

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="الإشعارات"
        description="جميع الإشعارات والتنبيهات"
        actions={
          notifications.length > 0 ? (
            <AppButton variant="outline" size="sm">
              <CheckCheck className="h-4 w-4" />
              تحديد الكل مقروء
            </AppButton>
          ) : undefined
        }
      />

      <AppTabs defaultValue="all">
        <AppTabsList>
          <AppTabsTrigger value="all">
            الكل
            {notifications.length > 0 && (
              <AppBadge variant="secondary" className="me-1 h-5 px-1.5 text-[10px]">
                {notifications.length}
              </AppBadge>
            )}
          </AppTabsTrigger>
          <AppTabsTrigger value="unread">غير مقروء</AppTabsTrigger>
          <AppTabsTrigger value="settings">
            <Settings className="h-3.5 w-3.5" />
            الإعدادات
          </AppTabsTrigger>
        </AppTabsList>

        <AppTabsContent value="all" className="mt-6">
          <AppWidget variant="default">
            {notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AppEmptyState
                icon={Bell}
                title="لا توجد إشعارات"
                description="ستظهر الإشعارات الجديدة هنا"
              />
            )}
          </AppWidget>
        </AppTabsContent>

        <AppTabsContent value="unread" className="mt-6">
          <AppEmptyState
            icon={Bell}
            title="لا توجد إشعارات غير مقروءة"
            description="جميع الإشعارات مقروءة"
          />
        </AppTabsContent>

        <AppTabsContent value="settings" className="mt-6">
          <AppEmptyState
            icon={Settings}
            title="إعدادات الإشعارات"
            description="قم بتخصيص أنواع الإشعارات التي ترغب في تلقيها"
          />
        </AppTabsContent>
      </AppTabs>
    </div>
  );
}

export default NotificationsPage;
