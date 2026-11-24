import api from "@/services/api/axios";

export interface PublicRegisterPayload {
  name: string;
  email: string;
  email_notifications_enabled?: boolean;
  phone: string;
  parent_phone?: string;
  password: string;
  password_confirmation: string;
  gender?: string;
  study_type?: string;
  study_level?: string;
  governorate?: string;
  city?: string;
}

export interface GoogleAuthResponse {
  needs_phone?: boolean;
  completion_token?: string;
  profile?: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  message?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  user?: PublicRegisterResponse["user"];
  tenant?: PublicRegisterResponse["tenant"];
  membership?: PublicRegisterResponse["membership"];
  roles?: PublicRegisterResponse["roles"];
  permissions?: PublicRegisterResponse["permissions"];
  abilities?: PublicRegisterResponse["abilities"];
  navigation?: PublicRegisterResponse["navigation"];
  subscription?: PublicRegisterResponse["subscription"];
  plan?: PublicRegisterResponse["plan"];
  feature_flags?: PublicRegisterResponse["feature_flags"];
}

export interface PublicRegisterResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    is_platform_super_admin: boolean;
    avatar?: string | null;
  };
  tenant: {
    id: number;
    name: string;
    slug: string;
    status: string;
    domain: string;
  };
  membership: {
    id: number;
    tenant_id: number;
    status: string;
    joined_at: string | null;
    last_accessed_at: string | null;
  };
  roles: { id: number; name: string; slug: string }[];
  permissions: { id: number; name: string; slug: string }[];
  abilities: {
    can_access_dashboard: boolean;
    can_manage_courses: boolean;
    can_manage_users: boolean;
    can_manage_settings: boolean;
  };
  navigation: unknown[];
  subscription: unknown;
  plan: unknown;
  feature_flags: unknown;
}

export const publicRegisterService = {
  async register(payload: PublicRegisterPayload): Promise<PublicRegisterResponse> {
    const { data } = await api.post<PublicRegisterResponse>("/public/register", payload);
    return data;
  },
  async googleAuthenticate(payload: { access_token: string; phone?: string }): Promise<GoogleAuthResponse> {
    const { data } = await api.post<GoogleAuthResponse>("/public/auth/google", payload);
    return data;
  },
  async googleComplete(payload: { completion_token: string; phone: string; email_notifications_enabled?: boolean }): Promise<PublicRegisterResponse> {
    const { data } = await api.post<PublicRegisterResponse>("/public/auth/google/complete", payload);
    return data;
  },
};
