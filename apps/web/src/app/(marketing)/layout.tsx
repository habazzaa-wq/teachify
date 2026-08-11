import "@/features/marketing/marketing.css";
import { MarketingNavbar } from "@/features/marketing/components/MarketingNavbar";
import { MarketingFooter } from "@/features/marketing/components/MarketingFooter";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="marketing-theme flex min-h-full flex-col bg-[hsl(var(--mk-bg))] text-[hsl(var(--mk-ink))]">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
