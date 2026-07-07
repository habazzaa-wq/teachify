import type { ActivityLogQueryParams } from "@/types/activity.types";

export const activityKeys = {
  all: ["activity-logs"] as const,
  lists: () => [...activityKeys.all, "list"] as const,
  list: (params: ActivityLogQueryParams) =>
    [...activityKeys.lists(), params] as const,
  mine: (params: ActivityLogQueryParams) =>
    [...activityKeys.all, "mine", params] as const,
};
