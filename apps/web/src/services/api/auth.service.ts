import api, { ensureCsrfCookie } from "./axios";
import type {
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RefreshRequest,
  RefreshResponse,
} from "@/types/auth.types";

export const authService = {
  async getCsrfCookie(): Promise<void> {
    await ensureCsrfCookie();
  },

  async login(payload: LoginRequest): Promise<LoginResponse> {
    await ensureCsrfCookie();
    const { data } = await api.post<LoginResponse>("/tenant/auth/login", payload);
    return data;
  },

  async refresh(payload: RefreshRequest): Promise<RefreshResponse> {
    const { data } = await api.post<RefreshResponse>("/tenant/auth/refresh", payload);
    return data;
  },

  async me(): Promise<CurrentUserResponse> {
    const { data } = await api.get<CurrentUserResponse>("/tenant/auth/me");
    return data;
  },

  async logout(): Promise<LogoutResponse> {
    const { data } = await api.post<LogoutResponse>("/tenant/auth/logout");
    return data;
  },
};
