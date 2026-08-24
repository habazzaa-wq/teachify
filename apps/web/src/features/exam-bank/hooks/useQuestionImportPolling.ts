"use client";

import { useEffect, useRef } from "react";
import {
  importPollDelayMs,
  isTerminalImportStatus,
} from "../services/import-polling";
import type { QuestionImportStatus } from "../services/import-types";
import { examBankService } from "../services";

interface UseQuestionImportPollingOptions {
  /** Import uuid to poll; polling runs only when enabled and id is set. */
  importId: string | null | undefined;
  enabled: boolean;
  /**
   * Change this value to re-arm polling for the same import id (e.g. after
   * retry resets a failed import back to pending).
   */
  restartKey?: string | number;
  /** Called with every successful status fetch (including terminal ones). */
  onUpdate: (next: QuestionImportStatus) => void;
  /**
   * Called when a poll fails; consecutiveFailures drives the backoff UI if
   * the consumer wants to surface degraded connectivity.
   */
  onError?: (consecutiveFailures: number) => void;
}

/**
 * Polls question-import status with:
 *  - sequential setTimeout fetches (never overlapping),
 *  - capped exponential backoff on failures (1.5s → 8s, ±15% jitter),
 *  - immediate stop on terminal statuses (ready/failed/consumed/expired),
 *  - pause while the tab is hidden, resuming immediately on return.
 *
 * The previous fixed 1.5s setInterval polled forever — including after the
 * import had failed and while the tab was backgrounded — multiplying server
 * load by open dialogs for no user value.
 */
export function useQuestionImportPolling({
  importId,
  enabled,
  restartKey,
  onUpdate,
  onError,
}: UseQuestionImportPollingOptions): void {
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  // Keep latest callbacks without re-arming the polling effect on rerenders.
  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!enabled || !importId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let consecutiveFailures = 0;

    const schedule = (delayMs: number) => {
      timer = setTimeout(() => void tick(), delayMs);
    };

    const tick = async () => {
      if (cancelled) return;

      // Background tabs do not need fresh statuses; skip the round trip and
      // retry shortly after becoming visible again.
      if (typeof document !== "undefined" && document.hidden) {
        schedule(importPollDelayMs(consecutiveFailures));
        return;
      }

      try {
        const next = await examBankService.getQuestionImport(importId);
        if (cancelled) return;

        consecutiveFailures = 0;
        onUpdateRef.current(next);

        // Terminal imports are final: keep polling and you just burn the API
        // (the old loop spun on "failed" indefinitely).
        if (isTerminalImportStatus(next.status)) return;

        schedule(importPollDelayMs(0));
      } catch {
        if (cancelled) return;

        consecutiveFailures += 1;
        onErrorRef.current?.(consecutiveFailures);
        schedule(importPollDelayMs(consecutiveFailures));
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden || cancelled) return;

      // Visible again: refresh immediately instead of waiting out the timer.
      clearTimeout(timer);
      void tick();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    void tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, importId, restartKey]);
}
