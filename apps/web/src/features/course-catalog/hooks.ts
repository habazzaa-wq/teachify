"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CATALOG_QUERY_KEY, CATALOG_STAGES_KEY } from "./constants";
import { catalogService } from "./services";
import type { CatalogFilters } from "./types";

export const catalogKeys = {
  stages: [CATALOG_STAGES_KEY, "public"] as const,
  courses: (filters: CatalogFilters, page: number) =>
    [CATALOG_QUERY_KEY, "courses", filters, page] as const,
};

export function useCatalogStages() {
  return useQuery({
    queryKey: catalogKeys.stages,
    queryFn: catalogService.getStages,
    staleTime: 30_000,
  });
}

export function useCatalogCourses(filters: CatalogFilters, page: number) {
  return useQuery({
    queryKey: catalogKeys.courses(filters, page),
    queryFn: () => catalogService.getCourses(filters, page),
    placeholderData: keepPreviousData,
  });
}
