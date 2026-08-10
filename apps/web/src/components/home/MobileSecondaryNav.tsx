"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus, Home, Layers, BookOpen, MessageCircle, Gift, Facebook, Youtube, Star, Phone,
} from "lucide-react";
import { usePublicHero } from "@/features/homepage/hero/hooks";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";

const primary = "var(--brand-primary)";
const secondary = "var(--brand-secondary)";
const primaryBadge = "rgb(var(--brand-primary-rgb) / 0.87)";
const secondaryBadge = "rgb(var(--brand-secondary-rgb) / 0.87)";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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

export function MobileSecondaryNav() {
  const pathname = usePathname();
  const reduced = prefersReducedMotion();
  const { data: hero } = usePublicHero();
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const [mobileIconsOpen, setMobileIconsOpen] = useState(false);

  const icons = hero?.icons;
  const social = hero?.socialLinks;

  const mobileIconItems = [
    { key: "gifts", icon: Gift, label: icons?.gifts?.label || "الهدايا", color: primary, borderColor: "rgb(var(--brand-primary-rgb) / 0.4)", badge: primaryBadge, contrast: "var(--brand-primary-contrast)", visible: icons?.gifts?.visible },
    { key: "facebook", icon: Facebook, label: icons?.facebook?.label || "فيس بوك", color: secondary, borderColor: "rgb(var(--brand-secondary-rgb) / 0.4)", badge: secondaryBadge, contrast: "var(--brand-secondary-contrast)", visible: icons?.facebook?.visible, href: social?.facebook },
    { key: "chat", icon: MessageCircle, label: icons?.chat?.label || "محادثة مباشرة", color: primary, borderColor: "rgb(var(--brand-primary-rgb) / 0.4)", badge: primaryBadge, contrast: "var(--brand-primary-contrast)", visible: icons?.chat?.visible },
    { key: "youtube", icon: Youtube, label: icons?.youtube?.label || "يوتيوب", color: secondary, borderColor: "rgb(var(--brand-secondary-rgb) / 0.4)", badge: secondaryBadge, contrast: "var(--brand-secondary-contrast)", visible: icons?.youtube?.visible, href: social?.youtube },
    { key: "bestStudents", icon: Star, label: icons?.bestStudents?.label || "أفضل الطلاب", color: primary, borderColor: "rgb(var(--brand-primary-rgb) / 0.4)", badge: primaryBadge, contrast: "var(--brand-primary-contrast)", visible: icons?.bestStudents?.visible },
    { key: "phone", icon: Phone, label: icons?.phone?.label || "رقم الهاتف", color: secondary, borderColor: "rgb(var(--brand-secondary-rgb) / 0.4)", badge: secondaryBadge, contrast: "var(--brand-secondary-contrast)", visible: icons?.phone?.visible, phone: social?.phone, whatsapp: social?.whatsapp },
  ];

  const visibleIcons = mobileIconItems.filter((item) => item.visible !== false);
  const hasIcons = visibleIcons.length > 0;

  return (
    <div className="md:hidden px-4 pb-1.5 pt-0.5">
      <div className="relative">
        {/* ── Nav bar ── */}
        <div
          className="glass-touch-solid relative flex items-center gap-1 rounded-2xl border p-1 shadow-lg backdrop-blur-md"
          style={{
            backgroundColor: isDark ? "rgba(22,24,29,0.8)" : "rgba(255,255,255,0.85)",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgb(var(--brand-primary-rgb) / 0.15)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-px inset-x-4 h-px opacity-60"
            style={{
              background: `linear-gradient(90deg, transparent, var(--brand-primary), var(--brand-secondary), var(--brand-primary), transparent)`,
            }}
          />

          {/* ── Plus toggle ── */}
          {hasIcons && (
            <button
              type="button"
              onClick={() => setMobileIconsOpen(!mobileIconsOpen)}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 active:scale-90"
              style={{
                backgroundColor: mobileIconsOpen ? primary : "rgb(var(--brand-primary-rgb) / 0.07)",
                color: mobileIconsOpen ? "#fff" : primary,
                boxShadow: mobileIconsOpen ? "0 2px 12px rgb(var(--brand-primary-rgb) / 0.25)" : undefined,
              }}
            >
              <Plus
                className="h-4 w-4 transition-transform duration-300"
                style={{ transform: mobileIconsOpen ? "rotate(45deg)" : "rotate(0deg)" }}
              />
            </button>
          )}

          {/* ── Nav items ── */}
          <div className="flex-1 flex items-center gap-0.5 overflow-x-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (link.scrollTarget && pathname === "/") {
                  e.preventDefault();
                  const targetId = link.scrollTarget;
                  const scroll = () => {
                    const el = document.getElementById(targetId);
                    if (!el) return false;
                    el.scrollIntoView({
                      behavior: reduced ? "auto" : "smooth",
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
                }
              };
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleClick}
                  className={cn(
                    "relative whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
                    isActive ? "text-[var(--brand-primary-contrast)]" : "text-foreground/70 hover:text-foreground",
                  )}
                  style={{
                    backgroundColor: isActive ? primary : "transparent",
                    boxShadow: isActive ? "0 2px 12px rgb(var(--brand-primary-rgb) / 0.21)" : undefined,
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-xl transition-all duration-200"
                      style={{ backgroundColor: primary }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Icons floating overlay ── */}
        {mobileIconsOpen && (
          <div className="home-menu-pop absolute end-0 start-0 z-50 mt-1.5">
            <div
              className="glass-touch-solid overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl"
              style={{
                backgroundColor: isDark ? "rgba(22,24,29,0.88)" : "rgba(255,255,255,0.88)",
                borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgb(var(--brand-primary-rgb) / 0.12)",
              }}
            >
              <div className="flex flex-col divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgb(var(--brand-primary-rgb) / 0.06)" }}>
                {visibleIcons.map((item) => {
                  const iconContent = (
                    <div className="flex items-center gap-3 px-3.5 py-2.5 transition-all duration-200 hover:bg-black/5 active:scale-[0.98]">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] shadow-md"
                        style={{
                          backgroundColor: item.color,
                          borderColor: item.borderColor,
                        }}
                      >
                        <item.icon className="h-[18px] w-[18px]" style={{ color: item.contrast }} />
                      </div>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm"
                        style={{ backgroundColor: item.badge, color: item.contrast }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );

                  if (item.href) {
                    return (
                      <a key={item.key} href={item.href} target="_blank" rel="noopener noreferrer">
                        {iconContent}
                      </a>
                    );
                  }
                  if (item.key === "phone") {
                    return (
                      <a key={item.key} href={item.phone ? `tel:${item.phone}` : "#"} className="block">
                        {iconContent}
                      </a>
                    );
                  }
                  return <div key={item.key}>{iconContent}</div>;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
