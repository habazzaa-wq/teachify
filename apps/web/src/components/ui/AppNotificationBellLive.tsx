"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEnrolledCourses } from "@/features/course-catalog/hooks";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationCourseHref, notificationCourseId } from "@/lib/notification-course";
import type { NotificationItem } from "@/types/notification.types";
import { AppNotificationMenu, type NotificationItem as MenuItem } from "./AppNotificationMenu";

/** Only newly published sessions are surfaced in the student navbar. */
const SESSION_PUBLISHED_TYPE = "session.scheduled";

interface AppNotificationBellLiveProps {
  enabled?: boolean;
  viewAllHref?: string;
  /** Student navbar only: show session notices for enrolled courses. */
  sessionOnly?: boolean;
}

function formatTs(ts?: string | null) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return ts;
  }
}

/** Original shared bell: admin, teacher and platform headers. */
function GeneralNotificationBell({
  enabled = true,
  viewAllHref = "/dashboard/notifications",
}: AppNotificationBellLiveProps) {
  const router = useRouter();
  const { unread, all, unreadCount, markRead } = useNotifications(enabled);

  const items: MenuItem[] = useMemo(() => {
    const source = all.length ? all : unread;
    return source.slice(0, 8).map((n) => ({
      id: String(n.id),
      title: n.title || "إشعار",
      description: n.body || undefined,
      timestamp: formatTs(n.created_at),
      read: n.status !== "unread",
      initials: "إش",
    }));
  }, [all, unread]);

  return (
    <AppNotificationMenu
      notifications={items}
      unreadCount={unreadCount}
      onMarkAllRead={() => {
        unread.forEach((n) => markRead(n.id));
      }}
      onViewAll={() => router.push(viewAllHref)}
      onItemClick={(id) => {
        const num = Number(id);
        if (!Number.isNaN(num)) markRead(num);
      }}
    />
  );
}

const SESSION_TITLES: Record<string, string> = {
  "session.scheduled": "جلسة جديدة في دورتك",
  "session.rescheduled": "تم تغيير موعد جلسة",
  "session.cancelled": "تم إلغاء جلسة",
  "session.reminder": "تذكير بجلسة قادمة",
  "lesson.published": "محتوى جديد في دورتك",
};

/**
 * Student bell: published sessions for courses the student is enrolled in.
 * Keeps the q4 title/fallback refinements and adds the w4 course deep-link.
 */
function SessionNotificationBell({ enabled = true }: AppNotificationBellLiveProps) {
  const router = useRouter();
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
      const courseId = notificationCourseId(notification);
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
      lesson_title?: unknown;
    } | null;
    const courseTitle = typeof data?.course_title === "string" ? data.course_title : "";
    const sessionTitle = typeof data?.session_title === "string" ? data.session_title : "";
    const lessonTitle = typeof data?.lesson_title === "string" ? data.lesson_title : "";
    const fallbackBody = [courseTitle, sessionTitle || lessonTitle]
      .filter(Boolean)
      .join(" — ");

    return {
      id: String(notification.id),
      title: SESSION_TITLES[notification.type] ?? notification.title ?? "إشعار جديد",
      description: notification.body?.trim() || fallbackBody || undefined,
      timestamp: formatTs(notification.created_at),
      read: !unreadVisibleIds.has(notification.id),
      initials: notification.type.startsWith("lesson.") ? "م" : "ج",
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
        const notification = visible.find((item) => String(item.id) === id);
        if (!notification) return;

        markRead(notification.id);
        const href = notificationCourseHref(notification, enrolledCourses);
        if (href) router.push(href);
      }}
      emptyHint="ستظهر إشعارات جلساتك ودوراتك هنا"
    />
  );
}

export function AppNotificationBellLive(props: AppNotificationBellLiveProps) {
  return props.sessionOnly ? (
    <SessionNotificationBell {...props} />
  ) : (
    <GeneralNotificationBell {...props} />
  );
}
