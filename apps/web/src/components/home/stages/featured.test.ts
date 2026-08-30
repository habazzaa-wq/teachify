import { describe, expect, it } from "vitest";
import type { EducationalStage } from "./types";
import { pickFeaturedStages } from "./featured";

function stage(id: number, featured?: boolean): EducationalStage {
  return { id, name: `مرحلة ${id}`, featured };
}

describe("pickFeaturedStages", () => {
  it("returns an empty pick for an empty list", () => {
    const pick = pickFeaturedStages([]);
    expect(pick.featured).toBeNull();
    expect(pick.hasFeatured).toBe(false);
    expect(pick.rest).toEqual([]);
  });

  it("heroes the first stage by default when nothing is flagged", () => {
    const pick = pickFeaturedStages([stage(1), stage(2), stage(3)]);
    expect(pick.featured?.id).toBe(1);
    expect(pick.hasFeatured).toBe(true);
    expect(pick.rest.map((s) => s.id)).toEqual([2, 3]);
  });

  it("heroes the explicitly flagged stage regardless of position", () => {
    const pick = pickFeaturedStages([stage(1), stage(2, true), stage(3)]);
    expect(pick.featured?.id).toBe(2);
    expect(pick.rest.map((s) => s.id)).toEqual([1, 3]);
  });

  it("prefers the explicit flag over the default-first rule", () => {
    const pick = pickFeaturedStages([stage(1, true), stage(2, true), stage(3)]);
    expect(pick.featured?.id).toBe(1);
  });

  it("falls back to the even grid when heroByDefault is off and nothing is flagged", () => {
    const pick = pickFeaturedStages([stage(1), stage(2), stage(3)], { heroByDefault: false });
    expect(pick.featured).toBeNull();
    expect(pick.hasFeatured).toBe(false);
    expect(pick.rest.map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it("still heroes the flagged stage with heroByDefault off", () => {
    const pick = pickFeaturedStages([stage(1), stage(2, true)], { heroByDefault: false });
    expect(pick.featured?.id).toBe(2);
    expect(pick.rest.map((s) => s.id)).toEqual([1]);
  });

  it("handles a single stage (heroed when allowed)", () => {
    const pick = pickFeaturedStages([stage(7)]);
    expect(pick.featured?.id).toBe(7);
    expect(pick.rest).toEqual([]);
  });
});