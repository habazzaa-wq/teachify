import { describe, expect, it } from "vitest";
import { isLocalMediaProxyUrl, toAbsoluteAssetUrl } from "./url";

describe("toAbsoluteAssetUrl", () => {
  it("routes legacy local storage URLs through the media proxy", () => {
    expect(
      toAbsoluteAssetUrl(
        "https://teachify.tech/storage/tenants/28/assets/logo-jxcdi6qxoyv7.png",
      ),
    ).toBe("/api/v1/media/serve/tenants/28/assets/logo-jxcdi6qxoyv7.png");

    expect(
      toAbsoluteAssetUrl(
        "https://www.geo-top.teachify.tech/storage/tenants/28/assets/logo.png?v=2",
      ),
    ).toBe("/api/v1/media/serve/tenants/28/assets/logo.png?v=2");
  });

  it("handles root-relative, protocol-relative and bare-host storage URLs", () => {
    expect(toAbsoluteAssetUrl("/storage/avatars/a.png")).toBe(
      "/api/v1/media/serve/avatars/a.png",
    );
    expect(toAbsoluteAssetUrl("//teachify.tech/storage/avatars/a.png")).toBe(
      "/api/v1/media/serve/avatars/a.png",
    );
    expect(toAbsoluteAssetUrl("teachify.tech/storage/avatars/a.png")).toBe(
      "/api/v1/media/serve/avatars/a.png",
    );
  });

  it("leaves real CDN URLs and existing proxy URLs untouched", () => {
    expect(toAbsoluteAssetUrl("https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
    expect(toAbsoluteAssetUrl("/api/v1/media/serve/tenants/1/a.png")).toBe(
      "/api/v1/media/serve/tenants/1/a.png",
    );
    expect(toAbsoluteAssetUrl("cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  it("returns null for empty values", () => {
    expect(toAbsoluteAssetUrl(null)).toBeNull();
    expect(toAbsoluteAssetUrl("   ")).toBeNull();
  });
});

describe("isLocalMediaProxyUrl", () => {
  it("matches same-origin media proxy paths", () => {
    expect(
      isLocalMediaProxyUrl("/api/v1/media/serve/tenants/28/assets/a.webp"),
    ).toBe(true);
    expect(isLocalMediaProxyUrl(" /api/v1/media/serve/a.png ")).toBe(true);
  });

  it("does not match absolute URLs or unrelated local paths", () => {
    expect(
      isLocalMediaProxyUrl(
        "https://geo-top.teachify.tech/api/v1/media/serve/a.png",
      ),
    ).toBe(false);
    expect(isLocalMediaProxyUrl("/storage/a.png")).toBe(false);
    expect(isLocalMediaProxyUrl(null)).toBe(false);
  });
});
