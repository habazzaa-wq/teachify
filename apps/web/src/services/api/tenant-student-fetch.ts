/**
 * Session-aware fetch for tenant student endpoints (profile, avatar, wallet).
 *
 * On public home pages the navbar student session (`public-register-state`) is the
 * source of truth, NOT the shared auth store — the auth store is overwritten every
 * time someone signs in on /tenant-login (teacher dashboard) and would otherwise
 * leak the wrong identity's token into student API calls. Inside dashboard/auth
 * routes the auth store is authoritative.
 *
 * Handles tenant identification headers and one retry after a token refresh on 401.
 */
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { resolveApiBaseUrl } from "@/config/env";

const REGISTER_STATE_KEY = "public-register-state";

interface RegisterState {
  name?: string;
  token?: string | null;
  refreshToken?: string | null;
  avatar?: string | null;
}

const DASHBOARD_PREFIXES = ["/teacher", "/student", "/superadmin", "/tenant-login", "/tenant-not-found"];

/**
 * True when the current route is a public home page where the navbar's student
 * session is authoritative over the shared auth store.
 */
export function isPublicHomeContext(pathname?: string): boolean {
  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return !DASHBOARD_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
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

function authStoreToken(): string | null {
  try {
    return useAuthStore.getState().accessToken ?? null;
  } catch {
    return null;
  }
}

function authStoreRefreshToken(): string | null {
  try {
    return useAuthStore.getState().refreshToken ?? null;
  } catch {
    return null;
  }
}

/** Resolve the access token that should be used for a student API call right now. */
export function resolveStudentAccessToken(pathname?: string): string | null {
  const stored = readRegisterState();
  const authToken = authStoreToken();
  if (isPublicHomeContext(pathname)) {
    return stored?.token ?? authToken;
  }
  return authToken ?? stored?.token ?? null;
}

function resolveRefreshToken(pathname?: string): string | null {
  const stored = readRegisterState();
  const authRefresh = authStoreRefreshToken();
  if (isPublicHomeContext(pathname)) {
    return stored?.refreshToken ?? authRefresh;
  }
  return authRefresh ?? stored?.refreshToken ?? null;
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
  const token = resolveStudentAccessToken();
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

/**
 * Fetch a tenant student endpoint with the correct identity's token, tenant
 * headers, and a single refresh+retry on 401.
 */
export async function tenantStudentFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = buildHeaders(init.headers as Record<string, string> | undefined);
  let res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && (await tryRefresh())) {
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
