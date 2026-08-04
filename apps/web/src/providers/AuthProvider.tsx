"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_EVENTS } from "@/constants/auth-events";
import { authService } from "@/services/api/auth.service";
import { tenantService } from "@/services/api/tenant.service";
import { authKeys } from "@/services/queryKeys";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import type { CurrentUserResponse, LoginRequest } from "@/types/auth.types";
import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { isSuperAdminPath, routes } from "@/constants/routes";

interface AuthProviderValue {
  status: ReturnType<typeof useAuthStore.getState>["status"];
  user: ReturnType<typeof useAuthStore.getState>["user"];
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthProviderValue | null>(null);

/**
 * Public, user-independent query keys that must survive session invalidation
 * so public pages (hero, news, stages, ...) don't flash a fallback/refetch
 * when a guest session 401s or an expired token is cleared.
 */
const PUBLIC_QUERY_KEYS: readonly (readonly string[])[] = [
  ["hero", "public"],
  ["news", "public"],
  ["news", "ticker"],
  ["stages", "public"],
  ["whyChooseUs", "public"],
  ["homepage-courses", "public"],
];

function isPublicQueryKey(queryKey: readonly unknown[]): boolean {
  return PUBLIC_QUERY_KEYS.some(
    (key) => key.length === queryKey.length && key.every((part, i) => part === queryKey[i]),
  );
}

function invalidateSession(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: authKeys.me() });
  queryClient.removeQueries({ queryKey: authKeys.all });
  queryClient.removeQueries({
    predicate: (query) => !isPublicQueryKey(query.queryKey),
  });
}

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === routes.home ||
    pathname === routes.publicCourse ||
    pathname.startsWith(`${routes.publicCourse}/`) ||
    pathname.startsWith("/stages") ||
    pathname === routes.tenantLogin ||
    pathname === "/register" ||
    pathname === "/tenant-not-found"
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const isSuperAdminRoute = isSuperAdminPath(pathname);
  const refreshingRef = useRef(false);

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setUser = useAuthStore((state) => state.setUser);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAuth = useAuthStore((state) => state.clear);

  const activeTenant = useTenantStore((state) => state.activeTenant);
  const setTenantContext = useTenantStore((state) => state.setTenantContext);
  const clearTenant = useTenantStore((state) => state.clear);

  const handleStaleSession = useCallback(() => {
    clearAuth();
    invalidateSession(queryClient);
    if (!isPublicRoute(window.location.pathname)) {
      clearTenant();
      router.replace("/tenant-login");
    }
  }, [clearAuth, clearTenant, queryClient, router]);

  const refreshSession = useCallback(async () => {
    if (refreshingRef.current || !refreshToken) return;
    refreshingRef.current = true;

    try {
      const result = await authService.refresh({ refresh_token: refreshToken });
      setAccessToken(result.access_token);
    } catch {
      handleStaleSession();
    } finally {
      refreshingRef.current = false;
    }
  }, [refreshToken, setAccessToken, handleStaleSession]);

  const bootstrap = useCallback(async () => {
    if (!activeTenant) {
      setStatus("unauthenticated");
      return;
    }

    if (!accessToken) {
      setStatus("unauthenticated");
      return;
    }

    setStatus("loading");

    try {
      const context = await tenantService.resolveContext();

      setTenantContext({
        tenant: context.tenant,
        membership: context.membership,
        roles: context.roles,
        permissions: context.permissions,
        abilities: context.abilities,
        navigation: context.navigation,
      });
      setUser(context.user);
    } catch {
      // Token might be expired, try refresh
      try {
        await refreshSession();
        // Retry bootstrap with new token
        const context = await tenantService.resolveContext();
        setTenantContext({
          tenant: context.tenant,
          membership: context.membership,
          roles: context.roles,
          permissions: context.permissions,
          abilities: context.abilities,
          navigation: context.navigation,
        });
        setUser(context.user);
      } catch {
        clearAuth();
      }
    }
  }, [activeTenant, accessToken, setStatus, setUser, setTenantContext, refreshSession, clearAuth]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const result = await authService.login(credentials);

      // Store tokens
      setTokens(result.access_token, result.refresh_token);

      // Resolve the full context from login response
      const loginData: CurrentUserResponse = {
        user: result.user,
        tenant: result.tenant,
        membership: result.membership,
        roles: result.roles,
        permissions: result.permissions,
        abilities: result.abilities,
        navigation: result.navigation,
        subscription: result.subscription,
        plan: result.plan,
        feature_flags: result.feature_flags,
      };
      const context = await tenantService.resolveFromLogin(loginData);

      setTenantContext({
        tenant: context.tenant,
        membership: context.membership,
        roles: context.roles,
        permissions: context.permissions,
        abilities: context.abilities,
        navigation: context.navigation,
      });
      setUser(context.user);
    },
    [setTenantContext, setUser, setTokens],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Session may already be gone; continue with client cleanup.
    }

    clearAuth();
    clearTenant();
    invalidateSession(queryClient);
    router.replace("/tenant-login");
  }, [clearAuth, clearTenant, queryClient, router]);

  // Bootstrap session on mount when a tenant is already known
  useEffect(() => {
    if (isSuperAdminRoute) {
      return;
    }

    const isGuestRoute =
      pathname === routes.tenantLogin ||
      pathname === "/register" ||
      pathname === "/tenant-not-found";

    if (status === "idle") {
      if (activeTenant && !isGuestRoute) {
        void bootstrap();
      } else {
        setStatus("unauthenticated");
      }
    }
  }, [activeTenant, bootstrap, isSuperAdminRoute, pathname, status, setStatus]);

  // React to 401 from tenant API requests
  useEffect(() => {
    function handleUnauthorized() {
      if (isSuperAdminPath(window.location.pathname)) {
        return;
      }

      handleStaleSession();
    }

    function handleTokenExpired() {
      if (isSuperAdminPath(window.location.pathname)) {
        return;
      }

      void refreshSession();
    }

    window.addEventListener(AUTH_EVENTS.unauthorized, handleUnauthorized);
    window.addEventListener(AUTH_EVENTS.tokenExpired, handleTokenExpired);

    return () => {
      window.removeEventListener(AUTH_EVENTS.unauthorized, handleUnauthorized);
      window.removeEventListener(AUTH_EVENTS.tokenExpired, handleTokenExpired);
    };
  }, [handleStaleSession, refreshSession]);

  const value: AuthProviderValue = {
    status,
    user,
    login,
    logout,
    bootstrap,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthProviderValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
}
