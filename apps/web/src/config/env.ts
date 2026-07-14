const DEFAULT_DEV_API_URL = "http://localhost:8000";
const API_SUBDOMAIN = "api";
const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? "academy.test";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const IS_PROD = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

type RuntimeApiLocation =
  | URL
  | Location
  | {
      protocol?: string;
      hostname?: string;
      host?: string;
      origin?: string;
    };

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeProtocol(protocol?: string): string {
  if (!protocol) return "http:";
  return protocol.endsWith(":") ? protocol : `${protocol}:`;
}

function hostnameFromHost(host?: string): string | null {
  if (!host) return null;
  return host.replace(/^\[/, "").replace(/\]$/, "").split(":")[0] || null;
}

function normalizeLocation(location?: RuntimeApiLocation): {
  protocol: string;
  hostname: string;
} | null {
  if (!location) return null;

  if (location instanceof URL) {
    return {
      protocol: normalizeProtocol(location.protocol),
      hostname: location.hostname,
    };
  }

  if ("origin" in location && location.origin) {
    try {
      const parsed = new URL(location.origin);
      return {
        protocol: normalizeProtocol(parsed.protocol),
        hostname: parsed.hostname,
      };
    } catch {
      // Fall through to protocol/hostname handling.
    }
  }

  const hostname = location.hostname ?? hostnameFromHost(location.host);

  if (!hostname) return null;

  return {
    protocol: normalizeProtocol(location.protocol),
    hostname,
  };
}

function getBrowserLocation(): RuntimeApiLocation | undefined {
  return typeof window === "undefined" ? undefined : window.location;
}

/**
 * Resolves the API origin for browser, server, and middleware runtimes.
 *
 * Local Next development always talks to the local Laravel server. Platform and
 * tenant domains derive the API host from the current request protocol and the
 * configured base domain, so both current and future tenants use one API origin.
 */
export function resolveApiUrl(location?: RuntimeApiLocation): string {
  const runtimeLocation = normalizeLocation(location ?? getBrowserLocation());

  if (runtimeLocation) {
    const { hostname, protocol } = runtimeLocation;

    // Local development — talk directly to the Laravel dev server
    if (LOCAL_HOSTS.has(hostname)) {
      return DEFAULT_DEV_API_URL;
    }

    // Tenant subdomain: Caddy routes /api/* and /sanctum/* to Laravel
    // on the same origin, so use the current hostname directly.
    // e.g. https://hazem.academy.test → https://hazem.academy.test
    // This avoids CORS, mixed-content, and self-signed certificate issues.
    //
    // When called with an explicit `location` param (middleware / server),
    // fall back to the direct Laravel URL — no TLS needed between services.
    if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
      if (location) {
        return DEFAULT_DEV_API_URL;
      }
      return `${protocol}//${hostname}`;
    }
  }

  return stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_DEV_API_URL);
}

export function resolveApiBaseUrl(location?: RuntimeApiLocation): string {
  return `${resolveApiUrl(location)}/api/v1`;
}

export function resolvePlatformApiBaseUrl(location?: RuntimeApiLocation): string {
  return `${resolveApiUrl(location)}/api/platform`;
}

/**
 * Centralized access to public runtime configuration.
 * Only NEXT_PUBLIC_* variables are available in the browser.
 */
export const env = {
  apiUrl: resolveApiUrl(),
  apiVersion: "v1",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "أكاديميتي",
  appBaseDomain: process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? "academy.test",
  devTenant: process.env.NEXT_PUBLIC_DEV_TENANT_ID
    ? {
        id: Number(process.env.NEXT_PUBLIC_DEV_TENANT_ID),
        name: process.env.NEXT_PUBLIC_DEV_TENANT_NAME ?? "أكاديمية تجريبية",
        slug: process.env.NEXT_PUBLIC_DEV_TENANT_SLUG ?? "demo",
        status: process.env.NEXT_PUBLIC_DEV_TENANT_STATUS ?? "active",
      }
    : null,
} as const;

/**
 * The API base path, e.g. http://localhost:8000/api/v1
 */
export const apiBaseUrl = resolveApiBaseUrl();
