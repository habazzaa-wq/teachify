import "katex/dist/katex.min.css";
import { AuthProviders } from "@/providers/AuthProviders";
import { CommunityProvider } from "@/features/community/providers/CommunityProvider";

export default function CommunityRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviders>
      <CommunityProvider>{children}</CommunityProvider>
    </AuthProviders>
  );
}
