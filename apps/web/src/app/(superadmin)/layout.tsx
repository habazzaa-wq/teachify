import type { Metadata } from "next";
import { PlatformAuthProvider } from "@/providers/PlatformAuthProvider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformAuthProvider>{children}</PlatformAuthProvider>;
}
