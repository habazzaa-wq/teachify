"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { HeroSection } from "./hero-section";
import { LoginCard } from "./login-card";
import { useTenantStore } from "@/stores/tenant.store";
import { useUiStore } from "@/stores/ui.store";
import { useTenantTheme } from "@/hooks/useTenantTheme";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const PageContent = memo(function PageContent() {
  const platformBranding = useTenantStore((state) => state.platformBranding);
  const theme = useUiStore((state) => state.theme);

  // صفحة الدخول بتستخدم ألوان المنصة العالمية (platformBranding) عشان تكون
  // موحّدة مع الموقع العام ولوحة التحكم (نفس الألوان للمسجّل وغير المسجّل).
  const primaryColor = platformBranding?.primaryColor ?? null;
  const secondaryColor = platformBranding?.secondaryColor ?? null;

  useTenantTheme({
    primaryColor,
    secondaryColor,
    isDark: theme === "dark",
    fallbackPrimary: platformBranding?.primaryColor ?? null,
    fallbackSecondary: platformBranding?.secondaryColor ?? null,
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="tenant-theme min-h-screen flex flex-col-reverse lg:flex-row"
    >
      <HeroSection />
      <LoginCard />
    </motion.div>
  );
});

export { PageContent };
