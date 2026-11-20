import { describe, expect, it } from "vitest";
import { Atom, GraduationCap } from "lucide-react";
import { resolveNavbarLogo } from "./navbar-logo";

describe("resolveNavbarLogo", () => {
  it("uses the configured built-in icon and never emits an image plan for icon mode", () => {
    const plan = resolveNavbarLogo({
      logoType: "icon",
      logoIcon: "Atom",
      logoImage: "/api/v1/media/serve/broken.png",
    });

    expect(plan.kind).toBe("icon");
    if (plan.kind === "icon") expect(plan.icon).toBe(Atom);
  });

  it("falls back to the default cap icon for an unknown icon key", () => {
    const plan = resolveNavbarLogo({
      logoType: "icon",
      logoIcon: "NotAnIcon",
    });

    expect(plan.kind).toBe("icon");
    if (plan.kind === "icon") expect(plan.icon).toBe(GraduationCap);
  });

  it("orders image candidates and deduplicates them so a broken logo can be retried", () => {
    const plan = resolveNavbarLogo({
      logoType: "image",
      logoImage: "/api/v1/media/serve/tenants/1/media/image/missing.png",
      alternateImage: "https://cdn.example.com/logo.png",
      legacyLogo: "/uploads/legacy.png",
    });

    expect(plan).toMatchObject({
      kind: "image",
      src: "/api/v1/media/serve/tenants/1/media/image/missing.png",
      fallbacks: ["https://cdn.example.com/logo.png", "/uploads/legacy.png"],
    });
  });

  it("keeps a legacy logo when the chosen image is missing", () => {
    const plan = resolveNavbarLogo({
      logoType: "image",
      logoIcon: "Atom",
      legacyLogo: "/uploads/legacy.png",
    });

    expect(plan.kind).toBe("image");
    if (plan.kind === "image") {
      expect(plan.src).toBe("/uploads/legacy.png");
      expect(plan.fallbackIcon).toBe(Atom);
    }
  });

  it("prefers the dark logo in dark mode", () => {
    const plan = resolveNavbarLogo({
      logoImage: "/api/v1/media/serve/light.png",
      darkLogo: "/api/v1/media/serve/dark.png",
      legacyLogo: "/uploads/legacy.png",
      theme: "dark",
    });

    expect(plan).toMatchObject({
      kind: "image",
      src: "/api/v1/media/serve/light.png",
      fallbacks: ["/api/v1/media/serve/dark.png", "/uploads/legacy.png"],
    });
  });

  it("normalizes protocol-less image hosts so the browser never resolves them relatively", () => {
    const plan = resolveNavbarLogo({
      logoType: "image",
      logoImage: "cdn.example.com/logo.png",
    });

    expect(plan.kind).toBe("image");
    if (plan.kind === "image") expect(plan.src).toBe("https://cdn.example.com/logo.png");
  });

  it("falls back to the icon when no image source exists at all", () => {
    const plan = resolveNavbarLogo({ logoType: "image" });

    expect(plan.kind).toBe("icon");
    if (plan.kind === "icon") expect(plan.icon).toBe(GraduationCap);
  });
});
