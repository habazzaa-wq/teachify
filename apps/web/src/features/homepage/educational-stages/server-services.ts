import { cache } from "react";
import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import type { PublicStagesResponse, PublicStagesStatsResponse } from "./types";

async function fetchPublicStages<T>(
  path: string,
  isValid: (json: unknown) => json is T,
): Promise<T | null> {
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

    const json: unknown = await res.json();
    return isValid(json) ? json : null;
  } catch {
    return null;
  }
}

export const stagesServerService = {
  getPublicStages: cache(() =>
    fetchPublicStages<PublicStagesResponse>(
      "/public/educational-stages",
      (json): json is PublicStagesResponse =>
        typeof json === "object" &&
        json !== null &&
        Array.isArray((json as PublicStagesResponse).items),
    ),
  ),

  getPublicStagesStats: cache(() =>
    fetchPublicStages<PublicStagesStatsResponse>(
      "/public/educational-stages/stats",
      (json): json is PublicStagesStatsResponse =>
        typeof json === "object" &&
        json !== null &&
        Array.isArray((json as PublicStagesStatsResponse).items),
    ),
  ),
};
