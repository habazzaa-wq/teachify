export interface TenantIntegration {
  id: number;
  tenant_id: number;
  provider: string;
  service: string;
  status: "pending" | "active" | "failed" | "disconnected";
  external_id: string | null;
  config: Record<string, unknown>;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegrationPayload {
  provider: string;
  service: string;
  config: Record<string, unknown>;
  external_id?: string;
}
