/**
 * Centralized, type-safe TanStack Query key factories.
 *
 * Keys are arrays so partial invalidation works: e.g. invalidating
 * ["tenant"] clears both the context and any derived queries.
 */
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  session: () => [...authKeys.all, "session"] as const,
};
