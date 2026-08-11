"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCurrentMember } from "../../hooks/useCurrentMember";
import { useMessageActions } from "./MessageActionsContext";
import { EmojiPicker } from "./EmojiPicker";
import type { CommunityMessage, CommunityReaction } from "../../types";

const PICKER_WIDTH = 288;
const PICKER_HEIGHT = 300;

/**
 * Position a fixed popover near a trigger button's rect without going off-screen.
 */
function pickerPosition(rect: DOMRect): { top: number; left: number } {
  const margin = 8;
  let top = rect.top - PICKER_HEIGHT - margin;
  if (top < margin) top = rect.bottom + margin;
  const left = Math.min(
    Math.max(margin, rect.left),
    window.innerWidth - PICKER_WIDTH - margin,
  );
  return { top, left };
}

/** Reaction row under a message — each pill toggles the reaction. */
export function ReactionBar({ message }: { message: CommunityMessage }) {
  const { toggleReaction } = useMessageActions();
  const { memberId } = useCurrentMember();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const reactions = message.reactions ?? [];

  const openPicker = () => {
    const btn = triggerRef.current;
    if (btn) setPickerPos(pickerPosition(btn.getBoundingClientRect()));
    setShowPicker(true);
  };

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
          ref={triggerRef}
          type="button"
          onClick={openPicker}
          className="flex h-6 items-center gap-0.5 rounded-full border border-transparent px-1.5 text-muted-foreground transition-colors hover:border-border hover:bg-muted"
          aria-label="إضافة تفاعل"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>
        {showPicker &&
          createPortal(
            <EmojiPicker
              style={{
                position: "fixed",
                top: pickerPos.top,
                left: pickerPos.left,
                zIndex: 50,
              }}
              onSelect={(emoji: string) => {
                toggleReaction.mutate({ messageId: message.id, emoji });
                setShowPicker(false);
              }}
              onClose={() => setShowPicker(false)}
            />,
            document.body,
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
