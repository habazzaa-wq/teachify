import { cache } from "react";
import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";

export const legalServerService = {
  getPublicLegal: cache(async (): Promise<unknown> => {
    try {
      const h = await headers();
      const tenantId = h.get("x-tenant-id") ?? "";
      const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0];
      const tenantDomain = h.get("x-tenant-domain") ?? host;

      const url = `${resolveApiBaseUrl()}/public/legal`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
          ...(tenantDomain ? { "X-Tenant-Domain": tenantDomain } : {}),
        },
        cache: "no-store",
      });

      if (!res.ok) return null;

      const json = (await res.json()) as { legal: unknown };
      return json.legal ?? null;
    } catch {
      return null;
    }
  }),
};