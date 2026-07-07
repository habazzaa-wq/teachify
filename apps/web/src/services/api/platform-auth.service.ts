import platformApi from "./platform-axios";
import type {
  PlatformLoginRequest,
  PlatformLoginResponse,
  PlatformLogoutResponse,
  PlatformMeResponse,
} from "@/types/platform-auth.types";

export const platformAuthService = {
  async login(payload: PlatformLoginRequest): Promise<PlatformLoginResponse> {
    const { data } = await platformApi.post<PlatformLoginResponse>(
      "/auth/login",
      payload,
    );

    return data;
  },

  async me(): Promise<PlatformMeResponse> {
    const { data } = await platformApi.get<PlatformMeResponse>("/auth/me");

    return data;
  },

  async logout(): Promise<PlatformLogoutResponse> {
    const { data } = await platformApi.post<PlatformLogoutResponse>(
      "/auth/logout",
    );

    return data;
  },
};
