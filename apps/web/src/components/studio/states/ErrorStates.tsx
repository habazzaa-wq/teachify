"use client";

import { AlertTriangle, WifiOff, Shield, ServerCrash, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { StudioButton } from "../primitives/StudioButton";

interface ErrorBase {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

function ErrorWrapper({
  icon,
  title,
  description,
  action,
  onRetry,
  className,
}: ErrorBase & { icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 rounded-2xl bg-studio-danger/5 p-4 text-studio-danger">
        {icon}
      </div>
      {title && (
        <h3 className="text-base font-semibold text-studio-fg mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-studio-fg-muted max-w-sm mb-6">{description}</p>
      )}
      {action}
      {onRetry && !action && (
        <StudioButton variant="soft" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </StudioButton>
      )}
    </motion.div>
  );
}

export function StudioGenericError(props: ErrorBase) {
  return (
    <ErrorWrapper
      icon={<AlertTriangle className="h-8 w-8" />}
      title={props.title || "حدث خطأ"}
      description={props.description || "عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."}
      {...props}
    />
  );
}

export function StudioOfflineError(props: ErrorBase) {
  return (
    <ErrorWrapper
      icon={<WifiOff className="h-8 w-8" />}
      title={props.title || "لا يوجد اتصال"}
      description={props.description || "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."}
      {...props}
    />
  );
}

export function StudioPermissionError(props: ErrorBase) {
  return (
    <ErrorWrapper
      icon={<Shield className="h-8 w-8" />}
      title={props.title || "غير مصرح"}
      description={props.description || "ليس لديك صلاحية للوصول إلى هذه الصفحة."}
      {...props}
    />
  );
}

export function StudioServerError(props: ErrorBase) {
  return (
    <ErrorWrapper
      icon={<ServerCrash className="h-8 w-8" />}
      title={props.title || "خطأ في الخادم"}
      description={props.description || "حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً."}
      {...props}
    />
  );
}

export function StudioRetryError(props: ErrorBase & { onRetry: () => void }) {
  return (
    <ErrorWrapper
      icon={<AlertTriangle className="h-8 w-8" />}
      title={props.title || "فشلت العملية"}
      description={props.description || "لم تتمكن العملية من الإكمال. يرجى المحاولة مرة أخرى."}
      action={
        props.action || (
          <StudioButton variant="soft" size="sm" onClick={props.onRetry}>
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </StudioButton>
        )
      }
      {...props}
    />
  );
}
