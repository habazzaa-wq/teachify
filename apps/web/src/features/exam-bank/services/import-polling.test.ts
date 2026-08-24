import { describe, expect, it } from "vitest";
import {
  IMPORT_POLL_MAX_DELAY_MS,
  IMPORT_POLL_SCHEDULE_MS,
  importPollDelayMs,
  isTerminalImportStatus,
} from "./import-polling";

describe("isTerminalImportStatus", () => {
  it("treats ready/failed/consumed/expired as terminal", () => {
    expect(isTerminalImportStatus("ready")).toBe(true);
    expect(isTerminalImportStatus("failed")).toBe(true);
    expect(isTerminalImportStatus("consumed")).toBe(true);
    expect(isTerminalImportStatus("expired")).toBe(true);
  });

  it("keeps pending/processing non-terminal so polling continues", () => {
    expect(isTerminalImportStatus("pending")).toBe(false);
    expect(isTerminalImportStatus("processing")).toBe(false);
  });
});

describe("importPollDelayMs", () => {
  it("uses the base interval right after a successful poll", () => {
    // random = 0.5 → zero jitter
    expect(importPollDelayMs(0, 0.5)).toBe(1500);
  });

  it("walks the backoff schedule on consecutive failures (zero jitter)", () => {
    const delays = [1, 2, 3, 4].map((failures) => importPollDelayMs(failures, 0.5));
    expect(delays).toEqual([...IMPORT_POLL_SCHEDULE_MS]);
  });

  it("caps the delay at the maximum once the schedule is exhausted", () => {
    expect(importPollDelayMs(10, 0.5)).toBe(IMPORT_POLL_MAX_DELAY_MS);
    expect(importPollDelayMs(100, 0.5)).toBe(IMPORT_POLL_MAX_DELAY_MS);
  });

  it("applies +jitter at the top of the jitter band", () => {
    const base = importPollDelayMs(3, 0.5);
    const max = importPollDelayMs(3, 1);
    expect(max).toBe(Math.round(base * 1.15));
  });

  it("applies −jitter at the bottom of the jitter band and never goes negative", () => {
    const base = importPollDelayMs(3, 0.5);
    const min = importPollDelayMs(3, 0);
    expect(min).toBe(Math.round(base * 0.85));
    expect(min).toBeGreaterThan(0);
  });
});
