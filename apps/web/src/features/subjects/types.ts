export interface SubjectRecord {
  id: number;
  tenant_id: number;
  created_by_tenant_user_id: number | null;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SubjectInput {
  name: string;
  description?: string | null;
  icon?: string | null;
  is_active?: boolean;
  sort_order?: number;
}
