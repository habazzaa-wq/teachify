"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { LmsWidgets } from "./lms-widgets";

const sectionVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function FloatingOrb({
  className,
  delay = 0,
  size = "h-96 w-96",
}: {
  className?: string;
  delay?: number;
  size?: string;
}) {
  return (
    <motion.div
      className={`absolute rounded-full ${size} pointer-events-none ${className ?? ""}`}
      style={{
        background:
          "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 60%)",
      }}
      animate={{
        y: [0, -30, 0, 20, 0],
        scale: [1, 1.03, 0.97, 1.02, 1],
      }}
      transition={{
        duration: 16,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

const HeroSection = memo(function HeroSection() {
  return (
    <motion.div
      variants={sectionVariants}
      className="relative lg:w-[55%] min-h-[50vh] lg:min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/[0.04] via-primary/[0.02] to-background"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <FloatingOrb className="-top-1/4 -right-1/4" delay={0} />
        <FloatingOrb className="-bottom-1/4 -left-1/4" delay={5} />
        <FloatingOrb className="top-1/3 left-1/3" delay={10} size="h-64 w-64" />

        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.04) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute top-1/4 right-8 h-20 w-20 rounded-full border border-border/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-1/3 left-12 h-14 w-14 rounded-lg border border-border/10 rotate-45"
          animate={{ rotate: [45, 405] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 w-full px-8 lg:px-16 py-12 lg:py-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/[0.08] border border-primary/[0.12] px-4 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-xs font-medium text-primary/80">
              منصة تعليمية رقمية متكاملة
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground leading-[1.15] mb-4">
            منصتك المتكاملة
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              للتعلم الرقمي
            </span>
          </h1>

          <p className="text-base lg:text-lg text-muted-foreground/70 max-w-xl leading-relaxed">
            قم بإدارة دوراتك وطلابك ومحتواك التعليمي من مكان واحد. حل متكامل
            للمؤسسات التعليمية والمعاهد والمدربين المستقلين.
          </p>
        </motion.div>

        <LmsWidgets />
      </div>
    </motion.div>
  );
});

export { HeroSection };
