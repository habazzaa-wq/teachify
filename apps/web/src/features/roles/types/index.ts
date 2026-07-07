export interface Role {
  id: number;
  tenant_id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRolePayload {
  name: string;
  slug?: string;
  permission_ids?: number[];
}
