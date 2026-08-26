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
  const branding = useTenantStore((state) => state.branding);
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const platformBranding = useTenantStore((state) => state.platformBranding);
  const theme = useUiStore((state) => state.theme);

  // The teacher appearance (settings `branding` group) is the single source of
  // truth for the tenant login page. Read it from the authenticated tenant
  // (snake_case) or the public bootstrap (camelCase), and fall back to the
  // platform brand so the page never shows the wrong default palette.
  const primaryColor =
    activeTenant?.branding?.primary_color ??
    branding?.primaryColor ??
    null;
  const secondaryColor =
    activeTenant?.branding?.secondary_color ??
    branding?.secondaryColor ??
    null;

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
