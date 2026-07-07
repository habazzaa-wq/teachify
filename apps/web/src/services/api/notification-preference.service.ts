import api from "./axios";
import type {
  NotificationPreferenceListResponse,
  UpdateNotificationPreferencesRequest,
  UpdateNotificationPreferencesResponse,
} from "@/types/notification.types";

/** Notification preference API (named-key envelopes). */
export const notificationPreferenceService = {
  async list(): Promise<NotificationPreferenceListResponse> {
    const { data } = await api.get<NotificationPreferenceListResponse>(
      "/notification-preferences",
    );
    return data;
  },

  async update(
    payload: UpdateNotificationPreferencesRequest,
  ): Promise<UpdateNotificationPreferencesResponse> {
    const { data } = await api.put<UpdateNotificationPreferencesResponse>(
      "/notification-preferences",
      payload,
    );
    return data;
  },
};
