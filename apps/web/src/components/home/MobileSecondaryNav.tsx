"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LazyMotion, m, domAnimation, AnimatePresence } from "framer-motion";
import {
  Plus, Home, Layers, BookOpen, MessageCircle, Gift, Facebook, Youtube, Star, Phone,
} from "lucide-react";
import { usePublicHero } from "@/features/homepage/hero/hooks";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";

const primary = "#D87B63";
const secondary = "#FFB50E";

const navLinks = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "المراحل", href: "/stages", icon: Layers },
  { label: "الكورسات", href: "/courses", icon: BookOpen },
  { label: "تواصل معنا", href: "/contact", icon: MessageCircle },
];

export function MobileSecondaryNav() {
  const pathname = usePathname();
  const { data: hero } = usePublicHero();
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const [mobileIconsOpen, setMobileIconsOpen] = useState(false);

  const icons = hero?.icons;
  const social = hero?.socialLinks;

  const mobileIconItems = [
    { key: "gifts", icon: Gift, label: icons?.gifts?.label || "الهدايا", color: primary, borderColor: "#F0B8A8", visible: icons?.gifts?.visible },
    { key: "facebook", icon: Facebook, label: icons?.facebook?.label || "فيس بوك", color: secondary, borderColor: "#FFE0A0", visible: icons?.facebook?.visible, href: social?.facebook },
    { key: "chat", icon: MessageCircle, label: icons?.chat?.label || "محادثة مباشرة", color: primary, borderColor: "#F0B8A8", visible: icons?.chat?.visible },
    { key: "youtube", icon: Youtube, label: icons?.youtube?.label || "يوتيوب", color: secondary, borderColor: "#FFE0A0", visible: icons?.youtube?.visible, href: social?.youtube },
    { key: "bestStudents", icon: Star, label: icons?.bestStudents?.label || "أفضل الطلاب", color: primary, borderColor: "#F0B8A8", visible: icons?.bestStudents?.visible },
    { key: "phone", icon: Phone, label: icons?.phone?.label || "رقم الهاتف", color: secondary, borderColor: "#FFE0A0", visible: icons?.phone?.visible, phone: social?.phone, whatsapp: social?.whatsapp },
  ];

  const lightBgGrad = "linear-gradient(180deg, #FAF8F5 0%, #F7F4EF 60%, #F3EFE8 100%)";
  const darkBgGrad = "linear-gradient(180deg, #121418 0%, #14161A 60%, #16181D 100%)";

  return (
    <LazyMotion features={domAnimation}>
      <div
        className="md:hidden relative w-full"
        style={{ background: isDark ? darkBgGrad : lightBgGrad }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <m.div
            className="absolute -top-10 -start-10 h-24 w-24 rounded-full blur-3xl"
            style={{ backgroundColor: `${primary}15` }}
            animate={{ scale: [1, 1.15, 1], x: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.div
            className="absolute -bottom-10 -end-10 h-20 w-20 rounded-full blur-3xl"
            style={{ backgroundColor: `${secondary}12` }}
            animate={{ scale: [1.1, 1, 1.1], y: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 px-4 pb-3 pt-2">
          <div className="relative">
            {/* ── Nav bar ── */}
            <div
              className="relative flex items-center gap-1 rounded-2xl border p-1 shadow-lg backdrop-blur-md"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(216,123,99,0.15)",
              }}
            >
              <div
                className="pointer-events-none absolute -top-px inset-x-4 h-px opacity-60"
                style={{
                  background: `linear-gradient(90deg, transparent, ${primary}, ${secondary}, ${primary}, transparent)`,
                }}
              />

              {/* ── Plus toggle ── */}
              <m.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileIconsOpen(!mobileIconsOpen)}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: mobileIconsOpen ? primary : `${primary}12`,
                  color: mobileIconsOpen ? "#fff" : primary,
                  boxShadow: mobileIconsOpen ? `0 2px 12px ${primary}40` : undefined,
                }}
              >
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    border: `2px solid ${secondary}`,
                    boxShadow: `0 0 16px ${secondary}35`,
                  }}
                />
                <Plus
                  className="h-5 w-5 transition-transform duration-300"
                  style={{ transform: mobileIconsOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                />
              </m.button>

              <div className="flex-1 flex items-center gap-0.5 overflow-x-auto">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "relative whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200",
                        isActive ? "text-white" : "text-foreground/70 hover:text-foreground",
                      )}
                      style={{
                        backgroundColor: isActive ? primary : "transparent",
                        boxShadow: isActive ? `0 2px 12px ${primary}35` : undefined,
                      }}
                    >
                      {isActive && (
                        <m.span
                          layoutId="mobileNavPill"
                          className="absolute inset-0 rounded-xl"
                          style={{ backgroundColor: primary }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ── Icons floating overlay ── */}
            <AnimatePresence>
              {mobileIconsOpen && (
                <m.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute end-0 start-0 z-50 mt-2"
                >
                  <div
                    className="rounded-2xl border shadow-2xl backdrop-blur-xl p-3"
                    style={{
                      backgroundColor: isDark ? "rgba(22,24,29,0.97)" : "rgba(255,255,255,0.97)",
                      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(216,123,99,0.15)",
                      boxShadow: isDark
                        ? `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)`
                        : `0 20px 60px rgba(216,123,99,0.15), 0 0 0 1px rgba(216,123,99,0.08)`,
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      {mobileIconItems.filter((item) => item.visible !== false).map((item) => {
                        const iconContent = (
                          <div
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:scale-[1.02]"
                            style={{ cursor: item.href || item.key === "phone" ? "pointer" : "default" }}
                          >
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3.5px] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl"
                              style={{
                                backgroundColor: item.color,
                                borderColor: item.borderColor,
                              }}
                            >
                              <item.icon className="h-5 w-5 text-white" />
                            </div>
                            <span
                              className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md"
                              style={{ backgroundColor: `${item.color}dd` }}
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
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
