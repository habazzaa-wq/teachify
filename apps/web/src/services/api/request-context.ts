/**
 * Lazy request-time context for the tenant API client.
 *
 * The axios module reads auth/tenant values through this indirection instead of
 * importing Zustand stores at module scope. Stores (or providers) register
 * lightweight readers that snapshot their current state only when a request is
 * actually being issued. This keeps axios.ts free of store/runtime imports so
 * it cannot pull them into the shared base bundle.
 */
export interface ApiRequestContext {
  accessToken: string | null;
  tenantId: string | null;
  tenantDomain: string | null;
}

const EMPTY_CONTEXT: ApiRequestContext = {
  accessToken: null,
  tenantId: null,
  tenantDomain: null,
};

const readers = new Set<() => Partial<ApiRequestContext>>();

/**
 * Register a reader that provides part of the request context at call time.
 * Readers are snapshotted per-request, so values are always current.
 */
export function addApiRequestContextReader(
  reader: () => Partial<ApiRequestContext>,
): void {
  readers.add(reader);
}

export function getApiRequestContext(): ApiRequestContext {
  if (readers.size === 0) {
    return EMPTY_CONTEXT;
  }

  const context: ApiRequestContext = { ...EMPTY_CONTEXT };

  for (const reader of readers) {
    try {
      Object.assign(context, reader());
    } catch {
      // A faulty reader must not break requests; other readers can still
      // provide the remaining context.
    }
  }

  return context;
}
