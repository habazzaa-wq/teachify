import api from "./axios";
import type {
  MarkNotificationResponse,
  NotificationListResponse,
} from "@/types/notification.types";

/** Notification inbox API (named-key envelopes). */
export const notificationService = {
  async list(typePrefix?: string): Promise<NotificationListResponse> {
    const { data } = await api.get<NotificationListResponse>("/notifications", {
      params: typePrefix ? { type_prefix: typePrefix } : undefined,
    });
    return data;
  },

  async listUnread(typePrefix?: string): Promise<NotificationListResponse> {
    const { data } = await api.get<NotificationListResponse>(
      "/notifications/unread",
      { params: typePrefix ? { type_prefix: typePrefix } : undefined },
    );
    return data;
  },

  async markRead(id: number): Promise<MarkNotificationResponse> {
    const { data } = await api.patch<MarkNotificationResponse>(
      `/notifications/${id}/read`,
    );
    return data;
  },

  async archive(id: number): Promise<MarkNotificationResponse> {
    const { data } = await api.patch<MarkNotificationResponse>(
      `/notifications/${id}/archive`,
    );
    return data;
  },
};
