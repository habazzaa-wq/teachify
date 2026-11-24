"use client";

import { usePathname } from "next/navigation";
import { InstructorAuthProvider } from "@/features/instructors/InstructorAuthProvider";
import { InstructorWorkspaceLayout } from "@/features/instructors/InstructorWorkspaceLayout";
import { UploadManager } from "@/features/media-library/upload-manager";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/instructor/login" || pathname === "/instructor/change-password";

  return (
    <InstructorAuthProvider>
      {/* The theme wrapper must include the UploadManager too. It renders a
          fixed portal-like overlay that used to sit outside .tenant-theme and
          therefore ignored the saved brand colors. */}
      <div className="tenant-theme min-h-screen bg-studio-bg text-studio-fg" dir="rtl">
        <InstructorWorkspaceLayout>{children}</InstructorWorkspaceLayout>
        {!isAuthPage && <UploadManager />}
      </div>
    </InstructorAuthProvider>
  );
}
