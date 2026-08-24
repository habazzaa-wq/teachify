import type { QuestionImportStatus } from "./import-types";

/**
 * Pure scheduling logic for question-import status polling. Kept free of DOM
 * and React so it is unit-testable in the node vitest environment; the hook
 * in hooks/useQuestionImportPolling.ts wires it to timers/visibility.
 */

/** Statuses that end the import lifecycle — polling must stop on these. */
export const IMPORT_TERMINAL_STATUSES = [
  "ready",
  "failed",
  "consumed",
  "expired",
] as const;

export function isTerminalImportStatus(
  status: QuestionImportStatus["status"],
): boolean {
  return (IMPORT_TERMINAL_STATUSES as readonly string[]).includes(status);
}

/** Poll cadence for consecutive failures: 1.5s → 2s → 3s → 5s → capped 8s. */
export const IMPORT_POLL_SCHEDULE_MS = [1500, 2000, 3000, 5000] as const;

export const IMPORT_POLL_MAX_DELAY_MS = 8000;

/** Successful polls stay at the base interval for a responsive feel. */
export const IMPORT_POLL_BASE_DELAY_MS = IMPORT_POLL_SCHEDULE_MS[0];

/** Jitter fraction applied to delays so many clients never poll in lockstep. */
export const IMPORT_POLL_JITTER = 0.15;

function clampJitter(random: number): number {
  return Math.min(Math.max(random, 0), 1);
}

/**
 * Delay before the next poll.
 *
 * @param consecutiveFailures number of polls that have failed in a row
 *   (0 = last poll succeeded)
 * @param random injectable jitter source in [0, 1] for deterministic tests
 */
export function importPollDelayMs(
  consecutiveFailures: number,
  random: number = Math.random(),
): number {
  // Failure #1 retries at the base interval, then walks the schedule; once
  // the schedule is exhausted the delay pins to the max cap.
  const idx = consecutiveFailures - 1;
  const base =
    consecutiveFailures === 0
      ? IMPORT_POLL_BASE_DELAY_MS
      : idx < IMPORT_POLL_SCHEDULE_MS.length
        ? (IMPORT_POLL_SCHEDULE_MS[idx] ?? IMPORT_POLL_MAX_DELAY_MS)
        : IMPORT_POLL_MAX_DELAY_MS;

  const jitter = clampJitter(random) * 2 - 1; // [-1, 1]
  const delay = base * (1 + IMPORT_POLL_JITTER * jitter);

  return Math.round(delay);
}
