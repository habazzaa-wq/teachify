import { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/types/common.types";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
          const status = (error as unknown as ApiError)?.status ?? 0;
          if ([401, 403, 404, 422].includes(status)) return false;
          if (status === 0) return failureCount < 2;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
