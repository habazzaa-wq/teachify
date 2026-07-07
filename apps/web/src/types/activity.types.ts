import type { PaginatedResponse, PaginationParams } from "./common.types";

/**
 * Activity log API contracts.
 *
 * Activity logs are append-only learner/instructor event records. Like audit
 * logs, they are reporting-only and MUST NEVER drive authorization decisions.
 *
 * Endpoints return the Laravel paginator shape at the top level.
 */

export interface ActivityLogItem {
  id: number;
  tenant_id: number;
  tenant_user_id: number;
  activity_type: string;
  entity_type: string;
  entity_id: number;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface ActivityLogQueryParams extends PaginationParams {
  activity_type?: string;
  entity_type?: string;
  entity_id?: string | number;
}

export type ActivityLogPage = PaginatedResponse<ActivityLogItem>;
