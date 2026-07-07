import axios, { type Axios, type InternalAxiosRequestConfig } from "axios";
import { resolvePlatformApiBaseUrl } from "@/config/env";
import { normalizeApiError } from "./errors";
import { getPlatformToken, usePlatformAuthStore } from "@/stores/platform-auth.store";
import type { ApiError } from "@/types/common.types";

export const PLATFORM_AUTH_EVENTS = {
  unauthorized: "platform:unauthorized",
} as const;

export const platformApi: Axios = axios.create({
  baseURL: resolvePlatformApiBaseUrl(),
  timeout: 15_000,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

platformApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getPlatformToken();

  config.baseURL = resolvePlatformApiBaseUrl();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers.delete("Authorization");
  }

  return config;
});

platformApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized: ApiError = normalizeApiError(error);

    if (typeof window !== "undefined" && normalized.status === 401) {
      usePlatformAuthStore.getState().clear();
      window.dispatchEvent(new CustomEvent(PLATFORM_AUTH_EVENTS.unauthorized));
    }

    return Promise.reject(normalized);
  },
);

export default platformApi;
