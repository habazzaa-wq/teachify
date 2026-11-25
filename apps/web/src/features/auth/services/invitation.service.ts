import api from "@/services/api/axios";

export interface AcceptInvitationResponse {
  message: string;
  membership: {
    id: number;
    tenant_id: number;
    user_id: number;
    status: string;
  };
}

export const invitationService = {
  async accept(payload: { token: string; name: string; password: string }): Promise<AcceptInvitationResponse> {
    const { data } = await api.post<AcceptInvitationResponse>("/auth/invitations/accept", payload);
    return data;
  },
};
