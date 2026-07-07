export interface TenantLoginRequest {
  email: string;
  password: string;
  tenant_id: number;
}

export interface TenantAuthUser {
  id: number;
  name: string;
  email: string;
}

export interface TenantLoginResponse {
  message: string;
  user: TenantAuthUser;
  membership: {
    id: number;
    tenant_id: number;
    status: string;
    last_accessed_at: string | null;
  };
}
