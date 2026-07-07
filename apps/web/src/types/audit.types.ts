import type { PaginatedResponse, PaginationParams } from "./common.types";

/**
 * Audit log API contracts.
 *
 * Audit logs are immutable reporting records. They MUST NEVER be used for
 * authorization decisions — they only describe what already happened.
 *
 * Endpoints return the Laravel paginator shape at the top level (no wrapping
 * key): { data: [...], current_page, last_page, per_page, total, ... }.
 */

export interface AuditLogItem {
  id: number;
  tenant_id: number | null;
  tenant_user_id: number | null;
  user_id: number | null;
  event_type: string;
  entity_type: string;
  entity_id: number;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

export interface AuditLogQueryParams extends PaginationParams {
  event_type?: string;
  tenant_user_id?: number;
  entity_type?: string;
  entity_id?: string | number;
  from?: string;
  to?: string;
}

export interface EntityHistoryQueryParams extends PaginationParams {
  entity_type: string;
  entity_id: string | number;
}

export type AuditLogPage = PaginatedResponse<AuditLogItem>;

export interface PlatformAuditLogItem {
  id: number;
  platform_admin_id: number;
  event_type: string;
  entity_type: string;
  entity_id: number;
  action: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

export interface PlatformAuditLogQueryParams extends PaginationParams {
  event_type?: string;
  entity_type?: string;
  entity_id?: string | number;
  from?: string;
  to?: string;
}

export type PlatformAuditLogPage = PaginatedResponse<PlatformAuditLogItem>;
