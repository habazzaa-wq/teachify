"use client";

import { useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useEnrolledCourses } from "@/features/course-catalog/hooks";
import type { NotificationItem } from "@/types/notification.types";
import { AppNotificationMenu, type NotificationItem as MenuItem } from "./AppNotificationMenu";

/** Only newly published sessions are surfaced in the student navbar. */
const SESSION_PUBLISHED_TYPE = "session.scheduled";

function formatTimestamp(value?: string | null): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function sessionCourseId(notification: NotificationItem): string | null {
  const data = notification.data as { course_id?: unknown } | null;
  if (data?.course_id === null || data?.course_id === undefined) return null;
  return String(data.course_id);
}

export function AppNotificationBellLive({ enabled = true }: { enabled?: boolean }) {
  const { unread, all, markRead } = useNotifications("session.", enabled);
  const { data: enrolledCourses } = useEnrolledCourses();

  const enrolledCourseIds = useMemo(
    () => new Set((enrolledCourses ?? []).map((course) => String(course.id))),
    [enrolledCourses],
  );

  const isRelevant = useMemo(() => {
    return (notification: NotificationItem): boolean => {
      if (notification.type !== SESSION_PUBLISHED_TYPE) return false;
      if (notification.status === "archived") return false;
      const courseId = sessionCourseId(notification);
      return courseId !== null && enrolledCourseIds.has(courseId);
    };
  }, [enrolledCourseIds]);

  const visible = useMemo(() => all.filter(isRelevant), [all, isRelevant]);
  const unreadVisibleIds = useMemo(
    () => new Set(unread.filter(isRelevant).map((notification) => notification.id)),
    [unread, isRelevant],
  );

  const items: MenuItem[] = visible.slice(0, 8).map((notification) => {
    const data = notification.data as {
      course_title?: unknown;
      session_title?: unknown;
    } | null;
    const courseTitle = typeof data?.course_title === "string" ? data.course_title : "";
    const sessionTitle = typeof data?.session_title === "string" ? data.session_title : "";
    const fallbackBody = [courseTitle, sessionTitle].filter(Boolean).join(" — ");

    return {
      id: String(notification.id),
      title: "جلسة جديدة في دورتك",
      description: notification.body?.trim() || fallbackBody || undefined,
      timestamp: formatTimestamp(notification.created_at),
      read: !unreadVisibleIds.has(notification.id),
      initials: "ج",
    };
  });

  return (
    <AppNotificationMenu
      notifications={items}
      unreadCount={unreadVisibleIds.size}
      onMarkAllRead={() => {
        unread.filter(isRelevant).forEach((notification) => markRead(notification.id));
      }}
      onItemClick={(id) => {
        const notificationId = Number(id);
        if (!Number.isNaN(notificationId)) markRead(notificationId);
      }}
      emptyHint="ستظهر جلسات دوراتك المسجّلة هنا"
    />
  );
}
