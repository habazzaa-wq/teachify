import { CATALOG_QUERY_KEY, CATALOG_STAGES_KEY } from "./constants";
import type { CatalogFilters } from "./types";

export const catalogKeys = {
  stages: [CATALOG_STAGES_KEY, "public"] as const,
  courses: (filters: CatalogFilters, page: number) =>
    [CATALOG_QUERY_KEY, "courses", filters, page] as const,
};
