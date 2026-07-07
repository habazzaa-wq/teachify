"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_AUTH_EVENTS } from "@/services/api/platform-axios";
import { platformAuthService } from "@/services/api/platform-auth.service";
import { usePlatformAuthStore } from "@/stores/platform-auth.store";
import type { PlatformLoginRequest } from "@/types/platform-auth.types";
import { routes } from "@/constants/routes";

const BOOTSTRAP_TIMEOUT_MS = 20_000;

interface PlatformAuthContextValue {
  status: ReturnType<typeof usePlatformAuthStore.getState>["status"];
  user: ReturnType<typeof usePlatformAuthStore.getState>["user"];
  platformAdmin: ReturnType<
    typeof usePlatformAuthStore.getState
  >["platformAdmin"];
  login: (credentials: PlatformLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

export function PlatformAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const token = usePlatformAuthStore((state) => state.token);
  const user = usePlatformAuthStore((state) => state.user);
  const platformAdmin = usePlatformAuthStore((state) => state.platformAdmin);
  const status = usePlatformAuthStore((state) => state.status);
  const setSession = usePlatformAuthStore((state) => state.setSession);
  const setStatus = usePlatformAuthStore((state) => state.setStatus);
  const clear = usePlatformAuthStore((state) => state.clear);

  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);
  const bootstrapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bootstrap = useCallback(async () => {
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    if (bootstrapPromiseRef.current) {
      return bootstrapPromiseRef.current;
    }

    const pendingBootstrap = (async () => {
      setStatus("loading");

      bootstrapTimeoutRef.current = setTimeout(() => {
        clear();
        bootstrapPromiseRef.current = null;
      }, BOOTSTRAP_TIMEOUT_MS);

      try {
        const data = await platformAuthService.me();

        if (bootstrapTimeoutRef.current) {
          clearTimeout(bootstrapTimeoutRef.current);
          bootstrapTimeoutRef.current = null;
        }

        setSession({
          token,
          user: data.user,
          platformAdmin: data.platform_admin,
        });
      } catch {
        if (bootstrapTimeoutRef.current) {
          clearTimeout(bootstrapTimeoutRef.current);
          bootstrapTimeoutRef.current = null;
        }
        clear();
      } finally {
        bootstrapPromiseRef.current = null;
      }
    })();

    bootstrapPromiseRef.current = pendingBootstrap;
    return pendingBootstrap;
  }, [clear, setSession, setStatus, token]);

  const login = useCallback(
    async (credentials: PlatformLoginRequest) => {
      const data = await platformAuthService.login(credentials);

      setSession({
        token: data.token,
        user: data.user,
        platformAdmin: data.platform_admin,
      });
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      await platformAuthService.logout();
    } catch {
    }

    clear();
    router.replace(routes.superadminLogin);
  }, [clear, router]);

  useEffect(() => {
    if (token && status === "idle") {
      void bootstrap();
      return;
    }

    if (!token && status !== "unauthenticated") {
      setStatus("unauthenticated");
    }
  }, [bootstrap, setStatus, status, token]);

  useEffect(() => {
    function handleUnauthorized() {
      clear();
    }

    window.addEventListener(
      PLATFORM_AUTH_EVENTS.unauthorized,
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        PLATFORM_AUTH_EVENTS.unauthorized,
        handleUnauthorized,
      );
    };
  }, [clear]);

  useEffect(() => {
    return () => {
      if (bootstrapTimeoutRef.current) {
        clearTimeout(bootstrapTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo<PlatformAuthContextValue>(
    () => ({
      status,
      user,
      platformAdmin,
      login,
      logout,
      bootstrap,
    }),
    [bootstrap, login, logout, platformAdmin, status, user],
  );

  return (
    <PlatformAuthContext.Provider value={value}>
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth(): PlatformAuthContextValue {
  const ctx = useContext(PlatformAuthContext);

  if (!ctx) {
    throw new Error("usePlatformAuth must be used within PlatformAuthProvider");
  }

  return ctx;
}
