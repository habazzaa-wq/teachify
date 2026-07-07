import type { ApiMessageResponse } from "./common.types";

/**
 * Notification API contracts.
 * Endpoints return named-key envelopes: { notifications: [...] }.
 */

export type NotificationStatus = "unread" | "read" | "archived";
export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface NotificationItem {
  id: number;
  tenant_id: number;
  tenant_user_id: number;
  type: string;
  title: string;
  body: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
}

export type MarkNotificationResponse = ApiMessageResponse & {
  notification: NotificationItem;
};

export interface NotificationPreferenceItem {
  id: number;
  tenant_id: number;
  tenant_user_id: number;
  notification_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface NotificationPreferenceListResponse {
  preferences: NotificationPreferenceItem[];
}

export interface UpdateNotificationPreferencesRequest {
  preferences: Array<{
    notification_type: string;
    in_app_enabled?: boolean;
    email_enabled?: boolean;
  }>;
}

export interface UpdateNotificationPreferencesResponse extends ApiMessageResponse {
  preferences: NotificationPreferenceItem[];
}
