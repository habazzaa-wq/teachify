import { cache } from "react";
import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import type { AboutPageSettings } from "./types";

export const aboutPageServerService = {
  getPublicAbout: cache(async (): Promise<AboutPageSettings | null> => {
    try {
      const requestHeaders = await headers();
      const tenantId = requestHeaders.get("x-tenant-id") ?? "";
      const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "").split(":")[0];
      const tenantDomain = requestHeaders.get("x-tenant-domain") ?? host;
      const response = await fetch(`${resolveApiBaseUrl()}/public/about`, {
        headers: {
          Accept: "application/json",
          ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
          ...(tenantDomain ? { "X-Tenant-Domain": tenantDomain } : {}),
        },
        cache: "no-store",
      });

      if (!response.ok) return null;
      const data = (await response.json()) as { about: AboutPageSettings | null };
      return data.about ?? null;
    } catch {
      return null;
    }
  }),
};
