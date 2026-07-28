"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sun, Moon, GraduationCap, Menu, X, LogIn, UserPlus,
  Sparkles, ChevronLeft, Home, Layers, BookOpen, MessageCircle, User,
  LogOut, Settings, ChevronDown,
} from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { PublicRegisterCard, RegisterSuccessOverlay } from "@/features/auth/components/PublicRegisterCard";
import { PublicLoginCard } from "@/features/auth/components/PublicLoginCard";
import type { PublicRegisterResponse } from "@/features/auth/services/public-register.service";
import { StudentProfileDrawer } from "@/features/student-profile/components/StudentProfileDrawer";
import { cn } from "@/lib/cn";

const primary = "#D87B63";
const secondary = "#FFB50E";

const navLinks = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "المراحل", href: "/stages", icon: Layers },
  { label: "الكورسات", href: "/courses", icon: BookOpen },
  { label: "تواصل معنا", href: "/contact", icon: MessageCircle },
];

function DecoOrbs() {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -top-16 -start-16 h-32 w-32 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: primary }}
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -15, 10, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -end-20 h-40 w-40 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: secondary }}
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 20, -10, 0],
          scale: [1, 0.9, 1.05, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}

function ThemeBtn({ scrolled }: { scrolled: boolean }) {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <motion.button
      whileHover={{ scale: 1.12, rotate: theme === "light" ? -15 : 15 }}
      whileTap={{ scale: 0.88 }}
      onClick={toggleTheme}
      className="relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 group"
      style={{
        backgroundColor: scrolled ? undefined : theme === "light" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
      }}
      aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
    >
      {/* Default border */}
      <span
        className="absolute inset-0 rounded-2xl transition-all duration-500"
        style={{
          boxShadow: scrolled
            ? `inset 0 0 0 1px hsl(var(--border))`
            : "inset 0 0 0 1px rgba(255,255,255,0.12)",
        }}
      />
      {/* Hover: bg = secondary, border = primary */}
      <span
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={{
          backgroundColor: secondary,
          border: `3px solid ${primary}`,
          boxShadow: `0 0 24px ${primary}40`,
        }}
      />
      <motion.div
        key={theme}
        initial={{ rotate: -180, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 group-hover:text-[#2D1B00] transition-colors duration-300"
      >
        {theme === "light" ? (
          <Moon className="h-[18px] w-[18px]" />
        ) : (
          <Sun className="h-[18px] w-[18px]" />
        )}
      </motion.div>
    </motion.button>
  );
}

function NavLinkItem({
  href, label, icon: Icon, isActive, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  isActive: boolean; onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="group relative">
      <motion.div
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-300"
      >
        {isActive ? (
          <>
            <motion.span
              layoutId="nav-bg"
              className="absolute inset-0 rounded-2xl"
              style={{
                backgroundColor: primary,
                boxShadow: `0 4px 24px ${primary}50`,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            />
            <span
              className="absolute -inset-[3px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ border: `3px solid ${secondary}`, boxShadow: `0 0 24px ${secondary}50` }}
            />
          </>
        ) : (
          <span
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{
              backgroundColor: secondary,
              border: `3px solid ${primary}`,
              boxShadow: `0 0 24px ${primary}40`,
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
      </motion.div>
    </Link>
  );
}

export function PublicNavbar() {
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("/");

  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  const [studentRegistered, setStudentRegistered] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("public-register-state");
      return stored ? JSON.parse(stored) as { name: string; token: string; avatar?: string | null } : null;
    } catch {
      return null;
    }
  });

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const setAuthTokens = useAuthStore((s) => s.setTokens);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const authUser = useAuthStore((s) => s.user);
  const setTenantContext = useTenantStore((s) => s.setTenantContext);
  const clearAuth = useAuthStore((s) => s.clear);

  const isLoggedIn = !!studentRegistered;

  const handleLogout = useCallback(() => {
    setStudentRegistered(null);
    localStorage.removeItem("public-register-state");
    clearAuth();
    setProfileDropdownOpen(false);
  }, [clearAuth]);

  const handleLoginSuccess = useCallback(
    (data: { name: string; avatar?: string | null }) => {
      setLoginOpen(false);
      setRegisteredName(data.name);
      setStudentRegistered({ name: data.name, token: "", avatar: data.avatar ?? null });
      setRegisterSuccess(true);
    },
    [],
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

      const state = { name: response.user.name, token: response.access_token, avatar: response.user.avatar ?? null };
      localStorage.setItem("public-register-state", JSON.stringify(state));

      setRegisterOpen(false);
      setRegisteredName(response.user.name);
      setRegisterSuccess(true);
      setStudentRegistered(state);
    },
    [setAuthTokens, setAuthUser, setTenantContext],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-700",
          scrolled ? "py-2" : "py-4",
        )}
        role="banner"
      >
        <AnimatePresence>
          {scrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent"
            />
          )}
        </AnimatePresence>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative mx-auto flex items-center justify-between rounded-[28px] border transition-all duration-500",
              scrolled
                ? "h-14 bg-background/75 backdrop-blur-2xl px-3"
                : "h-16 border-transparent bg-transparent px-0",
            )}
            style={scrolled ? {
              borderColor: `${primary}30`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.06), 0 0 0 1px ${primary}15`,
            } : {}}
          >
            {scrolled && <DecoOrbs />}

            {scrolled && (
              <div
                className="pointer-events-none absolute -inset-[1px] rounded-[28px] opacity-30 blur-[2px]"
                style={{
                  background: `linear-gradient(135deg, ${primary}50, transparent 40%, transparent 60%, ${secondary}40)`,
                }}
              />
            )}

            {/* ── Logo ── */}
            <motion.div
              transition={{ duration: 0.4 }}
              className="relative z-10 flex items-center"
            >
              <Link href="/" className="group relative flex items-center gap-2.5">
                {logo ? (
                  <div className="relative">
                    <Image src={logo} alt={tenantName} width={100} height={28} className="h-7 w-auto transition-all duration-500 group-hover:scale-105" />
                    {/* Hover: border = secondary */}
                    <span
                      className="absolute -inset-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ border: `3px solid ${secondary}`, boxShadow: `0 0 24px ${secondary}45` }}
                    />
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ rotate: -8, scale: 1.1 }}
                    className="relative flex h-9 w-9 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: primary,
                      boxShadow: `0 2px 20px ${primary}40`,
                    }}
                  >
                    <GraduationCap className="h-5 w-5 text-white" />
                    {/* Hover: border = secondary */}
                    <span
                      className="absolute -inset-[3.5px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ border: `3px solid ${secondary}`, boxShadow: `0 0 24px ${secondary}50` }}
                    />
                  </motion.div>
                )}
                {!scrolled && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="text-lg font-bold tracking-tight"
                    style={{ color: primary }}
                  >
                    {tenantName}
                  </motion.span>
                )}
              </Link>
            </motion.div>

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
                  onClick={() => setActiveSection(link.href)}
                />
              ))}
            </nav>

            {/* ── Right actions ── */}
            <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
              <ThemeBtn scrolled={scrolled} />

              {/* Desktop auth */}
              <div className="hidden sm:flex items-center gap-2">
                {isLoggedIn ? (
                  <div className="relative" ref={dropdownRef}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2.5 rounded-2xl px-3 py-1.5 transition-all duration-300 group"
                      style={{
                        border: `1px solid ${profileDropdownOpen ? primary : `${primary}30`}`,
                        backgroundColor: profileDropdownOpen ? `${primary}15` : `${primary}08`,
                        boxShadow: profileDropdownOpen ? `0 4px 20px ${primary}30` : undefined,
                      }}
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold overflow-hidden"
                        style={{ backgroundColor: primary }}
                      >
                        {(authUser?.avatar || studentRegistered?.avatar) ?? undefined ? (
                          <img
                            src={(authUser?.avatar || studentRegistered?.avatar) ?? undefined}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          studentRegistered?.name?.charAt(0) ?? <User className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-foreground/80 max-w-[100px] truncate hidden sm:block">
                        {studentRegistered?.name}
                      </span>
                      <motion.div
                        animate={{ rotate: profileDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground/60 hidden sm:block" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {profileDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute top-full mt-2 end-0 w-64 rounded-2xl border bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden z-50"
                          style={{
                            borderColor: `${primary}25`,
                            boxShadow: `0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px ${primary}10`,
                          }}
                        >
                          {/* Header */}
                          <div
                            className="px-4 py-3 border-b"
                            style={{ borderColor: `${primary}15` }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold overflow-hidden shrink-0"
                                style={{
                                  backgroundColor: primary,
                                  boxShadow: `0 2px 12px ${primary}40`,
                                }}
                              >
                                {(authUser?.avatar || studentRegistered?.avatar) ?? undefined ? (
                                  <img
                                    src={(authUser?.avatar || studentRegistered?.avatar) ?? undefined}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  studentRegistered?.name?.charAt(0) ?? <User className="h-5 w-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {studentRegistered?.name}
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
                                style={{ backgroundColor: `${primary}08` }}
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
                                style={{ backgroundColor: `${primary}08` }}
                              />
                              <Settings className="h-4 w-4 relative z-10 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                              <span className="relative z-10">الإعدادات</span>
                            </button>

                            <div className="my-1 mx-3 border-t" style={{ borderColor: `${primary}10` }} />

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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <button
                        type="button"
                        onClick={() => setLoginOpen(true)}
                        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-300"
                        style={{
                          color: scrolled ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.9)",
                          border: `1px solid ${scrolled ? "hsl(var(--border))" : `${primary}35`}`,
                          backgroundColor: scrolled ? "hsl(var(--background) / 0.5)" : `${primary}08`,
                        }}
                      >
                        <span
                          className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                          style={{
                            backgroundColor: secondary,
                            border: `3px solid ${primary}`,
                            boxShadow: `0 0 24px ${primary}45`,
                          }}
                        />
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        <LogIn className="h-4 w-4 relative z-10 group-hover:text-[#2D1B00] transition-colors" />
                        <span className="relative z-10 group-hover:text-[#2D1B00] transition-colors">تسجيل الدخول</span>
                      </button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95, y: 0 }}>
                      <button
                        type="button"
                        onClick={() => setRegisterOpen(true)}
                        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl px-5 py-2 text-sm font-semibold text-white transition-all duration-300"
                        style={{
                          backgroundColor: primary,
                          boxShadow: `0 4px 20px ${primary}45`,
                        }}
                      >
                        <span
                          className="absolute -inset-[3px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ border: `3px solid ${secondary}`, boxShadow: `0 0 28px ${secondary}55` }}
                        />
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                        <span className="absolute -top-1 -start-1 h-3 w-3 rounded-full blur-[2px]" style={{ backgroundColor: `${primary}60` }} />
                        <span className="absolute -bottom-1 -end-1 h-3 w-3 rounded-full blur-[2px]" style={{ backgroundColor: `${primary}60` }} />
                        <Sparkles className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">إنشاء حساب</span>
                        <ChevronLeft className="h-3.5 w-3.5 relative z-10 group-hover:-translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Mobile trigger */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(true)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl md:hidden transition-all duration-300 group",
                  scrolled ? "hover:bg-accent/60" : "",
                )}
                style={!scrolled ? { backgroundColor: "rgba(255,255,255,0.06)" } : {}}
                aria-label="فتح القائمة"
              >
                <span
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{
                    backgroundColor: secondary,
                    border: `3px solid ${primary}`,
                    boxShadow: `0 0 20px ${primary}35`,
                  }}
                />
                <Menu className="h-5 w-5 relative z-10 group-hover:text-[#2D1B00] transition-colors" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ── MOBILE OVERLAY ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xl md:hidden"
              onClick={closeMobile}
              aria-hidden="true"
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 80% 20%, ${primary}25, transparent 60%)`,
                }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            <motion.nav
              initial={{ x: "100%", borderRadius: "100px 0 0 100px" }}
              animate={{ x: 0, borderRadius: "0" }}
              exit={{ x: "100%", borderRadius: "100px 0 0 100px" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed inset-y-0 end-0 z-50 flex w-80 flex-col overflow-hidden border-s bg-background/98 backdrop-blur-2xl md:hidden"
              style={{ borderColor: `${primary}20` }}
              role="dialog"
              aria-modal="true"
              aria-label="القائمة الجانبية"
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <motion.div
                  className="absolute -top-20 -end-20 h-60 w-60 rounded-full blur-3xl"
                  style={{ backgroundColor: `${primary}12` }}
                  animate={{ scale: [1, 1.2, 1], x: [0, -10, 0], y: [0, 10, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -bottom-20 -start-20 h-60 w-60 rounded-full blur-3xl"
                  style={{ backgroundColor: `${secondary}10` }}
                  animate={{ scale: [1.1, 1, 1.1], x: [0, 10, 0], y: [0, -10, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Header */}
              <div className="relative flex items-center justify-between border-b px-5 py-5" style={{ borderColor: `${primary}15` }}>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.12 }}
                  className="flex items-center gap-2.5"
                >
                  {logo ? (
                    <Image src={logo} alt="" width={90} height={26} className="h-6 w-auto" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: primary }}>
                      <GraduationCap className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-bold" style={{ color: primary }}>{tenantName}</span>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeMobile}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-all group"
                  style={{ backgroundColor: `${primary}08` }}
                  aria-label="إغلاق القائمة"
                >
                  <span
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{
                      backgroundColor: secondary,
                      border: `3px solid ${primary}`,
                      boxShadow: `0 0 20px ${primary}35`,
                    }}
                  />
                  <X className="h-[18px] w-[18px] relative z-10 group-hover:text-[#2D1B00] transition-colors" />
                </motion.button>
              </div>

              {/* Links */}
              <div className="relative flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-2">
                  {navLinks.map(({ label, href, icon: Icon }, i) => {
                    const isActive = activeSection === href;
                    return (
                      <motion.div
                        key={href}
                        custom={i}
                        initial={{ x: 60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.07, type: "spring", stiffness: 240, damping: 22 }}
                      >
                        <Link
                          href={href}
                          onClick={() => { setActiveSection(href); closeMobile(); }}
                          className="group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-200"
                          style={{
                            color: isActive ? "#fff" : "hsl(var(--muted-foreground))",
                            backgroundColor: isActive ? primary : "transparent",
                            boxShadow: isActive ? `0 4px 20px ${primary}40` : undefined,
                          }}
                        >
                          {isActive ? (
                            <>
                              {/* Hover: border = secondary */}
                              <span
                                className="absolute -inset-[3px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ border: `3px solid ${secondary}`, boxShadow: `0 0 24px ${secondary}50` }}
                              />
                            </>
                          ) : (
                            <>
                              {/* Hover: bg = secondary, border = primary */}
                              <span
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                                style={{
                                  backgroundColor: secondary,
                                  border: `3px solid ${primary}`,
                                  boxShadow: `0 0 24px ${primary}40`,
                                }}
                              />
                            </>
                          )}
                          <Icon className={cn(
                            "h-4 w-4 relative z-10 transition-all",
                            isActive ? "" : "opacity-70",
                            "group-hover:text-[#2D1B00]",
                          )} />
                          <span className="relative z-10 group-hover:text-[#2D1B00] transition-colors">{label}</span>
                          {isActive && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="me-auto relative z-10"
                            >
                              <ChevronLeft className="h-4 w-4 opacity-70" />
                            </motion.span>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Auth in mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-8 space-y-3"
                >
                  {isLoggedIn ? (
                    <div className="space-y-3">
                      <div
                        className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                        style={{
                          border: `1px solid ${primary}30`,
                          backgroundColor: `${primary}08`,
                        }}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold shrink-0 overflow-hidden"
                          style={{ backgroundColor: primary }}
                        >
                          {(authUser?.avatar || studentRegistered?.avatar) ?? undefined ? (
                            <img
                              src={(authUser?.avatar || studentRegistered?.avatar) ?? undefined}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            studentRegistered?.name?.charAt(0) ?? <User className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{studentRegistered?.name}</p>
                          <p className="text-xs text-muted-foreground/60">حساب الطالب</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { closeMobile(); handleLogout(); }}
                        className="group relative flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-all duration-300"
                        style={{
                          borderColor: "rgba(239, 68, 68, 0.25)",
                          backgroundColor: "rgba(239, 68, 68, 0.05)",
                        }}
                      >
                        <span
                          className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "3px solid rgba(239, 68, 68, 0.3)",
                            boxShadow: "0 0 24px rgba(239, 68, 68, 0.2)",
                          }}
                        />
                        <LogOut className="h-4 w-4 relative z-10 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="relative z-10">تسجيل الخروج</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t" style={{ borderColor: `${primary}15` }} />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-background px-3 text-[11px] font-semibold" style={{ color: `${primary}80` }}>حساب جديد</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { closeMobile(); setLoginOpen(true); }}
                        className="group relative flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-semibold text-foreground transition-all duration-300"
                        style={{
                          borderColor: `${primary}35`,
                          backgroundColor: `${primary}05`,
                        }}
                      >
                        <span
                          className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                          style={{
                            backgroundColor: secondary,
                            border: `3px solid ${primary}`,
                            boxShadow: `0 0 24px ${primary}45`,
                          }}
                        />
                        <LogIn className="h-4 w-4 relative z-10 group-hover:text-[#2D1B00] transition-colors" />
                        <span className="relative z-10 group-hover:text-[#2D1B00] transition-colors">تسجيل الدخول</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { closeMobile(); setRegisterOpen(true); }}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300"
                        style={{
                          backgroundColor: primary,
                          boxShadow: `0 4px 24px ${primary}40`,
                        }}
                      >
                        <span
                          className="absolute -inset-[3px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ border: `3px solid ${secondary}`, boxShadow: `0 0 28px ${secondary}55` }}
                        />
                        <UserPlus className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">إنشاء حساب جديد</span>
                      </button>
                    </>
                  )}
                </motion.div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </motion.nav>
          </>
        )}
      </AnimatePresence>

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
    </>
  );
}
