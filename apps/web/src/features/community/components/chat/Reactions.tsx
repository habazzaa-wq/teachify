"use client";

import { useMemo, useState } from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCurrentMember } from "../../hooks/useCurrentMember";
import { useMessageActions } from "./MessageActionsContext";
import { EmojiPicker } from "./EmojiPicker";
import type { CommunityMessage, CommunityReaction } from "../../types";

/** Reaction row under a message — each pill toggles the reaction. */
export function ReactionBar({ message }: { message: CommunityMessage }) {
  const { toggleReaction } = useMessageActions();
  const { memberId } = useCurrentMember();
  const [showPicker, setShowPicker] = useState(false);

  const reactions = message.reactions ?? [];

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => (
        <ReactionPill
          key={reaction.emoji}
          reaction={reaction}
          mine={memberId != null && reaction.members.some((m) => m.id === memberId)}
          onClick={() => toggleReaction.mutate({ messageId: message.id, emoji: reaction.emoji })}
        />
      ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="flex h-6 items-center gap-0.5 rounded-full border border-transparent px-1.5 text-muted-foreground transition-colors hover:border-border hover:bg-muted"
          aria-label="إضافة تفاعل"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>
        {showPicker && (
          <EmojiPicker
            className="bottom-full mb-1"
            onSelect={(emoji: string) => {
              toggleReaction.mutate({ messageId: message.id, emoji });
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  );
}

function ReactionPill({
  reaction,
  mine,
  onClick,
}: {
  reaction: CommunityReaction;
  mine: boolean;
  onClick: () => void;
}) {
  const members = useMemo(
    () => reaction.members.map((m) => m.name ?? "عضو").join("، "),
    [reaction.members],
  );
  return (
    <button
      type="button"
      title={members || reaction.emoji}
      onClick={onClick}
      className={cn(
        "flex h-6 items-center gap-1 rounded-full border px-1.5 text-xs font-semibold transition-all",
        mine
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border bg-muted/50 hover:bg-muted",
      )}
    >
      <span>{reaction.emoji}</span>
      <span className="tabular-nums">{reaction.count}</span>
    </button>
  );
}
