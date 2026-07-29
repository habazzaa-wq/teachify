"use client";

import { useState } from "react";
import Link from "next/link";
import { LazyMotion, m, domAnimation, AnimatePresence } from "framer-motion";
import {
  Plus, Home, Layers, BookOpen, MessageCircle, Gift, Facebook, Youtube, Star, Phone,
} from "lucide-react";
import { usePublicHero } from "@/features/homepage/hero/hooks";
import { useUiStore } from "@/stores/ui.store";

const primary = "#D87B63";
const secondary = "#FFB50E";

const navLinks = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "المراحل", href: "/stages", icon: Layers },
  { label: "الكورسات", href: "/courses", icon: BookOpen },
  { label: "تواصل معنا", href: "/contact", icon: MessageCircle },
];

export function MobileSecondaryNav() {
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
        {/* Subtle hero-like decorative orbs */}
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
          {/* ── Nav bar ── */}
          <div
            className="flex items-center gap-2 rounded-2xl border p-1.5 shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(216,123,99,0.15)",
            }}
          >
            {/* ── Plus toggle ── */}
            <m.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileIconsOpen(!mobileIconsOpen)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300"
              style={{
                backgroundColor: mobileIconsOpen ? primary : `${primary}15`,
                color: mobileIconsOpen ? "#fff" : primary,
              }}
            >
              <Plus
                className="h-5 w-5 transition-transform duration-300"
                style={{ transform: mobileIconsOpen ? "rotate(45deg)" : "rotate(0deg)" }}
              />
            </m.button>

            {/* ── Nav items ── */}
            <div className="flex items-center gap-0.5 overflow-x-auto flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-200"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Toggle icons vertical list ── */}
          <AnimatePresence>
            {mobileIconsOpen && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden mt-2"
              >
                <div
                  className="flex flex-col gap-2 rounded-2xl border p-3 shadow-lg backdrop-blur-md"
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(216,123,99,0.15)",
                  }}
                >
                  {mobileIconItems.filter((item) => item.visible !== false).map((item) => {
                    const iconContent = (
                      <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-200 hover:scale-[1.02]"
                        style={{ cursor: item.href || item.key === "phone" ? "pointer" : "default" }}
                      >
                        {/* Icon - exact same style as desktop orbiting icons */}
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
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LazyMotion>
  );
}
