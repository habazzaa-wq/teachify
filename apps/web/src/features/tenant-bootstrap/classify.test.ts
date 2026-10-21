import { describe, expect, it } from "vitest";
import {
  classifyTenantResponse,
  TENANT_BOOTSTRAP_ERRORS,
  type TenantBootstrapResponse,
} from "@/features/tenant-bootstrap/classify";

const ACTIVE_TENANT = {
  id: 1,
  name: "The Mechanist",
  slug: "the-mechanist",
  domain: "the-mechanist.com",
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
};

function response(
  status: number,
  body: unknown,
  contentType: string,
): TenantBootstrapResponse {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? contentType : null,
    },
    json: async () => JSON.parse(text),
  };
}

describe("classifyTenantResponse", () => {
  it("resolves an active tenant from a JSON 200", async () => {
    const outcome = await classifyTenantResponse(
      response(200, ACTIVE_TENANT, "application/json"),
    );

    expect(outcome).toEqual({ kind: "tenant", tenant: ACTIVE_TENANT });
  });

  it("reports a JSON 404 as a missing tenant", async () => {
    const outcome = await classifyTenantResponse(
      response(404, { message: "Tenant not found for the given domain." }, "application/json"),
    );

    expect(outcome).toEqual({ kind: "not-found" });
  });

  it("reports an inactive tenant as missing", async () => {
    const outcome = await classifyTenantResponse(
      response(200, { ...ACTIVE_TENANT, status: "suspended" }, "application/json"),
    );

    expect(outcome).toEqual({ kind: "not-found" });
  });

  it("treats an HTML 404 as a misrouted proxy instead of a missing tenant", async () => {
    const outcome = await classifyTenantResponse(
      response(404, "<!DOCTYPE html><html><body>404</body></html>", "text/html; charset=utf-8"),
    );

    expect(outcome.kind).toBe("error");
    expect(outcome.kind === "error" && outcome.message).toBe(
      TENANT_BOOTSTRAP_ERRORS.misrouted,
    );
  });

  it("treats an HTML 200 as a misrouted proxy", async () => {
    const outcome = await classifyTenantResponse(
      response(200, "<!DOCTYPE html><html></html>", "text/html; charset=utf-8"),
    );

    expect(outcome.kind).toBe("error");
  });

  it("keeps 5xx responses retryable", async () => {
    const outcome = await classifyTenantResponse(
      response(502, { message: "Bad Gateway" }, "application/json"),
    );

    expect(outcome.kind).toBe("error");
    expect(outcome.kind === "error" && outcome.message).toContain("502");
  });

  it("keeps other client errors retryable", async () => {
    const outcome = await classifyTenantResponse(
      response(403, { message: "Forbidden" }, "application/json"),
    );

    expect(outcome.kind).toBe("error");
    expect(outcome.kind === "error" && outcome.message).toContain("403");
  });

  it("rejects a JSON payload that is not a tenant", async () => {
    const outcome = await classifyTenantResponse(
      response(200, { message: "ok" }, "application/json"),
    );

    expect(outcome.kind).toBe("error");
    expect(outcome.kind === "error" && outcome.message).toBe(
      TENANT_BOOTSTRAP_ERRORS.invalidPayload,
    );
  });
});
