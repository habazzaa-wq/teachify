import { describe, it, expect } from "vitest";
import { formatETA } from "./format";

/**
 * Regression guard: a stalled upload must NEVER surface an absurd, effectively-
 * infinite ETA. Previously a smoothing-decay bug drove displayed speed toward
 * zero, making `eta = remaining / speed` explode to millions of hours. This
 * formatter is the last line of defence at the presentation layer: any ETA
 * beyond a sane horizon is rendered as unknown ("—") rather than as a huge
 * alarming countdown.
 */
describe("formatETA", () => {
  it("renders null / non-finite / negative as unknown", () => {
    expect(formatETA(null)).toBe("—");
    expect(formatETA(Number.POSITIVE_INFINITY)).toBe("—");
    expect(formatETA(Number.NaN)).toBe("—");
    expect(formatETA(-1)).toBe("—");
  });

  it("renders small / sub-second ETAs naturally", () => {
    expect(formatETA(0.4)).toBe("لحظات");
    expect(formatETA(0)).toBe("لحظات");
  });

  it("renders seconds / minutes / hours", () => {
    expect(formatETA(5)).toBe("5ث");
    expect(formatETA(75)).toBe("1د 15ث");
    expect(formatETA(3661)).toBe("1س 1د");
  });

  it("caps anything at or beyond 24h as unknown instead of a huge countdown", () => {
    // 1000000 seconds ≈ 11.5 days — must never print a multi-thousand-hour value.
    expect(formatETA(1_000_000)).toBe("—");
    expect(formatETA(3_600_000)).toBe("—");
    // Boundary: exactly 24h is also treated as unknown.
    expect(formatETA(86_400)).toBe("—");
    // A large but sub-24h value still renders a bounded, sensible string.
    expect(formatETA(86_399)).toMatch(/^2\dس \d\dد$/);
  });
});
