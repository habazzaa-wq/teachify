import { describe, expect, it } from "vitest";
import { mergeTenantSeedWithStored } from "./tenant-seed";
import type { ActiveTenant } from "@/types/tenant.types";

function tenant(overrides: Partial<ActiveTenant> = {}): ActiveTenant {
  return {
    id: 28,
    name: "Geo Top",
    slug: "geo-top",
    status: "active",
    domain: "geo-top.teachify.tech",
    feature_flags: { has_instructors: true },
    branding: {
      logo: null,
      favicon: null,
      primary_color: "#DC2626",
      secondary_color: "#FEF2F2",
      accent_color: null,
      font: "Tajawal",
      dark_logo: null,
      light_logo: null,
    },
    platform_branding: {
      logo: null,
      favicon: null,
      primaryColor: "#DC2626",
      secondaryColor: "#FEF2F2",
      accentColor: null,
      font: null,
      darkLogo: null,
      lightLogo: null,
      logoType: null,
      logoIcon: null,
      logoImage: null,
    },
    ...overrides,
  } as ActiveTenant;
}

describe("mergeTenantSeedWithStored", () => {
  it("lets the server payload beat stale persisted font and feature flags", () => {
    const merged = mergeTenantSeedWithStored(
      tenant(),
      tenant({
        domain: "www.geo-top.teachify.tech",
        feature_flags: { has_instructors: false },
        branding: {
          logo: null,
          favicon: null,
          primary_color: "#000000",
          secondary_color: null,
          accent_color: null,
          font: "Cairo",
          dark_logo: null,
          light_logo: null,
        },
      }),
    );

    expect(merged?.feature_flags?.has_instructors).toBe(true);
    expect(merged?.branding?.font).toBe("Tajawal");
    expect(merged?.platform_branding?.font).toBe("Tajawal");
  });

  it("uses the server payload when the persisted tenant is a different one", () => {
    const seed = tenant();
    const merged = mergeTenantSeedWithStored(
      seed,
      tenant({ id: 7, slug: "other", domain: "other.example.com" }),
    );

    expect(merged?.id).toBe(seed.id);
    expect(merged?.branding?.font).toBe("Tajawal");
  });

  it("keeps a font changed in the current session, including clearing it", () => {
    const seed = tenant();
    const stored = tenant({
      branding: { ...(seed.branding ?? {}), font: "Rubik" } as NonNullable<
        ActiveTenant["branding"]
      >,
    });

    expect(mergeTenantSeedWithStored(seed, stored, "Rubik")?.branding?.font).toBe("Rubik");
    expect(mergeTenantSeedWithStored(seed, stored, null)?.branding?.font).toBeNull();
  });

  it("returns the stored tenant when there is no server context", () => {
    const stored = tenant();
    expect(mergeTenantSeedWithStored(null, stored)).toBe(stored);
  });
});
