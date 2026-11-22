import { cache } from "react";
import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import type { ServiceRecord } from "./types";

/**
 * Server-side public services API. Zustand stores (used by the browser axios
 * interceptor) are unavailable in Server Components, so tenant headers are
 * forwarded from the incoming request instead.
 */
async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const h = await headers();
    const tenantId = h.get("x-tenant-id") ?? "";
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0];
    const tenantDomain = h.get("x-tenant-domain") ?? host;

    const res = await fetch(`${resolveApiBaseUrl()}${path}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
        ...(tenantDomain ? { "X-Tenant-Domain": tenantDomain } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const serviceServerService = {
  getPublicService: cache(async (id: string | number): Promise<ServiceRecord | null> => {
    const json = await serverFetch<{ service: ServiceRecord }>(`/public/services/${id}`);
    return json?.service ?? null;
  }),

  getPublicServices: cache(async (): Promise<ServiceRecord[]> => {
    const json = await serverFetch<{ services: ServiceRecord[] }>("/public/services");
    return Array.isArray(json?.services) ? json.services : [];
  }),
};
