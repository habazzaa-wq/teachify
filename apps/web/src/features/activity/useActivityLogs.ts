"use client";

import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/api/activity.service";
import { activityKeys } from "@/services/queryKeys";
import type { ActivityLogQueryParams } from "@/types/activity.types";

/**
 * Activity log query hooks.
 *
 * IMPORTANT: activity logs are append-only reporting records and MUST NEVER be
 * used for authorization decisions.
 */

/** Paginated activity log listing (filterable). */
export function useActivityLogs(params: ActivityLogQueryParams = {}) {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn: () => activityService.list(params),
  });
}

/** Current member's own activity (students see only their own). */
export function useMyActivity(params: ActivityLogQueryParams = {}) {
  return useQuery({
    queryKey: activityKeys.mine(params),
    queryFn: () => activityService.myActivity(params),
  });
}
