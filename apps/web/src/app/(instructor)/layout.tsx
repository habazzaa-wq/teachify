"use client";

import { InstructorAuthProvider } from "@/features/instructors/InstructorAuthProvider";
import { InstructorWorkspaceLayout } from "@/features/instructors/InstructorWorkspaceLayout";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InstructorAuthProvider>
      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        <InstructorWorkspaceLayout>{children}</InstructorWorkspaceLayout>
      </div>
    </InstructorAuthProvider>
  );
}
