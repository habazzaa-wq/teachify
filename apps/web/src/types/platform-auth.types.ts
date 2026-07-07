export interface PlatformUser {
  id: number;
  name: string;
  email: string;
}

export interface PlatformAdminProfile {
  id: number;
  status: string;
  role: string;
  granted_at: string | null;
}

export interface PlatformLoginRequest {
  email: string;
  password: string;
}

export interface PlatformLoginResponse {
  message: string;
  token: string;
  token_type: string;
  user: PlatformUser;
  platform_admin: PlatformAdminProfile;
}

export interface PlatformMeResponse {
  user: PlatformUser;
  platform_admin: PlatformAdminProfile;
}

export interface PlatformLogoutResponse {
  message: string;
}
