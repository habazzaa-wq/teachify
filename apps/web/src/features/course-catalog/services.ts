import api from "@/services/api/axios";
import type { StageItem } from "@/features/homepage/educational-stages/types";
import { formatCatalogCourse, formatCatalogCoursesResponse } from "./format";
import { buildCatalogParams } from "./params";
import type { CatalogCoursesResponse, CatalogFilters } from "./types";

export const catalogService = {
  /** Public, unauthenticated: active educational stages for the current tenant. */
  async getStages(): Promise<StageItem[]> {
    const { data } = await api.get<{ items: StageItem[] }>("/public/educational-stages");
    return Array.isArray(data?.items) ? data.items : [];
  },

  /** Public catalog of published courses with filters + pagination. */
  async getCourses(
    filters: CatalogFilters = {},
    page = 1,
  ): Promise<CatalogCoursesResponse> {
    const { data } = await api.get("/public/courses", {
      params: buildCatalogParams(filters, page),
    });
    return formatCatalogCoursesResponse(data);
  },

  /** Formatter exposed for other consumers (e.g. list pages reusing the card). */
  formatCourse: formatCatalogCourse,
};
