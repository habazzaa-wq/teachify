import { cache } from "react";
import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import { CATALOG_PAGE_SIZE } from "./constants";
import type { StageItem } from "@/features/homepage/educational-stages/types";
import { formatCatalogCoursesResponse } from "./format";
import { buildCatalogParams } from "./params";
import type { CatalogCoursesResponse, CatalogFilters } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>;

/**
 * Server-side fetch helper that reads tenant headers from the incoming request
 * and forwards them to the Laravel API. This is needed because Zustand stores
 * (used by the browser axios interceptor) don't work in Server Components.
 */
async function serverFetch<T>(path: string): Promise<T> {
  const h = await headers();
  const tenantId = h.get("x-tenant-id") ?? "";
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0];
  const tenantDomain = h.get("x-tenant-domain") ?? host;

  const url = `${resolveApiBaseUrl()}${path}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
      ...(tenantDomain ? { "X-Tenant-Domain": tenantDomain } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  return res.json();
}

function toQuery(filters: CatalogFilters, page: number, perPage: number): string {
  const params = buildCatalogParams(filters, page, perPage);

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();

  return qs ? `?${qs}` : "";
}

/** Server-only public course catalog API (reads tenant headers from next/headers). */
export const catalogServerService = {
  getStages: cache(async (): Promise<StageItem[] | null> => {
    try {
      const json = await serverFetch<{ items: Raw[] }>("/public/educational-stages");
      if (!Array.isArray(json?.items)) {
        return null;
      }

      return json.items.map((item) => ({
        id: Number(item.id),
        name: item.name,
        description: item.description ?? null,
        image: item.image ?? null,
        link: item.link ?? null,
      }));
    } catch {
      return null;
    }
  }),

  getCourses: cache(
    async (
      filters: CatalogFilters = {},
      page = 1,
      perPage: number = CATALOG_PAGE_SIZE,
    ): Promise<CatalogCoursesResponse | null> => {
      try {
        const json = await serverFetch<Raw>(`/public/courses${toQuery(filters, page, perPage)}`);
        return formatCatalogCoursesResponse(json);
      } catch {
        return null;
      }
    },
  ),
};
