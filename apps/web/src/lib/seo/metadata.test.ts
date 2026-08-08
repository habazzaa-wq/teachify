import { describe, expect, it, vi } from "vitest";
import type { TenantByDomainResponse } from "@/features/tenant-bootstrap/types";

function tenant(id: number, name: string, seo?: TenantByDomainResponse["seo"]): TenantByDomainResponse {
  return {
    id,
    name,
    slug: `tenant-${id}`,
    domain: `${id}.academy.test`,
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
    ...(seo ? { seo } : {}),
  };
}

async function buildWithEnv(
  envVars: Record<string, string | undefined>,
  t: TenantByDomainResponse | null,
  origin: string,
) {
  vi.resetModules();
  for (const [key, value] of Object.entries(envVars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const { buildSeoMetadata } = await import("@/lib/seo/metadata");
  return buildSeoMetadata({ title: "صفحة تجريبية", canonical: `${origin}/page` }, t, origin);
}

describe("buildSeoMetadata — verification", () => {
  it("emits google-site-verification from tenant SEO config", async () => {
    const md = await buildWithEnv(
      {},
      tenant(1, "أكاديمية أ", { googleVerification: "TOKEN_A" }),
      "https://a.academy.test",
    );
    expect(md.verification?.google).toBe("TOKEN_A");
    expect(md.verification?.other?.["msvalidate.01"]).toBeUndefined();
  });

  it("emits msvalidate.01 from tenant Bing token", async () => {
    const md = await buildWithEnv(
      {},
      tenant(1, "أكاديمية أ", { bingVerification: "BING_A" }),
      "https://a.academy.test",
    );
    expect(md.verification?.other?.["msvalidate.01"]).toBe("BING_A");
  });

  it("falls back to platform env tokens when tenant has none", async () => {
    const md = await buildWithEnv(
      {
        NEXT_PUBLIC_GSC_VERIFICATION: "ENV_GOOGLE",
        NEXT_PUBLIC_BING_VERIFICATION: "ENV_BING",
      },
      tenant(1, "أكاديمية أ"),
      "https://a.academy.test",
    );
    expect(md.verification?.google).toBe("ENV_GOOGLE");
    expect(md.verification?.other?.["msvalidate.01"]).toBe("ENV_BING");
  });

  it("tenant token wins over env default", async () => {
    const md = await buildWithEnv(
      { NEXT_PUBLIC_GSC_VERIFICATION: "ENV_GOOGLE" },
      tenant(1, "أكاديمية أ", { googleVerification: "TENANT_GOOGLE" }),
      "https://a.academy.test",
    );
    expect(md.verification?.google).toBe("TENANT_GOOGLE");
  });

  it("omits verification entirely when no tokens exist", async () => {
    const md = await buildWithEnv(
      { NEXT_PUBLIC_GSC_VERIFICATION: undefined, NEXT_PUBLIC_BING_VERIFICATION: undefined },
      tenant(1, "أكاديمية أ"),
      "https://a.academy.test",
    );
    expect(md.verification).toBeUndefined();
  });
});

describe("getSiteDescription / getSiteTitleTemplate (layout-level tenant SEO)", () => {
  it("uses tenant SEO description when provided", async () => {
    vi.resetModules();
    const { getSiteDescription } = await import("@/lib/seo/metadata");
    expect(
      getSiteDescription(tenant(1, "أكاديمية أ", { description: "وصف خاص بالأكاديمية أ" })),
    ).toBe("وصف خاص بالأكاديمية أ");
  });

  it("falls back to platform default description when tenant has none", async () => {
    vi.resetModules();
    const { getSiteDescription, SITE_DEFAULT_DESCRIPTION } = await import("@/lib/seo/metadata");
    expect(getSiteDescription(tenant(1, "أكاديمية أ"))).toBe(SITE_DEFAULT_DESCRIPTION);
  });

  it("applies tenant title template", async () => {
    vi.resetModules();
    const { getSiteTitleTemplate } = await import("@/lib/seo/metadata");
    expect(
      getSiteTitleTemplate(tenant(1, "أكاديمية أ", { titleTemplate: "%s | أكاديمية أ" })),
    ).toBe("%s | أكاديمية أ");
    expect(getSiteTitleTemplate(tenant(1, "أكاديمية أ"))).toBeNull();
  });

  it("picks tenant verification over env (getVerificationTokens)", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_GSC_VERIFICATION = "ENV_GOOGLE";
    const { getVerificationTokens } = await import("@/lib/seo/metadata");
    const tokens = getVerificationTokens(
      tenant(1, "أكاديمية أ", { googleVerification: "TENANT_GOOGLE" }),
    );
    expect(tokens.google).toBe("TENANT_GOOGLE");
  });
});

describe("buildSeoMetadata — base signals", () => {
  it("adds absolute canonical and index robots for public pages", async () => {
    const md = await buildWithEnv({}, null, "https://platform.test");
    const robots = md.robots as { index: boolean; follow: boolean };
    expect(md.alternates?.canonical).toBe("https://platform.test/page");
    expect(robots.index).toBe(true);
  });

  it("noindex drops canonical and sets nofollow", async () => {
    const md = await buildWithEnv({}, null, "https://platform.test");
    const privateMd = await (async () => {
      vi.resetModules();
      const { buildSeoMetadata } = await import("@/lib/seo/metadata");
      return buildSeoMetadata(
        { title: "خاص", canonical: "https://platform.test/wallet", noindex: true },
        null,
        "https://platform.test",
      );
    })();
    const robots = privateMd.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
    expect(privateMd.alternates).toBeUndefined();
    expect(md.alternates?.canonical).toBe("https://platform.test/page");
  });

  it("always uses ar_SA locale and siteName for OG", async () => {
    const md = await buildWithEnv(
      {},
      tenant(2, "أكاديمية ب"),
      "https://b.academy.test",
    );
    expect(md.openGraph?.locale).toBe("ar_SA");
    expect(md.openGraph?.siteName).toBe("أكاديمية ب");
  });
});
