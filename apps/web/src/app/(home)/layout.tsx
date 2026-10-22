import { Amiri } from "next/font/google";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { PublicLayout } from "@/layouts/PublicLayout";
import { newsKeys } from "@/features/homepage/news/keys";
import { newsServerService } from "@/features/homepage/news/server-services";
import { getQueryClient } from "@/lib/get-query-client";

/**
 * Editorial display face for the public pages (headings, catalogue stamps).
 * Deliberately distinct from the tenant body face (`--font-sans`, default
 * Cairo) so the section reads as printed matter, not another sans header.
 */
const displayFont = Amiri({
  subsets: ["arabic", "latin"],
  weight: "700",
  variable: "--font-display",
  display: "swap",
});

export default async function HomeRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  const news = await newsServerService.getPublicNews();

  if (news) {
    queryClient.setQueryData(newsKeys.public, news);
  }

  return (
    <div className={displayFont.variable}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PublicLayout>{children}</PublicLayout>
      </HydrationBoundary>
    </div>
  );
}
