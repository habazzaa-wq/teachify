import { cache } from "react";
import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import type { TenantByDomainResponse } from "@/features/tenant-bootstrap/types";

export type TenantSeoContext = TenantByDomainResponse;

function decodeHeaderContext(raw: string): TenantSeoContext | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf-8"),
    ) as TenantSeoContext;
    if (parsed && typeof parsed === "object" && parsed.id && parsed.name) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchTenantByDomain(domain: string): Promise<TenantSeoContext | null> {
  try {
    const url = `${resolveApiBaseUrl()}/tenant/by-domain?domain=${encodeURIComponent(domain)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as TenantSeoContext;
    if (!data || data.status !== "active") return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Resolve the active tenant for server-rendered SEO. Uses the middleware/proxy
 * `x-tenant-context` header when present, otherwise resolves the domain through
 * the public bootstrap API. Wrapped in React `cache` so it runs at most once
 * per request regardless of how many SEO helpers call it.
 */
export const getTenantSeoContext = cache(async (): Promise<TenantSeoContext | null> => {
  const h = await headers();

  const headerContext = h.get("x-tenant-context");
  if (headerContext) {
    const parsed = decodeHeaderContext(headerContext);
    if (parsed) return parsed;
  }

  const forwardedHost = (h.get("x-forwarded-host") ?? "").split(",")[0]?.trim() ?? "";
  const host = forwardedHost || ((h.get("host") ?? "").split(":")[0] ?? "");

  const base = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? "academy.test";

  // Platform / local development hosts have no tenant to resolve.
  if (!host || host === "localhost" || host === "127.0.0.1" || host === "::1") return null;
  if (host === base || host === `www.${base}` || host === `api.${base}`) return null;

  return fetchTenantByDomain(host);
});
