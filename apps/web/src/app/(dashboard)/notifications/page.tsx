"use client";

import { useState } from "react";
import { AppPageHeader, AppTabs, AppTabsList, AppTabsTrigger, AppTabsContent, AppWidget, AppEmptyState, AppBadge, AppButton } from "@/components/ui";
import { Bell, CheckCheck, Settings } from "lucide-react";
import { LatestNotifications, type NotificationItem } from "@/features/dashboard/components/LatestNotifications";

function NotificationsPage() {
  const [notifications] = useState<NotificationItem[]>([]);

  return (
    <div className="space-y-6 animate-fade-in-up">
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
            <LatestNotifications notifications={notifications} />
          </AppWidget>
          {notifications.length === 0 && (
            <div className="mt-4 text-center">
              <AppButton variant="outline" size="sm" disabled>
                تحميل المزيد
              </AppButton>
            </div>
          )}
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
