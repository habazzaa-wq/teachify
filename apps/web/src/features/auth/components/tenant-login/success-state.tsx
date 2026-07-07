"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

const SuccessState = memo(function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-14"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10"
      >
        <CheckCircle2 className="h-8 w-8 text-success" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-5 text-center"
      >
        <h3 className="text-base font-semibold text-foreground">
          تم تسجيل الدخول بنجاح
        </h3>
        <p className="mt-1 text-sm text-muted-foreground/60">
          جارٍ تحويلك إلى لوحة التحكم...
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="mt-6"
      >
        <span className="flex items-center gap-2 text-xs text-primary/70">
          <ArrowLeft className="h-3.5 w-3.5 animate-pulse" />
          <span>لوحة التحكم</span>
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="mt-6"
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/30" />
      </motion.div>
    </motion.div>
  );
});

export { SuccessState };
