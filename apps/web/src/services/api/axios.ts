import axios, { type Axios, type InternalAxiosRequestConfig } from "axios";
import { resolveApiBaseUrl, resolveApiUrl } from "@/config/env";
import { normalizeApiError } from "./errors";
import { getApiRequestContext } from "./request-context";
import type { ApiError } from "@/types/common.types";
import { AUTH_EVENTS } from "@/constants/auth-events";

export { AUTH_EVENTS };

const TENANT_ID_HEADER = "X-Tenant-ID";
const TENANT_DOMAIN_HEADER = "X-Tenant-Domain";

export const api: Axios = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15_000,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

const EMPTY_CONTEXT = {
  accessToken: null as string | null,
  tenantId: null as string | null,
  tenantDomain: null as string | null,
};

function readRequestContext() {
  try {
    return getApiRequestContext();
  } catch {
    return EMPTY_CONTEXT;
  }
}

const PUBLIC_ENDPOINTS = ["/tenant/by-domain", "/public/news", "/public/hero", "/auth/login", "sanctum/csrf-cookie", "/auth/refresh", "/health", "/tenant/auth/login", "/tenant/auth/refresh", "/tenant/auth/forgot-password", "/tenant/auth/reset-password"];

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  const path = url.split("?")[0]?.split("#")[0] ?? "";
  return PUBLIC_ENDPOINTS.some((endpoint) => path.endsWith(endpoint));
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isPublic = isPublicEndpoint(config.url);
  const { accessToken, tenantId, tenantDomain } = readRequestContext();

  config.baseURL = resolveApiBaseUrl();

  if (isPublic) {
    // Login and tenant-resolution endpoints still need tenant context.
    // Send the tenant ID or domain so the backend can identify the academy
    // without relying on the Host header (which is often localhost behind a
    // proxy or in dev).
    if (tenantId) {
      config.headers.set(TENANT_ID_HEADER, tenantId);
      config.headers.delete(TENANT_DOMAIN_HEADER);
    } else if (tenantDomain) {
      config.headers.set(TENANT_DOMAIN_HEADER, tenantDomain);
      config.headers.delete(TENANT_ID_HEADER);
    } else {
      config.headers.delete(TENANT_ID_HEADER);
      config.headers.delete(TENANT_DOMAIN_HEADER);
    }
  } else if (tenantId) {
    config.headers.set(TENANT_ID_HEADER, tenantId);
    config.headers.delete(TENANT_DOMAIN_HEADER);
  } else if (tenantDomain) {
    config.headers.set(TENANT_DOMAIN_HEADER, tenantDomain);
    config.headers.delete(TENANT_ID_HEADER);
  } else {
    config.headers.delete(TENANT_ID_HEADER);
    config.headers.delete(TENANT_DOMAIN_HEADER);
  }

  // Prefer Bearer token over session cookies
  const isLoginRequest = config.url?.includes("/auth/login") || config.url?.includes("/tenant/auth/login") || false;
  if (accessToken && !isPublic && !isLoginRequest && !config.url?.includes("sanctum/csrf-cookie")) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized: ApiError = normalizeApiError(error);

    if (typeof window !== "undefined") {
      if (normalized.status === 401) {
        // Check if we have a token - if so, it might be expired
        const { accessToken } = readRequestContext();
        if (accessToken) {
          // Try refresh before dispatching unauthorized
          window.dispatchEvent(new CustomEvent(AUTH_EVENTS.tokenExpired));
        } else {
          window.dispatchEvent(new CustomEvent(AUTH_EVENTS.unauthorized));
        }
      } else if (isTenantMismatch(normalized)) {
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.tenantInvalid));
      }
    }

    return Promise.reject(normalized);
  },
);

function isTenantMismatch(error: ApiError): boolean {
  if (error.status !== 403) {
    return false;
  }

  return /tenant|بيئة العمل|أكاديمية/i.test(error.message);
}

export async function ensureCsrfCookie(): Promise<void> {
  try {
    await axios.get(`${resolveApiUrl()}/sanctum/csrf-cookie`, {
      withCredentials: true,
      timeout: 5_000,
    });
  } catch {
    // CSRF cookie is not critical for token-based auth.
    // If the endpoint is unavailable, login can still proceed.
  }
}

export default api;
