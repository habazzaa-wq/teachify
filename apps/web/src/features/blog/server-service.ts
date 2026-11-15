import { cache } from "react";
import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import type { BlogListResponse, BlogPost } from "./types";

async function requestHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const host = (incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "").split(":")[0];
  const tenantDomain = incoming.get("x-tenant-domain") ?? host;
  const tenantId = incoming.get("x-tenant-id");

  return {
    Accept: "application/json",
    ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    ...(tenantDomain ? { "X-Tenant-Domain": tenantDomain } : {}),
  };
}

export const blogServerService = {
  list: cache(async (): Promise<BlogPost[] | null> => {
    const response = await fetch(`${resolveApiBaseUrl()}/public/blog`, {
      headers: await requestHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const result = (await response.json()) as BlogListResponse;
    return result.data;
  }),

  show: cache(async (slug: string): Promise<BlogPost | null> => {
    const response = await fetch(`${resolveApiBaseUrl()}/public/blog/${encodeURIComponent(slug)}`, {
      headers: await requestHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const result = (await response.json()) as { data: BlogPost };
    return result.data;
  }),

  page: cache(async (
    page = 1,
    perPage = 12,
    search = "",
    category = "",
  ): Promise<BlogListResponse | null> => {
    const query = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
    });
    if (search.trim()) query.set("search", search.trim());
    if (category.trim()) query.set("category", category.trim());
    const response = await fetch(`${resolveApiBaseUrl()}/public/blog?${query}`, {
      headers: await requestHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as BlogListResponse;
  }),
};
