"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";
import { useCommunityCategories } from "@/features/community/hooks/useChannels";
import { useCommunityStore } from "@/features/community/stores/community.store";
import { CommunityLayoutShell } from "@/features/community/components/shell/CommunityLayoutShell";
import { ChannelSidebar } from "@/features/community/components/sidebar/ChannelSidebar";
import { MemberSidebar } from "@/features/community/components/sidebar/MemberSidebar";
import { MainChat } from "@/features/community/components/chat/MainChat";

export default function CommunityPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const activeChannelId = useCommunityStore((s) => s.activeChannelId);
  const setActiveChannel = useCommunityStore((s) => s.setActiveChannel);
  const { data: categories } = useCommunityCategories();

  // Redirect guests to the home page.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(routes.home);
    }
  }, [status, router]);

  // Auto-select the first accessible channel once categories load.
  useEffect(() => {
    if (activeChannelId || !categories || categories.length === 0) return;
    const first = categories
      .flatMap((c) => c.channels ?? [])
      .find((channel) => channel.status === "active" && !channel.is_locked);
    if (first) {
      setActiveChannel(first.id);
    }
  }, [activeChannelId, categories, setActiveChannel]);

  return (
    <CommunityLayoutShell
      channelSidebar={<ChannelSidebar />}
      rightSidebar={<MemberSidebar />}
    >
      <MainChat />
    </CommunityLayoutShell>
  );
}
