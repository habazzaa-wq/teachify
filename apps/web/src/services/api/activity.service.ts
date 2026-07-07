import api from "./axios";
import type {
  ActivityLogItem,
  ActivityLogPage,
  ActivityLogQueryParams,
} from "@/types/activity.types";

/**
 * Activity log API. Reporting-only — never used for authorization decisions.
 */
function toSearchParams<T extends object>(params: T): URLSearchParams {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  return search;
}

export const activityService = {
  async list(params: ActivityLogQueryParams = {}): Promise<ActivityLogPage> {
    const { data } = await api.get<ActivityLogPage>("/activity-logs", {
      params: toSearchParams(params),
    });
    return data;
  },

  async myActivity(
    params: ActivityLogQueryParams = {},
  ): Promise<ActivityLogPage> {
    const { data } = await api.get<ActivityLogPage>("/activity-logs/me", {
      params: toSearchParams(params),
    });
    return data;
  },
};

// Re-export the item type for hook consumers.
export type { ActivityLogItem };
