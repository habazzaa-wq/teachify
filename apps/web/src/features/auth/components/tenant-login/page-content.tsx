"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { HeroSection } from "./hero-section";
import { LoginCard } from "./login-card";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const PageContent = memo(function PageContent() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex flex-col-reverse lg:flex-row"
    >
      <HeroSection />
      <LoginCard />
    </motion.div>
  );
});

export { PageContent };
