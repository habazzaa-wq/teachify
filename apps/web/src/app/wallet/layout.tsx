import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function WalletRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="community-theme">{children}</div>;
}
