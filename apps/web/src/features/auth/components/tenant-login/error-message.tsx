"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Ban,
  WifiOff,
  ServerCrash,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NoticeKind =
  | "credentials"
  | "inactive"
  | "subscription-expired"
  | "tenant-disabled"
  | "too-many-attempts"
  | "server-unavailable"
  | "offline"
  | "generic";

interface ErrorMessageProps {
  kind?: NoticeKind;
  message?: string;
  shake?: boolean;
}

const config: Record<
  NoticeKind,
  {
    icon: React.ComponentType<{ className?: string }>;
    border: string;
    bg: string;
    iconColor: string;
    fallback: string;
  }
> = {
  credentials: {
    icon: AlertCircle,
    border: "border-destructive/20",
    bg: "bg-destructive/5",
    iconColor: "text-destructive",
    fallback: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  },
  inactive: {
    icon: Ban,
    border: "border-warning/20",
    bg: "bg-warning/5",
    iconColor: "text-warning",
    fallback: "هذا الحساب غير نشط. يرجى التواصل مع الدعم",
  },
  "subscription-expired": {
    icon: Ban,
    border: "border-orange-500/20",
    bg: "bg-orange-500/5",
    iconColor: "text-orange-500",
    fallback: "انتهت صلاحية الاشتراك. يرجى تجديد الاشتراك للمتابعة",
  },
  "tenant-disabled": {
    icon: Ban,
    border: "border-destructive/20",
    bg: "bg-destructive/5",
    iconColor: "text-destructive",
    fallback: "هذه المؤسسة غير متاحة حالياً",
  },
  "too-many-attempts": {
    icon: Timer,
    border: "border-orange-500/20",
    bg: "bg-orange-500/5",
    iconColor: "text-orange-500",
    fallback: "محاولات كثيرة جداً. حاول لاحقاً",
  },
  "server-unavailable": {
    icon: ServerCrash,
    border: "border-destructive/20",
    bg: "bg-destructive/5",
    iconColor: "text-destructive",
    fallback: "تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً",
  },
  offline: {
    icon: WifiOff,
    border: "border-muted-foreground/15",
    bg: "bg-muted/30",
    iconColor: "text-muted-foreground",
    fallback: "لا يوجد اتصال بالإنترنت",
  },
  generic: {
    icon: AlertCircle,
    border: "border-destructive/20",
    bg: "bg-destructive/5",
    iconColor: "text-destructive",
    fallback: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى",
  },
};

const ErrorMessage = memo(function ErrorMessage({
  kind = "generic",
  message,
  shake = false,
}: ErrorMessageProps) {
  const c = config[kind];
  const Icon = c.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={kind + (message ?? "")}
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{
          opacity: 1,
          y: 0,
          height: "auto",
          x: shake ? [0, -4, 4, -4, 4, 0] : 0,
        }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 overflow-hidden",
          c.border,
          c.bg,
        )}
        role="alert"
      >
        <div
          className={cn(
            "mt-0.5 flex h-4 w-4 items-center justify-center shrink-0",
            c.iconColor,
          )}
        >
          <Icon className="h-full w-full" />
        </div>
        <p className="text-xs font-medium text-foreground">
          {message || c.fallback}
        </p>
      </motion.div>
    </AnimatePresence>
  );
});

export { ErrorMessage, type NoticeKind };
