"use client";

import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/api/audit.service";
import { auditKeys } from "@/services/queryKeys";
import type {
  AuditLogQueryParams,
  EntityHistoryQueryParams,
} from "@/types/audit.types";

/**
 * Audit log query hooks.
 *
 * IMPORTANT: audit logs are reporting-only and MUST NEVER be used for
 * authorization decisions. They describe what already happened.
 */

/** Paginated audit log listing (filterable). */
export function useAuditLogs(params: AuditLogQueryParams = {}) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditService.list(params),
  });
}

/** Audit history for a single entity. */
export function useEntityAuditHistory(params: EntityHistoryQueryParams) {
  return useQuery({
    queryKey: auditKeys.entity(params),
    queryFn: () => auditService.entityHistory(params),
    enabled: Boolean(params.entity_type && params.entity_id),
  });
}
