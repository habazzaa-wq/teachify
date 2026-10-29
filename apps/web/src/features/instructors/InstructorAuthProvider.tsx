"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { instructorApi } from "./api";
import { useInstructorAuthStore } from "./store";
import { useTenantContext } from "@/providers/TenantProvider";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import type { InstructorMembership, InstructorUser } from "./types";

interface InstructorAuthContextValue {
  user: InstructorUser | null;
  membership: InstructorMembership | null;
  accessToken: string | null;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  changePassword: (password: string, confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
}

const InstructorAuthContext = createContext<InstructorAuthContextValue | null>(null);
const LOGIN_PATH = "/instructor/login";
const PASSWORD_PATH = "/instructor/change-password";

export function InstructorAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeTenant } = useTenantContext();
  const user = useInstructorAuthStore((state) => state.user);
  const membership = useInstructorAuthStore((state) => state.membership);
  const accessToken = useInstructorAuthStore((state) => state.accessToken);
  const refreshToken = useInstructorAuthStore((state) => state.refreshToken);
  const mustChangePassword = useInstructorAuthStore((state) => state.mustChangePassword);
  const hasHydrated = useInstructorAuthStore((state) => state.hasHydrated);
  const setSession = useInstructorAuthStore((state) => state.setSession);
  const setCredentials = useInstructorAuthStore((state) => state.setCredentials);
  const clear = useInstructorAuthStore((state) => state.clear);
  const verifiedToken = useRef<string | null>(null);

  useEffect(() => {
    useInstructorAuthStore.persist.rehydrate();
    const unsubscribe = useInstructorAuthStore.persist.onFinishHydration(() => {
      useInstructorAuthStore.getState().setHydrated(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hasHydrated || !membership || !activeTenant?.id) return;
    if (String(membership.tenant_id) !== String(activeTenant.id)) {
      clear();
      verifiedToken.current = null;
      router.replace(LOGIN_PATH);
    }
  }, [activeTenant?.id, clear, hasHydrated, membership, router]);

  useEffect(() => {
    if (!hasHydrated || !accessToken || !membership || mustChangePassword) return;
    if (String(membership.tenant_id) !== String(activeTenant?.id ?? "")) return;
    if (verifiedToken.current === accessToken) return;

    let cancelled = false;
    void (async () => {
      try {
        let token = accessToken;
        let response;
        try {
          response = await instructorApi.me(token);
        } catch (cause) {
          if (!axios.isAxiosError(cause) || cause.response?.status !== 401 || !refreshToken) {
            throw cause;
          }

          token = (await instructorApi.refresh(refreshToken)).access_token;
          response = await instructorApi.me(token);
        }

        if (cancelled) return;
        verifiedToken.current = token;
        setSession(
          response.user,
          response.membership,
          token,
          refreshToken,
          Boolean(response.membership.must_change_password),
        );
        if (response.membership.must_change_password) router.replace(PASSWORD_PATH);
      } catch {
        if (cancelled) return;
        clear();
        router.replace(LOGIN_PATH);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    activeTenant?.id,
    clear,
    hasHydrated,
    membership,
    mustChangePassword,
    refreshToken,
    router,
    setSession,
  ]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (pathname === LOGIN_PATH) {
      if (accessToken && membership) {
        router.replace(mustChangePassword ? PASSWORD_PATH : "/instructor/courses");
      }
      return;
    }
    if (!accessToken || !membership) {
      router.replace(LOGIN_PATH);
      return;
    }
    if (mustChangePassword && pathname !== PASSWORD_PATH) {
      router.replace(PASSWORD_PATH);
    } else if (!mustChangePassword && pathname === PASSWORD_PATH) {
      router.replace("/instructor/courses");
    }
  }, [accessToken, hasHydrated, membership, mustChangePassword, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await instructorApi.login(email, password);
    setSession(
      session.user,
      session.membership,
      session.access_token,
      session.refresh_token,
      session.must_change_password,
    );
    verifiedToken.current = null;
    return session.must_change_password;
  }, [setSession]);

  const changePassword = useCallback(async (password: string, confirmation: string) => {
    if (!accessToken) throw new Error("Instructor session is missing.");
    const credentials = await instructorApi.changePassword(accessToken, password, confirmation);
    setCredentials(credentials.access_token, credentials.refresh_token);
    verifiedToken.current = credentials.access_token;
  }, [accessToken, setCredentials]);

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await instructorApi.logout(accessToken);
      } finally {
        clear();
        verifiedToken.current = null;
        router.replace(LOGIN_PATH);
      }
      return;
    }
    clear();
    router.replace(LOGIN_PATH);
  }, [accessToken, clear, router]);

  const value = useMemo(
    () => ({ user, membership, accessToken, mustChangePassword, login, changePassword, logout }),
    [user, membership, accessToken, mustChangePassword, login, changePassword, logout],
  );

  if (!hasHydrated) return <AppLoadingState className="min-h-screen" />;
  if (pathname !== LOGIN_PATH && (!accessToken || !membership)) {
    return <AppLoadingState className="min-h-screen" />;
  }
  if (pathname !== LOGIN_PATH && mustChangePassword && pathname !== PASSWORD_PATH) {
    return <AppLoadingState className="min-h-screen" />;
  }
  if (pathname !== LOGIN_PATH && !mustChangePassword && pathname === PASSWORD_PATH) {
    return <AppLoadingState className="min-h-screen" />;
  }

  return (
    <InstructorAuthContext.Provider value={value}>
      {children}
    </InstructorAuthContext.Provider>
  );
}

export function useInstructorAuth(): InstructorAuthContextValue {
  const context = useContext(InstructorAuthContext);
  if (!context) throw new Error("useInstructorAuth must be used within InstructorAuthProvider");
  return context;
}
