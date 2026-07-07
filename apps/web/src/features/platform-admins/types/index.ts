export interface PlatformAdmin {
  id: number;
  user_id: number;
  role: "super_admin" | "support" | "analyst";
  status: "active" | "inactive" | "suspended";
  granted_at: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreatePlatformAdminPayload {
  name: string;
  email: string;
  password: string;
  role?: "super_admin" | "support" | "analyst";
}
