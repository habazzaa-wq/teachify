"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
import { useTenantContext } from "@/providers/TenantProvider";

interface AuthProviderValue {
  status: ReturnType<typeof useAuthStore.getState>["status"];
  user: ReturnType<typeof useAuthStore.getState>["user"];
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  isHydrated: boolean;
  isBootstrapping: boolean;
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
  const publicPaths = [
    routes.home,
    routes.publicCourse,
    routes.tenantLogin,
    "/register",
    "/tenant-not-found",
    "/privacy",
    "/terms",
    "/contact",
    "/about",
  ];

  return (
    publicPaths.some((p) => pathname === p) ||
    pathname.startsWith(`${routes.publicCourse}/`) ||
    pathname.startsWith("/stages") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/help")
  );
}

function readPersistedAuthTokens(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }

  try {
    const stored = localStorage.getItem("auth-state");
    if (!stored) {
      return { accessToken: null, refreshToken: null };
    }

    const state = JSON.parse(stored)?.state;
    return {
      accessToken:
        typeof state?.accessToken === "string" ? state.accessToken : null,
      refreshToken:
        typeof state?.refreshToken === "string" ? state.refreshToken : null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const isSuperAdminRoute = isSuperAdminPath(pathname);
  const refreshingPromiseRef = useRef<Promise<boolean> | null>(null);
  const bootstrappingRef = useRef(false);
  const [isBootstrapping, setIsBootstrappingState] = useState(false);
  const setIsBootstrapping = useCallback((v: boolean) => {
    bootstrappingRef.current = v;
    setIsBootstrappingState(v);
  }, []);

  // Tracks the token we most recently obtained from a refresh so we can detect
  // the "refreshed but the new token still 401s" case and break the loop.
  const lastRefreshedTokenRef = useRef<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const isHydrated = useAuthStore((state) => state._hasHydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAuth = useAuthStore((state) => state.clear);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const { activeTenant: contextTenant } = useTenantContext();
  const storeActiveTenant = useTenantStore((state) => state.activeTenant);
  const activeTenant = storeActiveTenant ?? contextTenant;
  const setTenantContext = useTenantStore((state) => state.setTenantContext);
  const clearTenant = useTenantStore((state) => state.clear);

  const handleStaleSession = useCallback(() => {
    // Only clear and redirect if we are actually on a protected route.
    // This prevents accidental logouts during transition or if bootstrap fails transiently.
    const currentPath = window.location.pathname;
    const isGuest = isPublicRoute(currentPath);
    if (isGuest) {
      console.log("[AuthProvider] handleStaleSession ignored: currently on a guest route.");
      return;
    }

    // A check to prevent multiple rapid redirects
    if (statusRef.current === "loading" || !isHydrated) {
      console.warn("[AuthProvider] handleStaleSession called while loading or not hydrated, ignoring.");
      return;
    }

    // If we have an accessToken and we are on a protected route, we might be 
    // in the middle of a bootstrap/refresh.
    const storeToken = useAuthStore.getState().accessToken;
    const storageData = typeof window !== "undefined" ? localStorage.getItem("auth-state") : null;
    const storageToken = storageData ? JSON.parse(storageData)?.state?.accessToken : null;
    const hasToken = Boolean(storeToken || storageToken);

    if (hasToken && (statusRef.current === "idle" || statusRef.current === "unauthenticated")) {
       console.warn("[AuthProvider] handleStaleSession called during bootstrap/refresh with token, ignoring.");
       // Ensure status stays idle to prevent ProtectedRoute from redirecting
       if (statusRef.current === "unauthenticated") {
          console.log("[AuthProvider] Forcing status back to idle because token exists. Current statusRef:", statusRef.current);
          setStatus("idle");
       }
       return;
    }

    // NEW: If we are authenticated but something triggered a 401,
    // don't immediately redirect if we have a token.
    // The axios interceptor/events will handle refresh if possible.
    if (hasToken && statusRef.current === "authenticated") {
       console.warn("[AuthProvider] handleStaleSession called but we are authenticated and have a token. Probably a transient error. Ignoring.");
       return;
    }

    console.warn("[AuthProvider] Session is truly stale, clearing auth data.");
    clearAuth();
    invalidateSession(queryClient);
    clearTenant();
    
    // Send expired dashboard sessions back to the teacher login so they can
    // re-authenticate, instead of dumping them onto the public storefront
    // home page.
    if (window.location.pathname !== routes.tenantLogin) {
      console.log("[AuthProvider] Redirecting to tenant login.");
      router.replace(routes.tenantLogin);
    }
  }, [clearAuth, clearTenant, queryClient, router, isHydrated, setStatus]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Read at call time — bootstrap may have just re-seeded the store with a
    // different identity's token (student route after a teacher login).
    const currentRefresh =
      useAuthStore.getState().refreshToken ??
      readPersistedAuthTokens().refreshToken;
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
      } catch (err: unknown) {
        const errorStatus =
          (err as { status?: number; response?: { status?: number } })?.status ??
          (err as { response?: { status?: number } })?.response?.status;
        // Only clear credentials on genuine auth rejections (401 / 403).
        // Transient errors (429 Too Many Attempts, 5xx server issues, or offline)
        // must NOT destroy the session.
        if (errorStatus === 401 || errorStatus === 403) {
          // Before killing the session on 401/403, check if it might be a temporary
          // glitch or a mismatch that doesn't warrant a full logout.
          // If we are already authenticated in the store, we can afford one failed refresh
          // attempt without immediately redirecting.
          const currentToken = useAuthStore.getState().accessToken;
          if (currentToken && !lastRefreshedTokenRef.current) {
             console.warn("Refresh failed but we have a token, not clearing yet.");
             // If we are on a public route, it's fine. If we are on a protected route,
             // we'll stay idle/loading until eventually ProtectedRoute or someone else
             // might trigger another attempt, but we avoid the direct redirect here.
             return false;
          }

          console.error("Refresh failed with 401/403, handling stale session.");
          handleStaleSession();
        } else {
          console.warn("Session refresh transient failure, keeping tokens:", err);
        }
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
    // Wait for tenant before bootstrapping
    if (!activeTenant) {
      console.warn("[AuthProvider] bootstrap called but activeTenant is missing. Aborting.");
      return;
    }

    if (bootstrappingRef.current) return;
    setIsBootstrapping(true);

    const persistedTokens = readPersistedAuthTokens();
    const currentAuth = useAuthStore.getState();

    // On student routes the public student session (public-register-state) is
    // the source of truth. A teacher/dashboard login must never resolve the
    // student context, so prefer the student's own token here.
    let token = currentAuth.accessToken ?? persistedTokens.accessToken ?? accessToken;
    let refresh =
      currentAuth.refreshToken ?? persistedTokens.refreshToken ?? refreshToken;
    if (isStudentRoute(pathname)) {
      const studentSession = resolveStudentSession(pathname);
      if (studentSession.accessToken) {
        token = studentSession.accessToken;
        refresh = studentSession.refreshToken ?? refresh;
      }
    }

    if (!token) {
      if (isHydrated) {
        console.log("[AuthProvider] bootstrap: No token found, setting unauthenticated.");
        setStatus("unauthenticated");
        setIsBootstrapping(false);
      }
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
      setStatus("authenticated");
    } catch (err: unknown) {
      const errorStatus =
        (err as { status?: number; response?: { status?: number } })?.status ??
        (err as { response?: { status?: number } })?.response?.status;

      if (errorStatus === 401) {
        console.warn("Bootstrap failed with 401. Attempting refresh.");
        // Token might be expired, try refresh
        try {
          // If we got a 401 but we're already loading/authenticated,
          // maybe another request already triggered a refresh or we're in a race.
          const refreshed = await refreshSession();
          if (!refreshed) {
            console.error("Bootstrap refresh attempt failed.");
            return;
          }
          console.log("Bootstrap refresh successful, retrying resolveContext.");
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
          setStatus("authenticated");
        } catch (retryErr) {
          const retryStatus =
            (retryErr as { status?: number; response?: { status?: number } })?.status ??
            (retryErr as { response?: { status?: number } })?.response?.status;
            
          // If retry fails with 401, then it's really stale
          if (retryStatus === 401) {
            console.error("Bootstrap retry failed with 401, handling stale session.");
            handleStaleSession();
          } else if (useAuthStore.getState().user) {
            // Transient error on retry, but we have user data, stay authenticated
            console.warn("Bootstrap retry failed with non-401, keeping existing session.");
            setStatus("authenticated");
          } else {
            console.error("Bootstrap retry failed, setting unauthenticated.");
            setStatus("unauthenticated");
          }
        }
      } else if (errorStatus === 429 || (errorStatus && errorStatus >= 500) || !errorStatus) {
        // Transient error (429 Rate Limit, 5xx, or network glitch/offline)
        // If we already hold user data in the persisted store, keep authenticated.
        if (useAuthStore.getState().user) {
          console.warn(`Bootstrap transient error ${errorStatus}, keeping authenticated.`);
          setStatus("authenticated");
        } else {
          // No user data and transient error, we can't show dashboard but don't kill session
          console.error(`Bootstrap transient error ${errorStatus} and no user data, setting unauthenticated.`);
          setStatus("unauthenticated");
        }
      } else {
        // Genuine error (403, 404, etc.)
        console.error(`Bootstrap failed with error ${errorStatus}, handling stale session.`);
        handleStaleSession();
      }
    } finally {
      setIsBootstrapping(false);
    }
  }, [
    activeTenant,
    accessToken,
    refreshToken,
    pathname,
    isHydrated,
    setStatus,
    setUser,
    setTenantContext,
    refreshSession,
    setTokens,
    setIsBootstrapping,
    handleStaleSession,
  ]);

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
    if (isSuperAdminRoute || !isHydrated) {
      return;
    }

    const isGuestRoute = isPublicRoute(pathname);

    const persistedTokens = readPersistedAuthTokens();
    const effectiveToken =
      useAuthStore.getState().accessToken ?? persistedTokens.accessToken;

    if (status === "idle" || (status === "unauthenticated" && effectiveToken)) {
      if (effectiveToken) {
        // A persisted token exists: bootstrap as soon as activeTenant is available.
        if (activeTenant) {
          if (!bootstrappingRef.current) {
            console.log("[AuthProvider] Persisted token found, starting bootstrap.");
            void bootstrap();
          }
        } else {
          // If activeTenant is not available but we have a token, we MUST ensure 
          // a bootstrap attempt happens even if delayed.
          console.log("[AuthProvider] Token found but activeTenant missing. Waiting for tenant.");
          
          if (status === "unauthenticated") {
             console.log("[AuthProvider] Forcing status to idle while waiting for tenant.");
             setStatus("idle");
          }
        }
      } else {
        if (isGuestRoute) {
          console.log("[AuthProvider] No token and on guest route, setting unauthenticated.");
          setStatus("unauthenticated");
        } else if (activeTenant) {
          console.log("[AuthProvider] No token and activeTenant ready, setting unauthenticated.");
          setStatus("unauthenticated");
        }
      }
    }
  }, [activeTenant, bootstrap, isSuperAdminRoute, pathname, status, setStatus, isHydrated]);

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

  useEffect(() => {
    function handleUnauthorized() {
      if (isSuperAdminPath(window.location.pathname)) {
        return;
      }

      // If we're already on a guest route, don't trigger stale session logic
      // which might cause redundant redirects.
      if (isPublicRoute(window.location.pathname)) {
        return;
      }

      // If we are currently "authenticated" in the store but got a 401,
      // give axios interceptor a chance to dispatch tokenExpired first
      // or AuthProvider bootstrap to try a refresh.
      if (statusRef.current === "authenticated" || statusRef.current === "loading") {
        console.warn("Unauthorized event received while authenticated/loading. Ignoring to allow refresh or retry logic.");
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
    isHydrated,
    isBootstrapping,
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
