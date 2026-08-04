import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { resolveApiBaseUrl } from "@/config/env";
import type { StudentProfile } from "../types";

const REGISTER_STATE_KEY = "public-register-state";

interface RegisterState {
  name?: string;
  token?: string | null;
  refreshToken?: string | null;
  avatar?: string | null;
}

function readRegisterState(): RegisterState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REGISTER_STATE_KEY);
    return raw ? (JSON.parse(raw) as RegisterState) : null;
  } catch {
    return null;
  }
}

function writeRegisterState(state: RegisterState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REGISTER_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function resolveToken(): string | null {
  return readRegisterState()?.token ?? useAuthStore.getState().accessToken ?? null;
}

function resolveRefreshToken(): string | null {
  return readRegisterState()?.refreshToken ?? useAuthStore.getState().refreshToken ?? null;
}

function resolveTenantHeaders(): { tenantId: string | null; domain: string | null } {
  let tenantId: string | null = null;
  let domain: string | null = null;
  try {
    tenantId = useTenantStore.getState().activeTenant?.id?.toString() ?? null;
    domain = useTenantStore.getState().domain ?? null;
  } catch {
    // ignore
  }
  if (!domain && typeof window !== "undefined") {
    domain = window.location.hostname;
  }
  return { tenantId, domain };
}

function baseUrl(): string {
  try {
    return resolveApiBaseUrl();
  } catch {
    return "/api";
  }
}

function buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const { tenantId, domain } = resolveTenantHeaders();
  const headers: Record<string, string> = { Accept: "application/json", ...extra };
  const token = resolveToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) headers["X-Tenant-ID"] = tenantId;
  // Always send the domain so the backend can build absolute media URLs
  // (e.g. avatar) against the academy's custom domain.
  if (domain) headers["X-Tenant-Domain"] = domain;
  return headers;
}

function persistSession(accessToken: string, refreshToken: string): void {
  const auth = useAuthStore.getState();
  if (!auth.accessToken) {
    auth.setTokens(accessToken, refreshToken);
  } else if (accessToken !== auth.accessToken) {
    auth.setAccessToken(accessToken);
  }
  const stored = readRegisterState();
  if (stored) {
    writeRegisterState({ ...stored, token: accessToken, refreshToken });
  }
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = resolveRefreshToken();
  if (!refreshToken) return false;

  const { tenantId, domain } = resolveTenantHeaders();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (tenantId) headers["X-Tenant-ID"] = tenantId;
  else if (domain) headers["X-Tenant-Domain"] = domain;

  try {
    const res = await fetch(`${baseUrl()}/tenant/auth/refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: "include",
    });
    if (!res.ok) return false;
    const json = await res.json();
    const accessToken = json?.access_token;
    if (!accessToken) return false;
    persistSession(accessToken, refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, init: RequestInit = {}, retryOn401 = true): Promise<T> {
  const headers = buildHeaders(init.headers as Record<string, string> | undefined);
  let res = await fetch(`${baseUrl()}${path}`, { ...init, headers, credentials: "include" });

  if (res.status === 401 && retryOn401 && (await tryRefresh())) {
    res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: buildHeaders(init.headers as Record<string, string> | undefined),
      credentials: "include",
    });
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore non-json bodies
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return (await res.json()) as T;
}

export const studentProfileService = {
  async getProfile(): Promise<StudentProfile> {
    const json = await request<{ data: StudentProfile }>("/student/profile");
    return json.data;
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const form = new FormData();
    form.append("avatar", file);

    const json = await request<{ data: { avatar: string } }>("/student/profile/avatar", {
      method: "POST",
      body: form,
    });

    return json.data;
  },
};
