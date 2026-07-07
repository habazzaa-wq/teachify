import api from "./axios";
import type {
  AuditLogItem,
  AuditLogPage,
  AuditLogQueryParams,
  EntityHistoryQueryParams,
} from "@/types/audit.types";

/**
 * Audit log API. Reporting-only — never used for authorization decisions.
 *
 * Tenant audit + entity history endpoints live under the tenant-auth group.
 * Platform audit logs live under /platform/* and are intended for the
 * platform dashboard; the method is provided here for architecture readiness.
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

export const auditService = {
  async list(params: AuditLogQueryParams = {}): Promise<AuditLogPage> {
    const { data } = await api.get<AuditLogPage>("/audit-logs", {
      params: toSearchParams(params),
    });
    return data;
  },

  async entityHistory(params: EntityHistoryQueryParams): Promise<AuditLogPage> {
    const { data } = await api.get<AuditLogPage>("/audit-logs/entity", {
      params: toSearchParams(params),
    });
    return data;
  },
};

// Re-export the item type for hook consumers.
export type { AuditLogItem };
