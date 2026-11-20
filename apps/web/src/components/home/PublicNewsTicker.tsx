import dynamic from "next/dynamic";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { newsKeys } from "@/features/homepage/news/keys";
import { newsServerService } from "@/features/homepage/news/server-services";
import { getQueryClient } from "@/lib/get-query-client";

const NewsTicker = dynamic(
  () => import("@/components/home/NewsTicker").then((module) => module.NewsTicker),
  { ssr: true },
);

export async function PublicNewsTicker() {
  const news = await newsServerService.getPublicNews();
  const queryClient = getQueryClient();

  if (news) {
    queryClient.setQueryData(newsKeys.public, news);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NewsTicker />
    </HydrationBoundary>
  );
}
