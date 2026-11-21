import { cache } from "react";
import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import { mergeAboutSettings } from "./types";
import type { AboutSettings } from "./types";

export const aboutServerService = {
  getPublicAbout: cache(async (): Promise<AboutSettings> => {
    try {
      const h = await headers();
      const tenantId = h.get("x-tenant-id") ?? "";
      const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0];
      const tenantDomain = h.get("x-tenant-domain") ?? host;

      const res = await fetch(`${resolveApiBaseUrl()}/public/about`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
          ...(tenantDomain ? { "X-Tenant-Domain": tenantDomain } : {}),
        },
        cache: "no-store",
      });

      if (!res.ok) return mergeAboutSettings(null);

      const json = (await res.json()) as { about?: unknown };
      return mergeAboutSettings(json.about);
    } catch {
      return mergeAboutSettings(null);
    }
  }),
};
