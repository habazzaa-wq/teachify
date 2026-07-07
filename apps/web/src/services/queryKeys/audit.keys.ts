import type {
  AuditLogQueryParams,
  EntityHistoryQueryParams,
} from "@/types/audit.types";

export const auditKeys = {
  all: ["audit-logs"] as const,
  lists: () => [...auditKeys.all, "list"] as const,
  list: (params: AuditLogQueryParams) =>
    [...auditKeys.lists(), params] as const,
  entity: (params: EntityHistoryQueryParams) =>
    [...auditKeys.all, "entity", params] as const,
};
