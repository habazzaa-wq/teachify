import { cache } from "react";
import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import type { WhyChooseUsSettings } from "./types";

export const whyChooseUsServerService = {
  getPublicWhyChooseUs: cache(async (): Promise<WhyChooseUsSettings | null> => {
    try {
      const h = await headers();
      const tenantId = h.get("x-tenant-id") ?? "";
      const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0];
      const tenantDomain = h.get("x-tenant-domain") ?? host;

      const url = `${resolveApiBaseUrl()}/public/why-choose-us`;

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

      const json = (await res.json()) as { whyChooseUs?: WhyChooseUsSettings };
      return json.whyChooseUs ?? null;
    } catch {
      return null;
    }
  }),
};
