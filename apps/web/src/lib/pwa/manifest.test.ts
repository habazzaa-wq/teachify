import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TenantByDomainResponse } from "@/features/tenant-bootstrap/types";

function tenant(
  id: number,
  name: string,
  slug: string,
  domain: string,
  branding: Partial<TenantByDomainResponse["branding"]> = {},
): TenantByDomainResponse {
  return {
    id,
    name,
    slug,
    domain,
    status: "active",
    branding: {
      logo: null,
      favicon: null,
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
      font: null,
      darkLogo: null,
      lightLogo: null,
      ...branding,
    },
  };
}

const TENANT_A = tenant(
  1,
  "The Mechanist",
  "the-mechanist",
  "the-mechanist.com",
  {
    favicon: "https://cdn.the-mechanist.com/icon.ico",
    primaryColor: "#b91c1c",
    lightLogo: "https://cdn.the-mechanist.com/logo-light.svg",
  },
);

const TENANT_B = tenant(
  2,
  "Client B Academy",
  "client-b",
  "client-b.com",
  {
    favicon: "https://cdn.client-b.com/favicon.ico",
    primaryColor: "#2563eb",
    darkLogo: "https://cdn.client-b.com/logo-dark.svg",
  },
);

async function manifestFor(t: TenantByDomainResponse | null) {
  vi.resetModules();
  vi.doMock("@/lib/seo/tenant-context", () => ({
    getTenantSeoContext: vi.fn().mockResolvedValue(t),
  }));
  const { buildTenantManifest } = await import("@/lib/pwa/manifest");
  return buildTenantManifest();
}

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/seo/tenant-context");
});

describe("buildTenantManifest", () => {
  it("Tenant A manifest carries the correct identity and branding", async () => {
    const manifest = await manifestFor(TENANT_A);

    expect(manifest).not.toBeNull();
    expect(manifest?.name).toBe("The Mechanist");
    expect(manifest?.short_name).toBe("The Mechanis");
    expect(manifest?.id).toBe("/?tenant=the-mechanist");
    expect(manifest?.start_url).toBe("/");
    expect(manifest?.scope).toBe("/");
    expect(manifest?.display).toBe("standalone");
    expect(manifest?.lang).toBe("ar");
    expect(manifest?.dir).toBe("rtl");
    expect(manifest?.theme_color).toBe("#b91c1c");
    expect(manifest?.background_color).toBe("#b91c1c");
    expect(manifest?.icons[0]?.src).toBe("https://cdn.the-mechanist.com/icon.ico");
  });

  it("Tenant B manifest carries a distinct identity and branding", async () => {
    const manifest = await manifestFor(TENANT_B);

    expect(manifest).not.toBeNull();
    expect(manifest?.name).toBe("Client B Academy");
    expect(manifest?.id).toBe("/?tenant=client-b");
    expect(manifest?.theme_color).toBe("#2563eb");
    expect(manifest?.icons[0]?.src).toBe("https://cdn.client-b.com/favicon.ico");

    expect(manifest?.id).not.toBe("/?tenant=the-mechanist");
    expect(manifest?.name).not.toBe("The Mechanist");
  });

  it("Tenant A manifest never contains Tenant B identity, icon, or colors", async () => {
    const manifest = await manifestFor(TENANT_A);
    const serialized = JSON.stringify(manifest);

    expect(serialized).not.toContain("Client B");
    expect(serialized).not.toContain("client-b");
    expect(serialized).not.toContain("cdn.client-b.com");
    expect(serialized).not.toContain("#2563eb");
  });

  it("Tenant B manifest never contains Tenant A identity, icon, or colors", async () => {
    const manifest = await manifestFor(TENANT_B);
    const serialized = JSON.stringify(manifest);

    expect(serialized).not.toContain("The Mechanist");
    expect(serialized).not.toContain("the-mechanist");
    expect(serialized).not.toContain("cdn.the-mechanist.com");
    expect(serialized).not.toContain("#b91c1c");
  });

  it("prefers the favicon over a wide logo for the PWA icon", async () => {
    const t = tenant(3, "Favicon Tenant", "fav-tenant", "fav.example.com", {
      favicon: "https://cdn.fav.example.com/favicon.ico",
      logo: "https://cdn.fav.example.com/wide-logo.svg",
    });
    const manifest = await manifestFor(t);
    expect(manifest?.icons[0]?.src).toBe("https://cdn.fav.example.com/favicon.ico");
  });

  it("falls back to a branding logo when no favicon is available", async () => {
    const t = tenant(4, "Fallback Tenant", "fallback", "fallback.example.com", {
      logo: "https://cdn.fallback.example.com/logo.svg",
    });
    const manifest = await manifestFor(t);
    expect(manifest?.icons[0]?.src).toBe("https://cdn.fallback.example.com/logo.svg");
    expect(manifest?.theme_color).toBe("#ffffff");
  });

  it("shortens long names for short_name", async () => {
    const t = tenant(5, "A Very Long Tenant Name Indeed", "long", "long.example.com");
    const manifest = await manifestFor(t);
    expect(manifest?.short_name).toBe("A Very Long");
  });

  it("returns null for platform hosts (no tenant)", async () => {
    const manifest = await manifestFor(null);
    expect(manifest).toBeNull();
  });

  it("keeps start_url and scope on the tenant origin (root)", async () => {
    const manifest = await manifestFor(TENANT_A);
    expect(manifest?.start_url).toBe("/");
    expect(manifest?.scope).toBe("/");
  });
});

describe("buildManifestResponse cache policy", () => {
  it("explicitly sets Cache-Control: no-store", async () => {
    vi.resetModules();
    vi.doMock("@/lib/seo/tenant-context", () => ({
      getTenantSeoContext: vi.fn().mockResolvedValue(TENANT_A),
    }));
    const { buildManifestResponse, MANIFEST_CACHE_CONTROL } = await import(
      "@/lib/pwa/manifest"
    );
    const res = await buildManifestResponse();

    expect(res.headers["Cache-Control"]).toBe(MANIFEST_CACHE_CONTROL);
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("serves the tenant manifest body alongside no-store cache policy", async () => {
    vi.resetModules();
    vi.doMock("@/lib/seo/tenant-context", () => ({
      getTenantSeoContext: vi.fn().mockResolvedValue(TENANT_B),
    }));
    const { buildManifestResponse } = await import("@/lib/pwa/manifest");
    const res = await buildManifestResponse();

    expect(res.body.name).toBe("Client B Academy");
    expect(res.body.id).toBe("/?tenant=client-b");
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("falls back to platform identity (never a customer tenant) with no-store", async () => {
    vi.resetModules();
    vi.doMock("@/lib/seo/tenant-context", () => ({
      getTenantSeoContext: vi.fn().mockResolvedValue(null),
    }));
    const { buildManifestResponse } = await import("@/lib/pwa/manifest");
    const res = await buildManifestResponse();
    const serialized = JSON.stringify(res.body);

    expect(res.headers["Cache-Control"]).toBe("no-store");
    expect(serialized).not.toContain("The Mechanist");
    expect(serialized).not.toContain("Client B");
    expect(res.body.id).toBe("/?tenant=platform");
  });
});
