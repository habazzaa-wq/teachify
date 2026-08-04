/**
 * Window event names dispatched by the API layer on auth/tenant failures and
 * listened to by AuthProvider / TenantProvider.
 *
 * Kept in a dependency-free constants module so providers can subscribe to
 * these events without pulling the axios module (and its transitive store
 * dependencies) into the shared base bundle.
 */
export const AUTH_EVENTS = {
  unauthorized: "app:unauthorized",
  tenantInvalid: "app:tenant-invalid",
  tokenExpired: "app:token-expired",
} as const;

export type AuthEventName = (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS];
