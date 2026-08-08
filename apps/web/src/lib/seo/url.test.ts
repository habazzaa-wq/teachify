import { describe, expect, it } from "vitest";
import { absoluteUrl, canonicalUrl, resolveAssetUrl } from "./url";

const ORIGIN = "https://academy.test";

describe("canonicalUrl", () => {
  it("strips tracking params (utm_*, fbclid, gclid, ref, ...)", () => {
    const url = canonicalUrl(ORIGIN, "/courses", {
      utm_source: "fb",
      utm_medium: "social",
      fbclid: "abc123",
      gclid: "xyz",
      ref: "newsletter",
      source: "partner",
    });
    expect(url).toBe(`${ORIGIN}/courses`);
  });

  it("keeps semantic params when explicitly passed", () => {
    const url = canonicalUrl(ORIGIN, "/courses", { page: "2" });
    expect(url).toBe(`${ORIGIN}/courses?page=2`);
  });

  it("normalizes trailing slashes for non-root paths", () => {
    expect(canonicalUrl(ORIGIN, "/courses/")).toBe(`${ORIGIN}/courses`);
  });

  it("keeps root slash", () => {
    expect(canonicalUrl(ORIGIN, "/")).toBe(`${ORIGIN}/`);
  });
});

describe("absoluteUrl", () => {
  it("joins origin and root-relative path", () => {
    expect(absoluteUrl(ORIGIN, "/courses/algebra")).toBe(`${ORIGIN}/courses/algebra`);
  });

  it("normalizes a path without leading slash", () => {
    expect(absoluteUrl(ORIGIN, "courses")).toBe(`${ORIGIN}/courses`);
  });
});

describe("resolveAssetUrl", () => {
  it("keeps absolute URLs as-is", () => {
    expect(resolveAssetUrl("https://cdn.example.com/a.png", ORIGIN)).toBe(
      "https://cdn.example.com/a.png",
    );
  });

  it("protocol-relative URLs become https", () => {
    expect(resolveAssetUrl("//cdn.example.com/a.png", ORIGIN)).toBe(
      "https://cdn.example.com/a.png",
    );
  });

  it("root-relative URLs resolve against the origin", () => {
    expect(resolveAssetUrl("/uploads/a.png", ORIGIN)).toBe(
      `${ORIGIN}/uploads/a.png`,
    );
  });

  it("returns null for empty input", () => {
    expect(resolveAssetUrl(null, ORIGIN)).toBeNull();
    expect(resolveAssetUrl("  ", ORIGIN)).toBeNull();
  });
});
