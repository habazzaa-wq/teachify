import { describe, expect, it } from "vitest";
import { buildFontStack, resolveTenantFont } from "./google-fonts";

describe("resolveTenantFont", () => {
  it("uses the tenant branding font when present", () => {
    expect(
      resolveTenantFont(
        { font: "Tajawal" },
        { font: "Cairo" },
        { font: "Poppins" },
      ),
    ).toBe("Tajawal");
  });

  it("falls back to the platform branding font", () => {
    expect(resolveTenantFont({ font: null }, { font: "  Rubik  " })).toBe("Rubik");
  });

  it("returns null when no source carries a font", () => {
    expect(resolveTenantFont(null, { font: "" }, undefined)).toBeNull();
  });
});

describe("buildFontStack", () => {
  it("never aliases Almarai to the shell-specific display variable", () => {
    const stack = buildFontStack("Almarai");
    expect(stack).toContain("var(--font-almarai-local)");
    expect(stack).not.toContain("var(--font-display)");
  });

  it("builds a usable stack for an arbitrary Google font", () => {
    expect(buildFontStack("Noto Kufi Arabic")).toBe(
      '"Noto Kufi Arabic", "system-ui", "sans-serif"',
    );
  });
});
