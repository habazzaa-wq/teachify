import { headers } from "next/headers";
import { resolveApiBaseUrl } from "@/config/env";
import type { StageItem } from "@/features/homepage/educational-stages/types";
import { formatStageCourse, formatStageCoursesResponse } from "./format";
import { buildStageCoursesParams } from "./params";
import type { StageCourseFilters, StageCoursesResponse } from "./types";

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
  const tenantDomain = h.get("x-tenant-domain") ?? "";

  const url = `${resolveApiBaseUrl()}${path}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
      ...(tenantDomain ? { "X-Tenant-Domain": tenantDomain } : {}),
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  return res.json();
}

function toQuery(filters: StageCourseFilters, page: number): string {
  const params = buildStageCoursesParams(0, filters, page);
  delete params.educational_stage_id;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();

  return qs ? `?${qs}` : "";
}

/** Server-only public stage + courses API (reads tenant headers from next/headers). */
export const stageServerService = {
  async getStage(stageId: number): Promise<StageItem | null> {
    try {
      const json = await serverFetch<{ data: Raw }>(`/public/educational-stages/${stageId}`);
      if (!json.data) {
        return null;
      }

      return {
        id: Number(json.data.id),
        name: json.data.name,
        description: json.data.description ?? null,
        image: json.data.image ?? null,
        link: json.data.link ?? null,
      };
    } catch {
      return null;
    }
  },

  async getCourses(
    stageId: number,
    filters: StageCourseFilters = {},
    page = 1,
  ): Promise<StageCoursesResponse | null> {
    try {
      const json = await serverFetch<Raw>(
        `/public/courses?educational_stage_id=${stageId}${toQuery(filters, page)}`,
      );
      return formatStageCoursesResponse(json);
    } catch {
      return null;
    }
  },

  /** Raw course used for JSON-LD (title + slug only). */
  formatCourse: formatStageCourse,
};
