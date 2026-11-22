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
      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        <InstructorWorkspaceLayout>{children}</InstructorWorkspaceLayout>
        {!isAuthPage && <UploadManager />}
      </div>
    </InstructorAuthProvider>
  );
}
