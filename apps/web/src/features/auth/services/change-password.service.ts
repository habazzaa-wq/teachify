import api from "@/services/api/axios";

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export const changePasswordService = {
  async changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResponse> {
    const { data } = await api.post<ChangePasswordResponse>("/tenant/auth/change-password", payload);
    return data;
  },
};
