import { PlatformAuthProvider } from "@/providers/PlatformAuthProvider";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformAuthProvider>{children}</PlatformAuthProvider>;
}
