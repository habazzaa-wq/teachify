"use client";

import { useState, useCallback, useEffect, useRef, useContext } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sun, Moon, GraduationCap, LogIn,
  Sparkles, ChevronLeft, Home, Layers, BookOpen, User,
  LogOut, Settings, ChevronDown, KeyRound, Wallet, CreditCard, Loader2, Search,
} from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { AuthContext } from "@/providers/AuthProvider";
import type { PublicRegisterResponse } from "@/features/auth/services/public-register.service";
import { CourseSearchDialog } from "@/features/course-catalog/components/CourseSearchDialog";
import { getNavbarIcon } from "@/features/settings/constants/navbar-icons";
import { cn } from "@/lib/cn";

const PublicRegisterCard = dynamic(
  () => import("@/features/auth/components/PublicRegisterCard").then((m) => m.PublicRegisterCard),
  { ssr: false },
);

const RegisterSuccessOverlay = dynamic(
  () => import("@/features/auth/components/PublicRegisterCard").then((m) => m.RegisterSuccessOverlay),
  { ssr: false },
);

const PublicLoginCard = dynamic(
  () => import("@/features/auth/components/PublicLoginCard").then((m) => m.PublicLoginCard),
  { ssr: false },
);

const ChangePasswordModal = dynamic(
  () => import("@/features/auth/components/ChangePasswordModal").then((m) => m.ChangePasswordModal),
  { ssr: false },
);

const StudentProfileDrawer = dynamic(
  () => import("@/features/student-profile/components/StudentProfileDrawer").then((m) => m.StudentProfileDrawer),
  { ssr: false },
);

const WalletBalanceBadge = dynamic(
  () => import("@/features/wallet/components/WalletBalanceBadge").then((m) => m.WalletBalanceBadge),
  { ssr: false, loading: WalletBalanceBadgeFallback },
);

const RechargeWalletModal = dynamic(
  () => import("@/features/wallet/components/RechargeWalletModal").then((m) => m.RechargeWalletModal),
  { ssr: false },
);

const OnlineRechargeModal = dynamic(
  () => import("@/features/wallet/components/OnlineRechargeModal").then((m) => m.OnlineRechargeModal),
  { ssr: false },
);

const primary = "var(--brand-primary)";
const secondary = "var(--brand-secondary)";

const STUDENT_PROFILE_QUERY_KEY = ["student-profile", "profile"];

type NavLink = {
  label: string;
  href: string;
  icon: React.ElementType;
  scrollTarget?: string;
};

const navLinks: NavLink[] = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "المراحل", href: "/#educational-stages", icon: Layers, scrollTarget: "educational-stages" },
  { label: "الكورسات", href: "/courses", icon: BookOpen },
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let walletBadgeOnClick: (() => void) | null = null;

function WalletBalanceBadgeFallback(): React.ReactNode {
  return (
    <button
      type="button"
      title="رصيد المحفظة"
      aria-label="رصيد المحفظة"
      onClick={() => walletBadgeOnClick?.()}
      className="group relative flex h-8 items-center gap-1.5 rounded-full px-2.5 opacity-60"
      style={{ border: "1px solid rgb(var(--brand-secondary-rgb) / 0.4)" }}
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: "linear-gradient(135deg, var(--brand-primary), rgb(var(--brand-primary-rgb) / 0.8))" }}
      >
        <Wallet className="h-3 w-3 text-white" />
      </span>
      <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: primary }} />
    </button>
  );
}

function ThemeBtn() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-10 w-10 items-center justify-center rounded-2xl transition-transform duration-300 hover:scale-110 active:scale-90 group"
      aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
    >
      {/* Default border */}
      <span
        className="absolute inset-0 rounded-2xl"
        style={{
          boxShadow: `inset 0 0 0 1px hsl(var(--border))`,
        }}
      />
      {/* Hover: bg = secondary, border = primary */}
      <span
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={{
          backgroundColor: secondary,
          border: `3px solid var(--brand-primary)`,
          boxShadow: `0 0 24px rgb(var(--brand-primary-rgb) / 0.251)`,
        }}
      />
      <span
        key={theme}
        className="home-icon-swap relative z-10 group-hover:text-[#2D1B00] transition-colors duration-300"
      >
        {theme === "light" ? (
          <Moon className="h-[18px] w-[18px]" />
        ) : (
          <Sun className="h-[18px] w-[18px]" />
        )}
      </span>
    </button>
  );
}

function NavLinkItem({
  href, label, icon: Icon, isActive, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  isActive: boolean; onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="group relative">
      <div
        className="relative flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {isActive ? (
          <>
            <span
              className="absolute inset-0 rounded-2xl"
              style={{
                backgroundColor: primary,
                boxShadow: `0 4px 24px rgb(var(--brand-primary-rgb) / 0.314)`,
              }}
            />
            <span
              className="absolute -inset-[3px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ border: `3px solid var(--brand-secondary)`, boxShadow: `0 0 24px rgb(var(--brand-secondary-rgb) / 0.314)` }}
            />
          </>
        ) : (
          <span
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{
              backgroundColor: secondary,
              border: `3px solid var(--brand-primary)`,
              boxShadow: `0 0 24px rgb(var(--brand-primary-rgb) / 0.251)`,
            }}
          />
        )}
        <Icon className={cn(
          "h-4 w-4 relative z-10 transition-all duration-300",
          isActive ? "text-white" : "text-muted-foreground/70 group-hover:text-[#2D1B00] group-hover:scale-110",
        )} />
        <span className={cn(
          "relative z-10 transition-colors duration-300",
          isActive ? "text-white" : "text-muted-foreground/70 group-hover:text-[#2D1B00]",
        )}>{label}</span>
      </div>
    </Link>
  );
}

function NavbarLogoImage({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-auto w-auto max-h-9 max-w-[200px] object-contain transition-all duration-500 group-hover:scale-105"
    />
  );
}

function NavbarLogoIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div
      className="relative flex h-9 w-9 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
      style={{
        backgroundColor: primary,
        boxShadow: `0 2px 20px rgb(var(--brand-primary-rgb) / 0.251)`,
      }}
    >
      <Icon className="h-5 w-5 text-white" />
      {/* Hover: border = secondary */}
      <span
        className="absolute -inset-[3.5px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ border: `3px solid var(--brand-secondary)`, boxShadow: `0 0 24px rgb(var(--brand-secondary-rgb) / 0.314)` }}
      />
    </div>
  );
}

export function PublicNavbar() {
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const pathname = usePathname();
  const auth = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState("/");

  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [studentRegistered, setStudentRegistered] = useState<{
    name: string;
    token: string;
    refreshToken?: string | null;
    avatar?: string | null;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("public-register-state");
      return stored ? JSON.parse(stored) as { name: string; token: string; refreshToken?: string | null; avatar?: string | null } : null;
    } catch {
      return null;
    }
  });

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [rechargeWalletOpen, setRechargeWalletOpen] = useState(false);
  const [onlineRechargeOpen, setOnlineRechargeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    walletBadgeOnClick = () => setRechargeWalletOpen(true);
  }, [setRechargeWalletOpen]);

  // Ctrl/Cmd+K toggles the course search dialog from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const setAuthTokens = useAuthStore((s) => s.setTokens);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const authUser = useAuthStore((s) => s.user);
  const setTenantContext = useTenantStore((s) => s.setTenantContext);
  const clearAuth = useAuthStore((s) => s.clear);

  // The home page runs without AuthProvider, so the auth store is only populated
  // when the user logs in/registers on this page. After a reload, `public-register-state`
  // is the source of truth — seed the auth store (token + user) from it so tenant API
  // calls (profile, avatar, wallet) carry a Bearer token and currentUser stays non-null.
  useEffect(() => {
    if (!studentRegistered) return;
    const current = useAuthStore.getState();
    if (studentRegistered.token && !current.accessToken) {
      setAuthTokens(studentRegistered.token, current.refreshToken ?? studentRegistered.refreshToken ?? "");
    }
    if (!current.user && (studentRegistered.name || studentRegistered.avatar)) {
      setAuthUser({
        id: 0,
        name: studentRegistered.name ?? "",
        email: "",
        avatar: studentRegistered.avatar ?? null,
        is_platform_super_admin: false,
      });
    }
  }, [studentRegistered, setAuthTokens, setAuthUser]);

  // The home page runs without AuthProvider, so the auth store is only populated
  // when the user logs in/registers on this page. On authenticated routes (e.g.
  // the student dashboard) the AuthProvider session is available instead.
  const authSessionActive = !!auth && !!authUser;
  const isLoggedIn = !!studentRegistered || authSessionActive;
  const sessionName = studentRegistered?.name ?? authUser?.name ?? "";
  const sessionAvatar = studentRegistered?.avatar ?? authUser?.avatar ?? null;

  const handleLogout = useCallback(() => {
    if (auth) {
      setProfileDropdownOpen(false);
      setStudentRegistered(null);
      try {
        localStorage.removeItem("public-register-state");
      } catch {
        // ignore storage errors
      }
      void auth.logout();
      return;
    }
    setStudentRegistered(null);
    localStorage.removeItem("public-register-state");
    clearAuth();
    setProfileDropdownOpen(false);
    queryClient.removeQueries({ queryKey: STUDENT_PROFILE_QUERY_KEY });
  }, [auth, clearAuth, queryClient]);

  // The student API layer clears `public-register-state` when it can no longer
  // refresh a 401 (the tokens were revoked by a login on /tenant-login and no
  // valid replacement exists). Sync the navbar back to a logged-out state then.
  useEffect(() => {
    const onSessionExpired = () => {
      setStudentRegistered(null);
      setProfileDropdownOpen(false);
      queryClient.removeQueries({ queryKey: STUDENT_PROFILE_QUERY_KEY });
    };
    window.addEventListener("public-session-expired", onSessionExpired);
    return () => window.removeEventListener("public-session-expired", onSessionExpired);
  }, [queryClient]);

  const scrollToSection = useCallback(
    (targetId: string) => {
      const scroll = () => {
        const el = document.getElementById(targetId);
        if (!el) return false;
        el.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
        return true;
      };

      if (scroll()) return;

      let tries = 0;
      const timer = window.setInterval(() => {
        tries += 1;
        if (scroll() || tries >= 5) {
          window.clearInterval(timer);
        }
      }, 120);
    },
    [],
  );

  const handleLoginSuccess = useCallback(
    (data: { name: string; avatar?: string | null; token?: string | null; refreshToken?: string | null }) => {
      const token = data.token || "";
      const state = { name: data.name, token, refreshToken: data.refreshToken ?? null, avatar: data.avatar ?? null };
      try {
        localStorage.setItem("public-register-state", JSON.stringify(state));
      } catch {
        // ignore storage errors
      }
      setLoginOpen(false);
      setRegisteredName(data.name);
      setStudentRegistered(state);
      setRegisterSuccess(true);
      queryClient.invalidateQueries({ queryKey: STUDENT_PROFILE_QUERY_KEY });
    },
    [queryClient],
  );

  const handleRegisterSuccess = useCallback(
    (response: PublicRegisterResponse) => {
      setAuthTokens(response.access_token, response.refresh_token);
      setTenantContext({
        tenant: response.tenant as any,
        membership: response.membership as any,
        roles: response.roles as any,
        permissions: response.permissions as any,
        abilities: response.abilities as any,
        navigation: response.navigation as any,
      });
      setAuthUser(response.user as any);

      const state = { name: response.user.name, token: response.access_token, refreshToken: response.refresh_token, avatar: response.user.avatar ?? null };
      localStorage.setItem("public-register-state", JSON.stringify(state));

      setRegisterOpen(false);
      setRegisteredName(response.user.name);
      setRegisterSuccess(true);
      setStudentRegistered(state);
      queryClient.invalidateQueries({ queryKey: STUDENT_PROFILE_QUERY_KEY });
    },
    [setAuthTokens, setAuthUser, setTenantContext, queryClient],
  );

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatar?: string | null }>).detail;
      if (!detail) return;

      // Keep the auth-store user avatar fresh so authUser?.avatar matches
      const current = useAuthStore.getState().user;
      if (current) {
        setAuthUser({ ...current, avatar: detail.avatar ?? current.avatar });
      }

      // Keep the navbar's mirrored session state + localStorage in sync
      setStudentRegistered((prev) => {
        if (!prev) return prev;
        const next = { ...prev, avatar: detail.avatar ?? prev.avatar };
        try {
          localStorage.setItem("public-register-state", JSON.stringify(next));
        } catch {
          // ignore storage errors
        }
        return next;
      });
    };

    window.addEventListener("student-profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("student-profile-updated", handleProfileUpdated);
  }, [setAuthUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logo = theme === "dark"
    ? tenant?.branding?.dark_logo
    : tenant?.branding?.light_logo ?? tenant?.branding?.logo;
  const tenantName = tenant?.name ?? "أكاديميتي";

  const logoType = tenant?.branding?.logo_type;
  const navbarLogoIcon = getNavbarIcon(tenant?.branding?.logo_icon);
  const navbarLogoImage = tenant?.branding?.logo_image;

  const showDynamicImage = logoType === "image" && !!navbarLogoImage;
  const showDynamicIcon = logoType === "icon" && !!navbarLogoIcon;
  const showLegacyImage = !showDynamicImage && !showDynamicIcon && !!logo;

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full py-2"
        role="banner"
      >

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="nav-touch-solid relative mx-auto flex items-center justify-between rounded-[28px] border h-14 bg-background/75 backdrop-blur-2xl px-3"
            style={{
              borderColor: `rgb(var(--brand-primary-rgb) / 0.188)`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.06), 0 0 0 1px rgb(var(--brand-primary-rgb) / 0.082)`,
            }}
          >
            <div
              className="pointer-events-none absolute -inset-[1px] rounded-[28px] opacity-30 blur-[2px]"
              style={{
                background: `linear-gradient(135deg, rgb(var(--brand-primary-rgb) / 0.314), transparent 40%, transparent 60%, rgb(var(--brand-secondary-rgb) / 0.251))`,
              }}
            />

            {/* ── Logo ── */}
            <div className="relative z-10 flex items-center">
              <Link href="/" className="group relative flex items-center gap-2.5">
                {showDynamicImage ? (
                  <div className="relative">
                    <NavbarLogoImage src={navbarLogoImage} alt={tenantName} />
                    {/* Hover: border = secondary */}
                    <span
                      className="absolute -inset-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ border: `3px solid var(--brand-secondary)`, boxShadow: `0 0 24px rgb(var(--brand-secondary-rgb) / 0.271)` }}
                    />
                  </div>
                ) : showDynamicIcon ? (
                  <NavbarLogoIcon icon={navbarLogoIcon} />
                ) : showLegacyImage ? (
                  <div className="relative">
                    <NavbarLogoImage src={logo} alt={tenantName} />
                    {/* Hover: border = secondary */}
                    <span
                      className="absolute -inset-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ border: `3px solid var(--brand-secondary)`, boxShadow: `0 0 24px rgb(var(--brand-secondary-rgb) / 0.271)` }}
                    />
                  </div>
                ) : (
                  <NavbarLogoIcon icon={GraduationCap} />
                )}
                <span className="text-lg font-bold tracking-tight max-md:hidden" style={{ color: primary }}>
                  {tenantName}
                </span>
              </Link>
            </div>

            {/* ── Desktop Nav ── */}
            <nav
              className="hidden md:flex items-center gap-1 relative z-10"
              role="navigation"
              aria-label="القائمة الرئيسية"
            >
              {navLinks.map((link) => (
                <NavLinkItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={activeSection === link.href}
                  onClick={(e) => {
                    if (link.scrollTarget) {
                      if (pathname === "/") {
                        e.preventDefault();
                        scrollToSection(link.scrollTarget);
                      }
                    }
                    setActiveSection(link.href);
                  }}
                />
              ))}
            </nav>

            {/* ── Right actions ── */}
            <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                title="بحث عن كورس (Ctrl+K)"
                aria-label="بحث عن كورس"
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl transition-transform duration-300 hover:scale-110 active:scale-90 group"
              >
                <span
                  className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: `inset 0 0 0 1px hsl(var(--border))` }}
                />
                <span
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{
                    backgroundColor: secondary,
                    border: `3px solid var(--brand-primary)`,
                    boxShadow: `0 0 24px rgb(var(--brand-primary-rgb) / 0.251)`,
                  }}
                />
                <Search className="h-[18px] w-[18px] relative z-10 group-hover:text-[#2D1B00] transition-colors duration-300" />
              </button>

              <ThemeBtn />

              {/* Desktop auth */}
              <div className="flex items-center gap-1 sm:gap-2">
                {isLoggedIn ? (
                  <div className="relative" ref={dropdownRef}>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <WalletBalanceBadge onClick={() => setRechargeWalletOpen(true)} />
                      <button
                        type="button"
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="flex items-center gap-2.5 rounded-2xl px-3 py-1.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                        style={{
                          border: `1px solid ${profileDropdownOpen ? primary : `rgb(var(--brand-primary-rgb) / 0.188)`}`,
                          backgroundColor: profileDropdownOpen ? `rgb(var(--brand-primary-rgb) / 0.082)` : `rgb(var(--brand-primary-rgb) / 0.031)`,
                          boxShadow: profileDropdownOpen ? `0 4px 20px rgb(var(--brand-primary-rgb) / 0.188)` : undefined,
                        }}
                      >
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold overflow-hidden"
                        style={{ backgroundColor: primary }}
                      >
                        {sessionAvatar ? (
                          <img
                            src={sessionAvatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          sessionName?.charAt(0) ?? <User className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-foreground/80 max-w-[100px] truncate hidden sm:block">
                        {sessionName}
                      </span>
                      <div className={`transition-transform duration-200 ${profileDropdownOpen ? "rotate-180" : ""}`}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground/60 hidden sm:block" />
                      </div>
                    </button>
                    </div>

                    <div
                      aria-hidden={!profileDropdownOpen}
                      className={`glass-touch-solid absolute top-full mt-2 end-0 z-50 w-64 origin-top rounded-2xl border bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-200 ease-out ${
                        profileDropdownOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible pointer-events-none translate-y-2 scale-95 opacity-0"
                      }`}
                      style={{
                        borderColor: `rgb(var(--brand-primary-rgb) / 0.145)`,
                        boxShadow: `0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px rgb(var(--brand-primary-rgb) / 0.063)`,
                      }}
                    >
                          {/* Header */}
                          <div
                            className="px-4 py-3 border-b"
                            style={{ borderColor: `rgb(var(--brand-primary-rgb) / 0.082)` }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold overflow-hidden shrink-0"
                                style={{
                                  backgroundColor: primary,
                                  boxShadow: `0 2px 12px rgb(var(--brand-primary-rgb) / 0.251)`,
                                }}
                              >
                                {sessionAvatar ? (
                                  <img
                                    src={sessionAvatar}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  sessionName?.charAt(0) ?? <User className="h-5 w-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {sessionName}
                                </p>
                                <p className="text-xs text-muted-foreground/60">
                                  حساب الطالب
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="py-2">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                setProfileDrawerOpen(true);
                              }}
                              className="group relative flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                            >
                              <span
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                style={{ backgroundColor: `rgb(var(--brand-primary-rgb) / 0.031)` }}
                              />
                              <User className="h-4 w-4 relative z-10 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                              <span className="relative z-10">المعلومات الشخصية</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="group relative flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                            >
                              <span
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                style={{ backgroundColor: `rgb(var(--brand-primary-rgb) / 0.031)` }}
                              />
                              <Settings className="h-4 w-4 relative z-10 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                              <span className="relative z-10">الإعدادات</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                setChangePasswordOpen(true);
                              }}
                              className="group relative flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                            >
                              <span
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                style={{ backgroundColor: `rgb(var(--brand-primary-rgb) / 0.031)` }}
                              />
                              <KeyRound className="h-4 w-4 relative z-10 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                              <span className="relative z-10">تغيير كلمة المرور</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                setRechargeWalletOpen(true);
                              }}
                              className="group relative flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                            >
                              <span
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                style={{ backgroundColor: `rgb(var(--brand-primary-rgb) / 0.031)` }}
                              />
                              <Wallet className="h-4 w-4 relative z-10 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                              <span className="relative z-10">شحن المحفظة بالكود</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                setOnlineRechargeOpen(true);
                              }}
                              className="group relative flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                            >
                              <span
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                style={{ backgroundColor: `rgb(var(--brand-primary-rgb) / 0.031)` }}
                              />
                              <CreditCard className="h-4 w-4 relative z-10 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                              <span className="relative z-10">شحن المحفظة أونلاين</span>
                            </button>

                            <div className="my-1 mx-3 border-t" style={{ borderColor: `rgb(var(--brand-primary-rgb) / 0.063)` }} />

                            <button
                              type="button"
                              onClick={handleLogout}
                              className="group relative flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:text-red-600 transition-colors"
                            >
                              <span
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                style={{ backgroundColor: "rgba(239, 68, 68, 0.08)" }}
                              />
                              <LogOut className="h-4 w-4 relative z-10 group-hover:-translate-x-0.5 transition-transform" />
                              <span className="relative z-10 font-medium">تسجيل الخروج</span>
                            </button>
                          </div>
                        </div>
                  </div>
                ) : (
                  <>
                    <div className="transition-transform duration-300 hover:scale-105 active:scale-95">
                      <button
                        type="button"
                        onClick={() => setLoginOpen(true)}
                        className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-2xl px-3 py-1.5 max-md:px-3 max-md:py-1.5 text-sm max-md:text-xs font-semibold transition-all duration-300"
                        style={{
                          color: "hsl(var(--foreground))",
                          border: `1px solid hsl(var(--border))`,
                          backgroundColor: "hsl(var(--background) / 0.5)",
                        }}
                      >
                        <span
                          className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                          style={{
                            backgroundColor: secondary,
                            border: `3px solid var(--brand-primary)`,
                            boxShadow: `0 0 24px rgb(var(--brand-primary-rgb) / 0.271)`,
                          }}
                        />
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        <LogIn className="h-4 w-4 max-md:h-4 max-md:w-4 relative z-10 group-hover:text-[#2D1B00] transition-colors" />
                        <span className="relative z-10 group-hover:text-[#2D1B00] transition-colors">تسجيل الدخول</span>
                      </button>
                    </div>

                    <div className="transition-transform duration-300 hover:scale-105 hover:-translate-y-px active:scale-95">
                      <button
                        type="button"
                        onClick={() => setRegisterOpen(true)}
                        className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-2xl px-4 py-1.5 max-md:px-3.5 max-md:py-1.5 text-sm max-md:text-xs font-semibold text-white transition-all duration-300"
                        style={{
                          backgroundColor: primary,
                          boxShadow: `0 4px 20px rgb(var(--brand-primary-rgb) / 0.271)`,
                        }}
                      >
                        <span
                          className="absolute -inset-[3px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ border: `3px solid var(--brand-secondary)`, boxShadow: `0 0 28px rgb(var(--brand-secondary-rgb) / 0.333)` }}
                        />
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                        <span className="absolute -top-1 -start-1 h-3 w-3 rounded-full blur-[2px]" style={{ backgroundColor: `rgb(var(--brand-primary-rgb) / 0.376)` }} />
                        <span className="absolute -bottom-1 -end-1 h-3 w-3 rounded-full blur-[2px]" style={{ backgroundColor: `rgb(var(--brand-primary-rgb) / 0.376)` }} />
                        <Sparkles className="h-4 w-4 max-md:h-4 max-md:w-4 relative z-10" />
                        <span className="relative z-10">إنشاء حساب</span>
                        <ChevronLeft className="h-3.5 w-3.5 relative z-10 group-hover:-translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      <PublicRegisterCard
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
      />

      <PublicLoginCard
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {registerSuccess && (
        <RegisterSuccessOverlay
          name={registeredName}
          onDone={() => setRegisterSuccess(false)}
        />
      )}

      <StudentProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <RechargeWalletModal
        open={rechargeWalletOpen}
        onClose={() => setRechargeWalletOpen(false)}
      />

      <OnlineRechargeModal
        open={onlineRechargeOpen}
        onClose={() => setOnlineRechargeOpen(false)}
      />

      <CourseSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
