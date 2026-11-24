"use client";

/**
 * Tracks an intentional sign-out so route guards and stale-session handlers
 * never race the logout navigation with their own `/tenant-login` redirect.
 *
 * The marker is module-scoped (no React state) so it is visible synchronously
 * to every effect that runs after the auth store is cleared. It is dropped as
 * soon as the app lands on a path other than the one where logout started.
 */
let logoutOriginPath: string | null = null;

/** Mark the beginning of an intentional sign-out. */
export function beginAuthLogout(pathname: string): void {
  logoutOriginPath = pathname;
}

/** True while the sign-out navigation has not committed yet. */
export function isAuthLogoutPending(): boolean {
  return logoutOriginPath !== null;
}

/** Clear the marker once the router has moved away from the logout page. */
export function syncAuthLogout(pathname: string): void {
  if (logoutOriginPath !== null && pathname !== logoutOriginPath) {
    logoutOriginPath = null;
  }
}

/** Drop the marker (e.g. after a new login). */
export function clearAuthLogout(): void {
  logoutOriginPath = null;
}
