"use client";

import { AppDrawer } from "@/components/ui/AppDrawer";
import { useCommunityStore } from "../../stores/community.store";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { CommunitySearchDialog } from "../search/CommunitySearchDialog";
import { ExamBlockedScreen } from "../exam/ExamBlockedScreen";

interface CommunityLayoutShellProps {
  channelSidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Three-pane community shell:
 *  - Channel sidebar (static on lg+, drawer on mobile)
 *  - Main chat area (children)
 *  - Members / info sidebar (static on xl+, drawer below)
 */
export function CommunityLayoutShell({
  channelSidebar,
  rightSidebar,
  children,
}: CommunityLayoutShellProps) {
  const mobileChannelsOpen = useCommunityStore((s) => s.mobileChannelsOpen);
  const setMobileChannelsOpen = useCommunityStore((s) => s.setMobileChannelsOpen);
  const rightPaneOpen = useCommunityStore((s) => s.rightPaneOpen);
  const setRightPaneOpen = useCommunityStore((s) => s.setRightPaneOpen);

  const isXl = useMediaQuery("(min-width: 1280px)");

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      {/* Desktop channel sidebar */}
      <aside className="relative z-10 hidden w-72 shrink-0 border-e border-border/70 bg-sidebar shadow-sm lg:flex lg:flex-col">
        {channelSidebar}
      </aside>

      {/* Main chat area */}
      <main className="flex min-w-0 flex-1 flex-col bg-background">{children}</main>

      {/* Desktop info/members sidebar */}
      {rightPaneOpen && (
        <aside className="relative z-10 hidden w-80 shrink-0 border-s border-border/70 bg-card shadow-sm xl:flex xl:flex-col">
          {rightSidebar}
        </aside>
      )}

      {/* Mobile channel drawer */}
      <AppDrawer
        open={mobileChannelsOpen}
        onOpenChange={setMobileChannelsOpen}
        side="start"
        className="w-[86vw] max-w-xs shadow-2xl"
      >
        {channelSidebar}
      </AppDrawer>

      {/* Mobile info drawer (below xl) */}
      {!isXl && (
        <AppDrawer
          open={rightPaneOpen}
          onOpenChange={setRightPaneOpen}
          side="end"
          className="w-[88vw] max-w-sm shadow-2xl"
        >
          {rightSidebar}
        </AppDrawer>
      )}

      <CommunitySearchDialog />
      <ExamBlockedScreen />
    </div>
  );
}
