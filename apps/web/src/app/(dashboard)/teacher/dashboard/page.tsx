"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

function DashboardHomePage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="card-top-accent premium-card mx-auto w-full max-w-xl px-8 py-12"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-tenant-accent-soft"
          style={{ animation: "float-soft 4s ease-in-out infinite" }}
        >
          <GraduationCap className="h-10 w-10 text-tenant-accent" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-4 text-4xl font-bold tracking-tight text-tenant-fg sm:text-5xl"
        >
          مرحباً بك
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto max-w-md text-base leading-relaxed text-tenant-fg-muted sm:text-lg"
        >
          سيتم بناء لوحة التحكم بعد الانتهاء من بناء الوحدات الأساسية.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto mt-10 flex w-fit items-center gap-2 rounded-full border border-tenant-border bg-tenant-surface px-5 py-2 text-sm font-medium text-tenant-fg-muted"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tenant-accent/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-tenant-accent" />
          </span>
          قيد التطوير
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DashboardHomePage;
