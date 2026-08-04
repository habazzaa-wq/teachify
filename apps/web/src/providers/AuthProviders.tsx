"use client";

import { AuthProvider } from "./AuthProvider";
import { PermissionProvider } from "./PermissionProvider";

/**
 * Session + permission providers required by authenticated routes.
 *
 * Mounted per-route-group (dashboard, student, login, public course, ...) so
 * anonymous pages such as the homepage never hydrate them.
 */
export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PermissionProvider>{children}</PermissionProvider>
    </AuthProvider>
  );
}
