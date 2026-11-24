import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDomainFromHost,
  getTenantDomainFromHeaders,
  getTenantSubdomain,
  isPlatformDomain,
  isTenantDomain,
  normalizeTenantHost,
} from "@/lib/domain";

describe("tenant host normalization", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_BASE_DOMAIN", "academy.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats www.tenant as the canonical tenant domain", () => {
    expect(normalizeTenantHost("www.geo-top.academy.test")).toBe(
      "geo-top.academy.test",
    );
    expect(getDomainFromHost("WWW.GEO-TOP.ACADEMY.TEST:3000")).toBe(
      "geo-top.academy.test",
    );
    expect(getTenantSubdomain("www.geo-top.academy.test")).toBe("geo-top");
    expect(isTenantDomain("www.geo-top.academy.test")).toBe(true);
  });

  it("keeps www on the platform root as a platform host", () => {
    expect(isPlatformDomain("www.academy.test")).toBe(true);
    expect(getTenantSubdomain("www.academy.test")).toBeNull();
  });

  it("normalizes the host header used for public tenant lookup", () => {
    const headers = new Headers({ host: "www.geo-top.academy.test:3000" });
    expect(getTenantDomainFromHeaders(headers)).toBe("geo-top.academy.test");
  });
});
