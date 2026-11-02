import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { instructorApi } from "./api";

vi.mock("axios", () => ({
  default: {
    request: vi.fn(),
  },
}));

vi.mock("@/config/env", () => ({
  resolveApiBaseUrl: () => "https://tenant.example/api/v1",
}));

vi.mock("@/stores/tenant.store", () => ({
  useTenantStore: {
    getState: () => ({ activeTenant: { id: 12 }, domain: null }),
  },
}));

describe("instructor API URLs", () => {
  beforeEach(() => {
    vi.mocked(axios.request).mockReset();
    vi.mocked(axios.request).mockResolvedValue({
      data: { access_token: "access" },
    } as never);
  });

  it("appends the login endpoint to the versioned API base exactly once", async () => {
    await instructorApi.login("coach@example.com", "password");

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "https://tenant.example/api/v1",
        url: "/instructor/auth/login",
        method: "POST",
        data: { email: "coach@example.com", password: "password" },
      }),
    );
  });
});
