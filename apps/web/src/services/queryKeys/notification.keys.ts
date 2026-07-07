import type { NotificationStatus } from "@/types/notification.types";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (status?: NotificationStatus | "unread") =>
    [...notificationKeys.lists(), status ?? "all"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};
