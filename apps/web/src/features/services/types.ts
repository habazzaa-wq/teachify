export interface ServiceRecord {
  id: number;
  title: string;
  image_url: string | null;
  summary: string | null;
  description: string | null;
  highlights: string[] | null;
  contact_name: string | null;
  contact_phone: string;
  instructor_tenant_user_id: number | null;
  is_published: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceInstructor {
  id: number;
  name: string;
  phone: string;
}

export interface ServicePayload {
  title: string;
  image_url: string | null;
  summary: string | null;
  description: string | null;
  highlights: string[];
  contact_name: string | null;
  contact_phone: string | null;
  instructor_tenant_user_id: number | null;
  is_published: boolean;
  sort_order: number;
}
