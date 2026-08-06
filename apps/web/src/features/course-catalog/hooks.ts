"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { catalogKeys } from "./keys";
import { catalogService } from "./services";
import type { CatalogFilters } from "./types";

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
