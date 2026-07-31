export interface StageItem {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  link: string | null;
}

export interface PublicStagesResponse {
  items: StageItem[];
}

/** Real, derived stats for a stage (reused from the public courses API). */
export interface StageStats {
  coursesCount: number;
  teachersCount: number;
}

export interface EducationalStageRecord {
  id: number;
  tenant_id: number;
  created_by_tenant_user_id: number | null;
  name: string;
  description: string | null;
  image: string | null;
  link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EducationalStageInput {
  name: string;
  description?: string | null;
  image?: string | null;
  link?: string | null;
  is_active?: boolean;
  sort_order?: number;
}
