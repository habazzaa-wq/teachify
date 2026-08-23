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
import {
  isStudentRoute,
  resolveStudentSession,
} from "@/services/api/tenant-student-fetch";
import { isSuperAdminPath, routes } from "@/constants/routes";

interface AuthProviderValue {
  status: ReturnType<typeof useAuthStore.getState>["status"];
  user: ReturnType<typeof useAuthStore.getState>["user"];
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthProviderValue | null>(null);

export { AuthContext };

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
  const refreshingPromiseRef = useRef<Promise<boolean> | null>(null);
  // Tracks the token we most recently obtained from a refresh so we can detect
  // the "refreshed but the new token still 401s" case and break the loop.
  const lastRefreshedTokenRef = useRef<string | null>(null);

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
      // Send expired dashboard sessions back to the teacher login so they can
      // re-authenticate, instead of dumping them onto the public storefront
      // home page (which is confusing and often unusable for a signed-out
      // teacher). Public routes keep their own (guest) behavior.
      router.replace(routes.tenantLogin);
    }
  }, [clearAuth, clearTenant, queryClient, router]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Read at call time — bootstrap may have just re-seeded the store with a
    // different identity's token (student route after a teacher login).
    const currentRefresh = useAuthStore.getState().refreshToken;
    if (!currentRefresh) {
      handleStaleSession();
      return false;
    }

    if (refreshingPromiseRef.current) {
      return refreshingPromiseRef.current;
    }

    refreshingPromiseRef.current = (async (): Promise<boolean> => {
      try {
        const result = await authService.refresh({ refresh_token: currentRefresh });
        setAccessToken(result.access_token);
        lastRefreshedTokenRef.current = result.access_token;
        queryClient.invalidateQueries({
          predicate: (query) => !isPublicQueryKey(query.queryKey),
        });
        return true;
      } catch {
        handleStaleSession();
        return false;
      }
    })();

    try {
      return await refreshingPromiseRef.current;
    } finally {
      refreshingPromiseRef.current = null;
    }
  }, [setAccessToken, handleStaleSession, queryClient]);

  const bootstrap = useCallback(async () => {
    if (!activeTenant) {
      setStatus("unauthenticated");
      return;
    }

    // On student routes the public student session (public-register-state) is
    // the source of truth. A teacher/dashboard login must never resolve the
    // student context, so prefer the student's own token here.
    let token = accessToken;
    let refresh = refreshToken;
    if (isStudentRoute(pathname)) {
      const studentSession = resolveStudentSession(pathname);
      if (studentSession.accessToken) {
        token = studentSession.accessToken;
        refresh = studentSession.refreshToken ?? refresh;
      }
    }

    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    if (token !== accessToken || refresh !== refreshToken) {
      setTokens(token, refresh ?? "");
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
        const refreshed = await refreshSession();
        if (!refreshed) {
          return;
        }
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
        // Refresh succeeded but the retried /auth/me failed transiently
        // (rate limit, 5xx, network). The session is still valid — keep it
        // instead of logging the user out.
        setStatus("authenticated");
      }
    }
  }, [activeTenant, accessToken, refreshToken, pathname, setStatus, setUser, setTenantContext, refreshSession, setTokens]);

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
    router.replace(routes.home);
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

  // The student dashboard must always reflect the public student session, never
  // a different dashboard identity (e.g. a teacher signed in on /tenant-login).
  // When the shared auth store holds someone else's session while navigating on
  // to a student route, re-seed it from the student session and re-bootstrap so
  // the student's own context is resolved.
  useEffect(() => {
    if (status !== "authenticated" || isSuperAdminRoute) {
      return;
    }
    if (!isStudentRoute(pathname)) {
      return;
    }

    const studentSession = resolveStudentSession(pathname);
    if (!studentSession.accessToken) {
      return;
    }

    const current = useAuthStore.getState();
    if (current.accessToken === studentSession.accessToken) {
      return;
    }

    setTokens(
      studentSession.accessToken,
      studentSession.refreshToken ?? current.refreshToken ?? "",
    );
    if (studentSession.name || studentSession.avatar) {
      setUser({
        id: 0,
        name: studentSession.name ?? "",
        email: "",
        avatar: studentSession.avatar ?? null,
        is_platform_super_admin: false,
      });
    }
    setStatus("idle");
  }, [pathname, status, isSuperAdminRoute, setTokens, setUser, setStatus]);

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

      // If the in-flight request is already using the token we just refreshed,
      // refreshing again won't help — the 401 is persistent (e.g. the tenant
      // context isn't resolvable). Bail out instead of looping 401 → refresh
      // → 401 forever, which manifests as the page "constantly reloading".
      const currentToken = useAuthStore.getState().accessToken;
      if (currentToken && lastRefreshedTokenRef.current === currentToken) {
        handleStaleSession();
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
