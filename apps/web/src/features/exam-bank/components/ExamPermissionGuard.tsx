"use client";

import { usePathname } from "next/navigation";
import { PermissionGuard } from "@/components/ui";

export function ExamPermissionGuard({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/instructor/")) return <>{children}</>;

  return <PermissionGuard permission={permission}>{children}</PermissionGuard>;
}
