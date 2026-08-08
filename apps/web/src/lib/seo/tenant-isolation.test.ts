import { describe, expect, it, vi } from "vitest";
import type { TenantByDomainResponse } from "@/features/tenant-bootstrap/types";

function tenant(id: number, name: string, domain: string, googleToken: string): TenantByDomainResponse {
  return {
    id,
    name,
    slug: `t${id}`,
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
    },
    seo: {
      googleVerification: googleToken,
      bingVerification: `BING_${id}`,
      description: `وصف ${name}`,
    },
  };
}

const TENANT_A = tenant(1, "أكاديمية ألف", "a.academy.test", "GOOGLE_A");
const TENANT_B = tenant(2, "أكاديمية باء", "b.academy.test", "GOOGLE_B");

async function metadataFor(t: TenantByDomainResponse | null, origin: string) {
  vi.resetModules();
  const { buildSeoMetadata } = await import("@/lib/seo/metadata");
  return buildSeoMetadata(
    { title: "كورس", description: "وصف الكورس", canonical: `${origin}/courses/x` },
    t,
    origin,
  );
}

/**
 * The core tenant-isolation guarantee: metadata for Tenant A can never contain
 * Tenant B's site name, origin, or verification tokens, and vice-versa.
 */
describe("tenant isolation (metadata)", () => {
  it("Tenant A metadata carries only Tenant A identity", async () => {
    const mdA = await metadataFor(TENANT_A, "https://a.academy.test");

    const ogA = JSON.stringify(mdA.openGraph);
    expect(ogA).toContain("أكاديمية ألف");
    expect(ogA).not.toContain("أكاديمية باء");
    expect(ogA).not.toContain("b.academy.test");

    expect(mdA.alternates?.canonical).toBe("https://a.academy.test/courses/x");
    expect(mdA.verification?.google).toBe("GOOGLE_A");
    expect(mdA.verification?.google).not.toBe("GOOGLE_B");
    expect(mdA.description).toBe("وصف الكورس");
  });

  it("Tenant B metadata carries only Tenant B identity", async () => {
    const mdB = await metadataFor(TENANT_B, "https://b.academy.test");

    const ogB = JSON.stringify(mdB.openGraph);
    expect(ogB).toContain("أكاديمية باء");
    expect(ogB).not.toContain("أكاديمية ألف");
    expect(ogB).not.toContain("a.academy.test");

    expect(mdB.alternates?.canonical).toBe("https://b.academy.test/courses/x");
    expect(mdB.verification?.google).toBe("GOOGLE_B");
    expect(mdB.verification?.google).not.toBe("GOOGLE_A");
  });

  it("canonical never points cross-tenant even when given the wrong origin", async () => {
    // Guards against a bug where canonical is built from a hardcoded origin.
    const mdA = await metadataFor(TENANT_A, "https://a.academy.test");
    expect(mdA.alternates?.canonical).toContain("a.academy.test");
    expect(mdA.alternates?.canonical).not.toContain("b.academy.test");
  });

  it("no tenant context degrades to platform identity (never another tenant)", async () => {
    const md = await metadataFor(null, "https://platform.test");
    const og = JSON.stringify(md.openGraph);
    expect(og).not.toContain("أكاديمية ألف");
    expect(og).not.toContain("أكاديمية باء");
    expect(md.alternates?.canonical).toBe("https://platform.test/courses/x");
  });
});
