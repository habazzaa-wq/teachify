"use client";

import { Inbox, Search, Shield, Database, FileSearch } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface EmptyStateBase {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyStateWrapper({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateBase) {
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
      <div className="mb-4 rounded-2xl bg-studio-soft p-4 text-studio-fg-subtle">
        {icon}
      </div>
      {title && (
        <h3 className="text-base font-semibold text-studio-fg mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-studio-fg-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

export function StudioEmptyState(props: EmptyStateBase) {
  return (
    <EmptyStateWrapper
      icon={props.icon || <Inbox className="h-8 w-8" />}
      title={props.title || "لا توجد عناصر"}
      description={props.description || "لم يتم إضافة أي عناصر بعد."}
      {...props}
    />
  );
}

export function StudioSearchEmpty(props: Omit<EmptyStateBase, "icon">) {
  return (
    <EmptyStateWrapper
      icon={<Search className="h-8 w-8" />}
      title={props.title || "لا توجد نتائج"}
      description={props.description || "لم نتمكن من العثور على أي نتائج مطابقة لبحثك."}
      {...props}
    />
  );
}

export function StudioPermissionEmpty(props: Omit<EmptyStateBase, "icon">) {
  return (
    <EmptyStateWrapper
      icon={<Shield className="h-8 w-8" />}
      title={props.title || "لا تملك الصلاحية"}
      description={props.description || "ليس لديك صلاحية للوصول إلى هذه المحتويات."}
      {...props}
    />
  );
}

export function StudioNoData(props: Omit<EmptyStateBase, "icon">) {
  return (
    <EmptyStateWrapper
      icon={<Database className="h-8 w-8" />}
      title={props.title || "لا توجد بيانات"}
      description={props.description || "لم يتم العثور على بيانات لعرضها."}
      {...props}
    />
  );
}

export function StudioNoResults(props: Omit<EmptyStateBase, "icon">) {
  return (
    <EmptyStateWrapper
      icon={<FileSearch className="h-8 w-8" />}
      title={props.title || "لا توجد نتائج"}
      description={props.description || "حاول تعديل معايير البحث أو التصفية."}
      {...props}
    />
  );
}
