import { describe, expect, it } from "vitest";
import { computeJourneyGeometry, journeyContainerHeight, verticalHeight } from "./geometry";

describe("computeJourneyGeometry", () => {
  it("places the first horizontal stage at the RIGHT end in RTL", () => {
    const g = computeJourneyGeometry(5, { flow: "horizontal", rtl: true });
    expect(g.stations).toHaveLength(5);
    const xs = g.stations.map((s) => s.x);
    expect(xs[0]).toBeGreaterThan(xs[1]!);
    expect(xs[1]!).toBeGreaterThan(xs[3]!);
    // symmetric spread around the container midline
    expect(xs[0]! + xs[4]!).toBeCloseTo(g.width, 0);
  });

  it("mirrors coordinates for LTR (first stage on the left)", () => {
    const rtl = computeJourneyGeometry(4, { rtl: true });
    const ltr = computeJourneyGeometry(4, { rtl: false });
    expect(ltr.stations.map((s) => s.x)).toEqual(
      rtl.stations.map((s) => rtl.width - s.x),
    );
  });

  it("alternates rows for rhythm", () => {
    const g = computeJourneyGeometry(6, { flow: "horizontal" });
    expect(g.stations.map((s) => s.row)).toEqual([-1, 1, -1, 1, -1, 1]);
    const ys = g.stations.map((s) => s.y);
    ys.forEach((y, i) => {
      if (i > 0) expect(y).not.toBe(ys[i - 1]);
    });
  });

  it("builds a smooth multi-segment path through every station", () => {
    const g = computeJourneyGeometry(4);
    expect(g.path.startsWith("M ")).toBe(true);
    expect(g.path.match(/C /g)).not.toBeNull();
  });

  it("emits one milestone per gap between stations", () => {
    const g = computeJourneyGeometry(5);
    expect(g.milestones).toHaveLength(4);
    g.milestones.forEach((m) => {
      expect(Number.isFinite(m.x)).toBe(true);
      expect(Number.isFinite(m.y)).toBe(true);
    });
  });

  it("handles a single stage (centered) without crashing", () => {
    const g = computeJourneyGeometry(1);
    expect(g.stations).toHaveLength(1);
    expect(g.stations[0]!.x).toBeCloseTo(g.width / 2, 0);
    expect(g.path.length).toBeGreaterThan(0);
    expect(g.milestones).toHaveLength(0);
  });

  it("produces a top→bottom vertical flow with zigzag offsets", () => {
    const g = computeJourneyGeometry(4, { flow: "vertical", rtl: true });
    expect(g.stations[0]!.y).toBeLessThan(g.stations[1]!.y);
    expect(g.stations[1]!.x).not.toBe(g.stations[0]!.x);
    expect(g.stations[0]!.x).toBeGreaterThan(g.width / 2); // start-side = right in RTL
    expect(g.height).toBe(verticalHeight(4));
    expect(journeyContainerHeight(4, "vertical")).toBe(verticalHeight(4));
  });
});