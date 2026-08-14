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

describe("homepage title/description + organization helpers", () => {
  it("uses saved homepage title and description", async () => {
    vi.resetModules();
    const { getHomepageTitle, getHomepageDescription } = await import("@/lib/seo/metadata");
    const t = tenant(1, "أكاديمية أ", {
      homepageTitle: "أكاديمية أ — التعليم الأفضل",
      homepageDescription: "وصف الصفحة الرئيسية",
    });
    expect(getHomepageTitle(t)).toBe("أكاديمية أ — التعليم الأفضل");
    expect(getHomepageDescription(t)).toBe("وصف الصفحة الرئيسية");
  });

  it("falls back when homepage title/description are not saved", async () => {
    vi.resetModules();
    const { getHomepageTitle, getHomepageDescription, SITE_DEFAULT_DESCRIPTION } = await import(
      "@/lib/seo/metadata"
    );
    const t = tenant(1, "أكاديمية أ");
    expect(getHomepageTitle(t)).toBeNull();
    expect(getHomepageDescription(t)).toBe(SITE_DEFAULT_DESCRIPTION);
  });

  it("prefers saved organization name/description, falls back to tenant/site", async () => {
    vi.resetModules();
    const { getOrganizationName, getOrganizationDescription } = await import("@/lib/seo/metadata");
    const t = tenant(1, "أكاديمية أ", {
      organizationName: "مؤسسة التعلم أ",
      organizationDescription: "منظمة تعليمية",
    });
    expect(getOrganizationName(t)).toBe("مؤسسة التعلم أ");
    expect(getOrganizationDescription(t)).toBe("منظمة تعليمية");
    expect(getOrganizationName(tenant(1, "أكاديمية أ"))).toBe("أكاديمية أ");
    expect(getOrganizationDescription(tenant(1, "أكاديمية أ"))).toBeNull();
  });

  it("filters empty social profile entries", async () => {
    vi.resetModules();
    const { getSocialProfiles } = await import("@/lib/seo/metadata");
    const t = tenant(1, "أكاديمية أ", {
      socialProfiles: ["https://facebook.com/a", "  ", "", "https://x.com/a"],
    });
    expect(getSocialProfiles(t)).toEqual(["https://facebook.com/a", "https://x.com/a"]);
    expect(getSocialProfiles(tenant(1, "أكاديمية أ"))).toEqual([]);
  });
});

describe("robots policy mapping", () => {
  it("maps every saved policy value to robots metadata", async () => {
    vi.resetModules();
    const { robotsRulesForPolicy } = await import("@/lib/seo/metadata");
    expect(robotsRulesForPolicy("index_follow")).toEqual({ index: true, follow: true });
    expect(robotsRulesForPolicy("index")).toEqual({ index: true, follow: false });
    expect(robotsRulesForPolicy("noindex")).toEqual({ index: false, follow: false });
    expect(robotsRulesForPolicy("noindex_nofollow")).toEqual({ index: false, follow: false });
    expect(robotsRulesForPolicy(null)).toEqual({ index: true, follow: true });
    expect(robotsRulesForPolicy(undefined)).toEqual({ index: true, follow: true });
  });

  it("buildSeoMetadata applies the tenant robots policy", async () => {
    const md = await buildWithEnv(
      {},
      tenant(1, "أكاديمية أ", { robotsPolicy: "noindex" }),
      "https://a.academy.test",
    );
    const robots = md.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it("uses the tenant SEO OG image before the branding logo", async () => {
    const md = await buildWithEnv(
      {},
      tenant(1, "أكاديمية أ", { ogImage: "https://cdn.academy.test/og.png" }),
      "https://a.academy.test",
    );
    const images = md.openGraph?.images as Array<{ url: string }>;
    expect(images?.[0]?.url).toBe("https://cdn.academy.test/og.png");
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
