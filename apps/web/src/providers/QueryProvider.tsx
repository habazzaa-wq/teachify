"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ApiError } from "@/types/common.types";

/**
 * TanStack Query client with sensible defaults:
 * - 30s stale time to avoid refetch thrash.
 * - Retries disabled for auth (401) and validation (422) failures.
 * - Errors are normalized ApiError objects.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              const status = (error as unknown as ApiError)?.status ?? 0;

              // Never retry auth, validation, forbidden, or not-found.
              if ([401, 403, 404, 422].includes(status)) {
                return false;
              }

              // Network errors: retry twice.
              if (status === 0) {
                return failureCount < 2;
              }

              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
