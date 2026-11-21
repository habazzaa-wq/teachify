import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getApiRequestContext } = vi.hoisted(() => ({
  getApiRequestContext: vi.fn(),
}));

vi.mock("@/config/env", () => ({
  resolveApiUrl: () => "https://api.example.test",
  resolveApiBaseUrl: () => "https://api.example.test/api/v1",
}));

vi.mock("@/services/api/axios", () => ({
  api: {},
}));

vi.mock("@/services/api/request-context", () => ({
  getApiRequestContext,
}));

import { tenantServicesApi } from "./api";

describe("tenantServicesApi.uploadImage", () => {
  beforeEach(() => {
    getApiRequestContext.mockReturnValue({
      accessToken: "token",
      tenantId: "7",
      tenantDomain: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("sends multipart form data with tenant context and resolves storage paths", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { url: "/storage/services/7/01JABC.png" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["image"], "service.png", { type: "image/png" });
    await expect(tenantServicesApi.uploadImage(file)).resolves.toBe(
      "https://api.example.test/storage/services/7/01JABC.png",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.example.test/api/v1/services/upload-image");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBe(file);
    expect(init.headers).toMatchObject({
      Accept: "application/json",
      Authorization: "Bearer token",
      "X-Tenant-ID": "7",
    });
    expect(init.headers).not.toHaveProperty("Content-Type");
  });

  it("surfaces Laravel validation messages from failed uploads", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: "The file field is invalid.",
        errors: { file: ["حجم الصورة كبير جداً."] },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      tenantServicesApi.uploadImage(
        new File(["image"], "huge.png", { type: "image/png" }),
      ),
    ).rejects.toThrow("حجم الصورة كبير جداً.");
  });
});
