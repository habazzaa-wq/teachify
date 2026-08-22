import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import type { PublicStagesResponse } from "./types";

export const stagesServerService = {
  async getPublicStages(): Promise<PublicStagesResponse | null> {
    try {
      const h = await headers();
      const tenantId = h.get("x-tenant-id") ?? "";
      const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0];
      const tenantDomain = h.get("x-tenant-domain") ?? host;

      const url = `${resolveApiBaseUrl()}/public/educational-stages`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
          ...(tenantDomain ? { "X-Tenant-Domain": tenantDomain } : {}),
        },
        next: { revalidate: 300 },
      });

      if (!res.ok) return null;

      const json = (await res.json()) as PublicStagesResponse;
      return Array.isArray(json?.items) ? json : null;
    } catch {
      return null;
    }
  },
};
