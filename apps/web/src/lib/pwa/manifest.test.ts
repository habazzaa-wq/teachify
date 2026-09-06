import { describe, expect, it } from "vitest";
import type { TenantByDomainResponse } from "@/features/tenant-bootstrap/types";
import {
  MANIFEST_CACHE_CONTROL,
  MANIFEST_DIR,
  MANIFEST_DISPLAY,
  MANIFEST_LANG,
  MANIFEST_SCOPE,
  MANIFEST_START_URL,
  buildManifest,
  getManifestId,
  getManifestShortName,
  manifestResponseHeaders,
  pickTenantIconUrl,
} from "./manifest";

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
      logoImage: null,
      darkLogo: null,
      lightLogo: null,
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
      font: null,
      ...branding,
    },
  };
}

const TENANT_A = tenant(1, "The Mechanist", "mechanist", "the-mechanist.com", {
  favicon: "/uploads/mechanist-favicon.ico",
  logo: "/uploads/mechanist-logo.png",
  primaryColor: "#123456",
});

const TENANT_B = tenant(2, "Client B", "client-b", "client-b.com", {
  favicon: "/uploads/client-b-favicon.ico",
  logo: "/uploads/client-b-logo.png",
  primaryColor: "#ABCDEF",
});

function manifestFor(t: TenantByDomainResponse | null, origin: string) {
  return buildManifest({ tenant: t, origin });
}

describe("buildManifest — Tenant A (the-mechanist.com)", () => {
  const m = manifestFor(TENANT_A, "https://the-mechanist.com");

  it("uses the tenant name", () => {
    expect(m.name).toBe("The Mechanist");
  });

  it("uses a tenant-unique slug-based id", () => {
    expect(m.id).toBe("/?tenant=mechanist");
    expect(getManifestId(TENANT_A)).toBe("/?tenant=mechanist");
  });

  it("uses tenant branding (theme color)", () => {
    expect(m.theme_color).toBe("#123456");
    expect(m.background_color).toBe("#123456");
  });

  it("uses the tenant favicon icon, resolved against the origin", () => {
    expect(m.icons).toEqual([
      { src: "https://the-mechanist.com/uploads/mechanist-favicon.ico", sizes: "any" },
    ]);
  });

  it("keeps start_url, scope, display, lang and dir on the tenant origin", () => {
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.lang).toBe("ar");
    expect(m.dir).toBe("rtl");
  });
});

describe("buildManifest — Tenant B (client-b.com)", () => {
  const m = manifestFor(TENANT_B, "https://client-b.com");

  it("uses the tenant name with a distinct identity", () => {
    expect(m.name).toBe("Client B");
    expect(m.id).toBe("/?tenant=client-b");
    expect(m.id).not.toBe("/?tenant=mechanist");
  });

  it("uses Tenant B branding and icon", () => {
    expect(m.theme_color).toBe("#ABCDEF");
    expect(m.icons).toEqual([
      { src: "https://client-b.com/uploads/client-b-favicon.ico", sizes: "any" },
    ]);
  });
});

describe("tenant isolation (manifest)", () => {
  it("Tenant A manifest carries no Tenant B identity", () => {
    const m = manifestFor(TENANT_A, "https://the-mechanist.com");
    const json = JSON.stringify(m);
    expect(json).toContain("The Mechanist");
    expect(json).toContain("mechanist");
    expect(json).toContain("#123456");
    expect(json).toContain("mechanist-favicon.ico");
    expect(json).not.toContain("Client B");
    expect(json).not.toContain("client-b");
    expect(json).not.toContain("#ABCDEF");
    expect(json).not.toContain("client-b-favicon.ico");
  });

  it("Tenant B manifest carries no Tenant A identity", () => {
    const m = manifestFor(TENANT_B, "https://client-b.com");
    const json = JSON.stringify(m);
    expect(json).toContain("Client B");
    expect(json).toContain("client-b");
    expect(json).toContain("#ABCDEF");
    expect(json).toContain("client-b-favicon.ico");
    expect(json).not.toContain("The Mechanist");
    expect(json).not.toContain("mechanist");
    expect(json).not.toContain("#123456");
    expect(json).not.toContain("mechanist-favicon.ico");
  });

  it("no tenant context degrades to platform identity (never another tenant)", () => {
    const m = manifestFor(null, "https://academy.test");
    const json = JSON.stringify(m);
    expect(json).not.toContain("The Mechanist");
    expect(json).not.toContain("Client B");
    expect(json).not.toContain("mechanist");
    expect(json).not.toContain("client-b");
  });
});

describe("custom-domain resolution", () => {
  it("resolves the correct tenant for a real custom domain, driven only by the tenant context", () => {
    // The manifest is derived purely from the resolved tenant — never from URL
    // paths or global branding. Different custom domains => different manifests.
    const a = manifestFor(TENANT_A, "https://the-mechanist.com");
    const b = manifestFor(TENANT_B, "https://client-b.com");
    expect(a.name).toBe("The Mechanist");
    expect(b.name).toBe("Client B");
    expect(a.id).not.toBe(b.id);
    expect(a.icons).not.toEqual(b.icons);
  });

  it("start_url and scope never point at a central platform domain", () => {
    for (const origin of ["https://the-mechanist.com", "https://client-b.com"]) {
      const m = manifestFor(origin === "https://the-mechanist.com" ? TENANT_A : TENANT_B, origin);
      expect(m.start_url).toBe("/");
      expect(m.scope).toBe("/");
    }
  });
});

describe("icon fallback", () => {
  it("prefers favicon over the wide logo", () => {
    expect(pickTenantIconUrl(TENANT_A)).toBe("/uploads/mechanist-favicon.ico");
  });

  it("falls back to logoImage then logo when no favicon exists", () => {
    const t = tenant(3, "No Favicon", "no-fav", "nofav.test", {
      favicon: null,
      logoImage: "/uploads/image.png",
      logo: "/uploads/logo.png",
    });
    expect(pickTenantIconUrl(t)).toBe("/uploads/image.png");

    const t2 = tenant(4, "Logo Only", "logo-only", "logo.test", {
      logo: "/uploads/logo.png",
    });
    expect(pickTenantIconUrl(t2)).toBe("/uploads/logo.png");
  });

  it("returns null when no icon is configured (safe fallback)", () => {
    expect(pickTenantIconUrl(tenant(5, "Empty", "empty", "empty.test"))).toBeNull();
  });

  it("advertises the bundled default icon for icon-less tenants so the app stays installable", () => {
    const m = manifestFor(tenant(5, "Empty", "empty", "empty.test"), "https://empty.test");
    expect(m.icons).toEqual([
      { src: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ]);
  });

  it("keeps the tenant's own icon when one is configured (never a default fallback)", () => {
    const m = manifestFor(TENANT_A, "https://the-mechanist.com");
    expect(m.icons).toEqual([
      { src: "https://the-mechanist.com/uploads/mechanist-favicon.ico", sizes: "any" },
    ]);
  });
});

describe("short_name", () => {
  it("keeps short names as-is", () => {
    expect(getManifestShortName("Client B")).toBe("Client B");
  });

  it("truncates long names to a bounded length", () => {
    const long = "أكاديمية العلوم والتقنية المتقدمة";
    expect(getManifestShortName(long).length).toBeLessThanOrEqual(12);
  });
});

describe("cache policy", () => {
  it("explicitly sets Cache-Control: no-store on the manifest response", () => {
    const headers = manifestResponseHeaders();
    expect(headers["cache-control"]).toBe("no-store");
    expect(headers["cache-control"]).toBe(MANIFEST_CACHE_CONTROL);
  });

  it("serves the correct manifest content type", () => {
    const headers = manifestResponseHeaders();
    expect(headers["content-type"]).toBe("application/manifest+json");
  });
});

describe("global invariants", () => {
  it("start_url, scope, display, lang and dir are constant across tenants", () => {
    const a = manifestFor(TENANT_A, "https://the-mechanist.com");
    const b = manifestFor(TENANT_B, "https://client-b.com");
    expect(a.start_url).toBe(MANIFEST_START_URL);
    expect(b.start_url).toBe(MANIFEST_START_URL);
    expect(a.scope).toBe(MANIFEST_SCOPE);
    expect(b.scope).toBe(MANIFEST_SCOPE);
    expect(a.display).toBe(MANIFEST_DISPLAY);
    expect(b.display).toBe(MANIFEST_DISPLAY);
    expect(a.lang).toBe(MANIFEST_LANG);
    expect(b.lang).toBe(MANIFEST_LANG);
    expect(a.dir).toBe(MANIFEST_DIR);
    expect(b.dir).toBe(MANIFEST_DIR);
  });

  it("serializes to valid JSON", () => {
    expect(() => JSON.parse(JSON.stringify(manifestFor(TENANT_A, "https://the-mechanist.com")))).not.toThrow();
  });
});
