"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Moon, Shield, Sun } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { useUiStore } from "@/stores/ui.store";
import { env } from "@/config/env";
import { LoginForm } from "./login-form";

const cardVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const LoginCard = memo(function LoginCard() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const branding = useTenantStore((state) => state.branding);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const year = new Date().getFullYear();

  return (
    <motion.div
      variants={cardVariants}
      className="flex-1 lg:w-[45%] min-h-screen flex items-center justify-center p-6 lg:p-10 bg-background relative"
    >
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 left-6 lg:top-8 lg:left-8 flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-accent hover:text-foreground hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
        title={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
      >
        <Sun className="h-4 w-4 absolute transition-all duration-300 scale-100 rotate-0 dark:scale-0 dark:rotate-90 dark:opacity-0" />
        <Moon className="h-4 w-4 transition-all duration-300 scale-0 -rotate-90 opacity-0 dark:scale-100 dark:rotate-0 dark:opacity-100" />
      </button>

      <div className="w-full max-w-[440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-2xl border border-border/30 bg-card shadow-xl shadow-black/[0.02] dark:shadow-black/[0.2] backdrop-blur-xl"
        >
          <div className="px-8 py-10 sm:px-10 sm:py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center mb-8"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
                {branding?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.logo}
                    alt={activeTenant?.name ?? ""}
                    className="h-9 w-9 rounded-lg object-contain"
                  />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-primary/60">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                )}
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {activeTenant?.name || env.appName}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground/60">
                قم بتسجيل الدخول للوصول إلى حسابك
              </p>
            </motion.div>

            <LoginForm />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8 pt-6 border-t border-border/30"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Shield className="h-3 w-3 text-success/50" />
                <span className="text-[10px] text-muted-foreground/40">
                  اتصال آمن بتشفير SSL
                </span>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground/25">
                &copy; {year} {activeTenant?.name || env.appName}. جميع الحقوق
                محفوظة.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

export { LoginCard };
