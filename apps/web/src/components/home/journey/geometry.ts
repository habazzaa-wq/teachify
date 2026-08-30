import type { JourneyFlow, JourneyGeometry, JourneyStationAnchor } from "./types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  GEOGRAPHY OF THE JOURNEY MAP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Everything is computed from two numbers only — the stage count and the
 *  current flow (horizontal / vertical). No coordinates are hand-authored, so
 *  the map works for 1, 2, 5 or 9 stages without touching the components.
 *
 * · The geometry lives in a fixed SVG viewBox coordinate space (e.g. 1400×520).
 * · HTML stations are positioned with the SAME coordinates converted to
 *   percentages of the container (`x / width * 100`), and the `<svg>` underlay
 *   uses `preserveAspectRatio="none"` to stretch over that exact container.
 *   Because both layers share one mapping, the two are perfectly aligned at
 *   ANY container size with zero DOM measurement.
 * · `vector-effect="non-scaling-stroke"` on the path keeps the stroke a
 *   constant 2.5px even though the viewBox is stretched independently on the
 *   x and y axes.
 * · The path itself is a Catmull-Rom spline through the anchors (converted to
 *   cubic Béziers), so it is smooth (not a jagged zigzag) while the stations
 *   still alternate above/below the midline for rhythm.
 * · RTL support is one flip: when `rtl` is true every x coordinate is mirrored
 *   (`x' = width - x`), so the journey reads right→left on Arabic pages and the
 *   first stage sits at the right edge.
 *
 *  Horizontal (desktop/tablet):                                 1400 wide
 *  ─────────────────────────────
 *   Row −1 (upper band)  █ label █
 *                         node ⊕◁─── path arcs through every node center
 *   Row +1 (lower band)   node ⊕
 *                         █ label █
 *   Labels always sit on the OUTER vertical edge (above the node for the
 *   upper row, below for the lower row) so text never crosses the road.
 *
 *  Vertical (mobile, top→bottom):                               420 wide
 *  ──────────────────────────────
 *   Stations stack in fixed-height slots, gently offset left/right, and the
 *   SVG spans the exact container height (`containerHeight()`) so the path
 *   scales 1:1 in pixels. It draws itself in sync with page scroll.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Horizontal viewBox. */
const H_W = 1400;
const H_H = 520;
/** Horizontal padding so first/last stations keep breathing room. */
const H_PAD_X = 192;
/** Midline + amplitude: nodes alternate midY ∓ amp. */
const H_MID_Y = 250;
const H_AMP = 70;
/** Horizontal lead-in/lead-out extends the road past the first/last node. */
const H_LEAD = 120;

/** Vertical viewBox width + slot sizing. */
const V_W = 420;
const V_PAD_TOP = 48;
const V_SLOT = 320;
/** Zigzag x offsets (around the centerline). */
const V_OFFSET = 76;

export const JOURNEY_SKELETON_COUNT = 5;

/** Vertical viewBox height for a given stage count. */
export function verticalHeight(count: number): number {
  return V_PAD_TOP + Math.max(count, 1) * V_SLOT + 48;
}

/** Pixel height of the journey container per flow (used to avoid layout shift). */
export function journeyContainerHeight(count: number, flow: JourneyFlow): number {
  return flow === "horizontal" ? Math.round(H_H * 1.04) : verticalHeight(count);
}

interface Point {
  x: number;
  y: number;
}

/** Convert two anchors into spline points for a full pass through them. */
function buildSplinePoints(
  flow: JourneyFlow,
  rtl: boolean,
  anchors: Point[],
): Point[] {
  const points: Point[] = [];
  if (anchors.length === 0) return points;

  const first = anchors[0]!;
  const last = anchors[anchors.length - 1]!;

  if (flow === "horizontal") {
    const x0 = rtl ? H_W + H_LEAD : -H_LEAD;
    const xN = rtl ? -H_LEAD : H_W + H_LEAD;
    points.push({ x: x0, y: first.y });
    points.push(...anchors);
    points.push({ x: xN, y: last.y });
    return points;
  }

  const x0 = anchors[0]!.x;
  const xN = last.x;
  points.push({ x: x0, y: 14 });
  points.push(...anchors);
  points.push({ x: xN, y: last.y + 40 });
  return points;
}

/**
 * Catmull-Rom → cubic Bézier path.
 * Uniform spline: c1 = Pi·1 + (Pi+1 − Pi−1)/6, c2 = Pi+1 − (Pi+2 − Pi)/6,
 * with clamped end segments. Produces a calm, flowing connector.
 *
 * Also returns the cubic control points for the given segment index so
 * milestones can sample exact curve midpoints.
 */
export function splineSegments(points: Point[]): { d: string; segments: { p0: Point; c1: Point; c2: Point; p1: Point }[] } {
  const n = points.length;
  const segments: { p0: Point; c1: Point; c2: Point; p1: Point }[] = [];
  let d = "";
  if (n === 0) return { d, segments };
  if (n === 1) {
    d = `M ${points[0]!.x} ${points[0]!.y}`;
    return { d, segments };
  }

  d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const pm = points[i - 1] ?? p0;
    const pp = points[i + 2] ?? p1;
    const c1 = { x: p0.x + (p1.x - pm.x) / 6, y: p0.y + (p1.y - pm.y) / 6 };
    const c2 = { x: p1.x - (pp.x - p0.x) / 6, y: p1.y - (pp.y - p0.y) / 6 };
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p1.x} ${p1.y}`;
    segments.push({ p0, c1, c2, p1 });
  }
  return { d, segments };
}

/** Cubic Bézier at t=0.5 (used for milestone placement). */
function bezierMidpoint(seg: { p0: Point; c1: Point; c2: Point; p1: Point }): Point {
  const f = (a: number, b: number, c: number, d: number) => (a + 3 * b + 3 * c + d) / 8;
  return { x: f(seg.p0.x, seg.c1.x, seg.c2.x, seg.p1.x), y: f(seg.p0.y, seg.c1.y, seg.c2.y, seg.p1.y) };
}

/**
 * Compute the full journey geometry from the stage count.
 *
 * `rtl` mirrors every x coordinate so the path starts on the right for Arabic
 * layouts (default true — this section is RTL by contract).
 */
export function computeJourneyGeometry(
  count: number,
  opts: { flow?: JourneyFlow; rtl?: boolean } = {},
): JourneyGeometry {
  const rtl = opts.rtl ?? true;
  const flow = opts.flow ?? "horizontal";
  const n = Math.max(count, 1);

  let stations: JourneyStationAnchor[];
  let width: number;
  let height: number;

  if (flow === "horizontal") {
    width = H_W;
    height = H_H;
    stations = Array.from({ length: n }, (_, i) => {
      const t = n > 1 ? i / (n - 1) : 0.5;
      let x = H_PAD_X + (width - H_PAD_X * 2) * t;
      if (rtl) x = width - x;
      const row: -1 | 1 = i % 2 === 0 ? -1 : 1;
      return { x, y: H_MID_Y + row * H_AMP, row };
    });
  } else {
    width = V_W;
    height = verticalHeight(n);
    stations = Array.from({ length: n }, (_, i) => {
      // start-side alternates: in RTL the journey begins on the right.
      const rightSide = rtl ? i % 2 === 0 : i % 2 !== 0;
      const x = rightSide ? width / 2 + V_OFFSET : width / 2 - V_OFFSET;
      return { x, y: V_PAD_TOP + i * V_SLOT + V_SLOT / 2, row: rightSide ? 1 : -1 };
    });
  }

  const spline = splineSegments(buildSplinePoints(flow, rtl, stations));
  // The "road begins" marker sits on the FIRST segment (lead-in → station #0)
  // so it is always visible inside the viewBox on both flows.
  const start = spline.segments[0] ? bezierMidpoint(spline.segments[0]) : { ...stations[0]! };

  // Milestones only between consecutive stations (skip lead-in/lead-out).
  const milestones: Point[] = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const seg = spline.segments[i + 1];
    if (seg) milestones.push(bezierMidpoint(seg));
  }

  return { flow, rtl, width, height, stations, path: spline.d, milestones, start };
}

/** Map viewBox coordinates to CSS % positions for a station's wrapping li. */
export function anchorPercent(
  anchor: Point,
  size: { width: number; height: number },
): { left: string; top: string } {
  return {
    left: `${(anchor.x / size.width) * 100}%`,
    top: `${(anchor.y / size.height) * 100}%`,
  };
}

/** Map viewBox coordinates to CSS % for a marker (start medallion). */
export function pointPercent(p: Point, size: { width: number; height: number }) {
  return anchorPercent(p, size);
}