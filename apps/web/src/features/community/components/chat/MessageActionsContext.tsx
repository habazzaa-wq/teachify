"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useAcceptMessage,
  useBookmarkMessage,
  useDeleteMessage,
  useEditMessage,
  useHighlightMessage,
  useOfficialMessage,
  usePinMessage,
  useSolveMessage,
  useToggleReaction,
} from "../../hooks/useMessageActions";

interface MessageActionsValue {
  toggleReaction: ReturnType<typeof useToggleReaction>;
  deleteMessage: ReturnType<typeof useDeleteMessage>;
  editMessage: ReturnType<typeof useEditMessage>;
  pinMessage: ReturnType<typeof usePinMessage>;
  solveMessage: ReturnType<typeof useSolveMessage>;
  acceptMessage: ReturnType<typeof useAcceptMessage>;
  officialMessage: ReturnType<typeof useOfficialMessage>;
  highlightMessage: ReturnType<typeof useHighlightMessage>;
  bookmark: ReturnType<typeof useBookmarkMessage>;
}

const MessageActionsContext = createContext<MessageActionsValue | null>(null);

/** Instantiates all message mutations once for the whole chat pane. */
export function MessageActionsProvider({ children }: { children: ReactNode }) {
  const value: MessageActionsValue = {
    toggleReaction: useToggleReaction(),
    deleteMessage: useDeleteMessage(),
    editMessage: useEditMessage(),
    pinMessage: usePinMessage(),
    solveMessage: useSolveMessage(),
    acceptMessage: useAcceptMessage(),
    officialMessage: useOfficialMessage(),
    highlightMessage: useHighlightMessage(),
    bookmark: useBookmarkMessage(),
  };

  return (
    <MessageActionsContext.Provider value={value}>
      {children}
    </MessageActionsContext.Provider>
  );
}

export function useMessageActions(): MessageActionsValue {
  const ctx = useContext(MessageActionsContext);
  if (!ctx) {
    throw new Error("useMessageActions must be used within MessageActionsProvider");
  }
  return ctx;
}
