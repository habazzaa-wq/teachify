import api from "./axios";
import { isInstructorWorkspace } from "@/features/instructors/workspace";
import type {
  MarkNotificationResponse,
  NotificationListResponse,
} from "@/types/notification.types";

/** Instructor tokens cannot use the regular tenant.membership inbox routes. */
const inboxBase = () =>
  isInstructorWorkspace() ? "/instructor/notifications" : "/notifications";

/** Notification inbox API (named-key envelopes). */
export const notificationService = {
  async list(typePrefix?: string): Promise<NotificationListResponse> {
    const { data } = await api.get<NotificationListResponse>(inboxBase(), {
      params: typePrefix ? { type_prefix: typePrefix } : undefined,
    });
    return data;
  },

  async listUnread(typePrefix?: string): Promise<NotificationListResponse> {
    const { data } = await api.get<NotificationListResponse>(
      `${inboxBase()}/unread`,
      { params: typePrefix ? { type_prefix: typePrefix } : undefined },
    );
    return data;
  },

  async markRead(id: number): Promise<MarkNotificationResponse> {
    const { data } = await api.patch<MarkNotificationResponse>(
      `${inboxBase()}/${id}/read`,
    );
    return data;
  },

  async archive(id: number): Promise<MarkNotificationResponse> {
    const { data } = await api.patch<MarkNotificationResponse>(
      `${inboxBase()}/${id}/archive`,
    );
    return data;
  },
};
