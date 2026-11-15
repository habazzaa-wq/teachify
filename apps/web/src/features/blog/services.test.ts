import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("@/config/env", () => ({
  resolveApiUrl: () => "https://api.example.test",
}));

vi.mock("@/services/api/axios", () => ({
  default: { post },
}));

import { blogService } from "./services";

describe("blogService.uploadImage", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("resolves server storage paths against the API origin", async () => {
    post.mockResolvedValue({
      data: { data: { url: "/storage/blog/3/01JABC.png" } },
    });

    await expect(blogService.uploadImage(new File(["image"], "article.png")))
      .resolves.toBe("https://api.example.test/storage/blog/3/01JABC.png");
  });
});
