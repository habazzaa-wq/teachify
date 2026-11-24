import type { StudentEnrolledCourse } from "@/features/course-catalog/types";
import type { NotificationItem } from "@/types/notification.types";

type CourseNotification = Pick<NotificationItem, "data">;

/** Course id carried by course notifications (e.g. `session.scheduled`). */
export function notificationCourseId(notification: CourseNotification): string | null {
  const raw = (notification.data as { course_id?: unknown } | null)?.course_id;
  if (typeof raw !== "string" && typeof raw !== "number") return null;

  const courseId = String(raw).trim();
  return courseId || null;
}

/**
 * Public course URL for a notification, resolved through the student's
 * enrolled courses so the slug always matches the current tenant catalog.
 */
export function notificationCourseHref(
  notification: CourseNotification,
  courses: readonly StudentEnrolledCourse[] | null | undefined,
): string | null {
  const courseId = notificationCourseId(notification);
  if (!courseId || !courses) return null;

  const course = courses.find((item) => String(item.id) === courseId);
  if (!course?.slug) return null;

  return `/courses/${encodeURIComponent(course.slug)}`;
}
