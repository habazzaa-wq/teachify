"use client";

import { InstructorAuthProvider } from "@/features/instructors/InstructorAuthProvider";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InstructorAuthProvider>
      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        {children}
      </div>
    </InstructorAuthProvider>
  );
}
