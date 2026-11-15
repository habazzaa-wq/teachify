import { describe, expect, it, vi } from "vitest";
import { uploadPendingImagesInContent, type PendingBlogImage } from "./pending-images";

describe("uploadPendingImagesInContent", () => {
  it("uploads only local images still referenced by article content", async () => {
    const uploadImage = vi.fn(async () => "https://api.example.test/storage/article.png");
    const file = new File(["image"], "article.png", { type: "image/png" });
    const pending = new Map<string, PendingBlogImage>([
      ["blob:used-image", { file }],
      ["blob:deleted-image", { file: new File(["deleted"], "deleted.png") }],
    ]);

    await expect(uploadPendingImagesInContent(
      '<p><img src="blob:used-image"><img src="blob:used-image"></p>',
      pending,
      uploadImage,
    )).resolves.toBe(
      '<p><img src="https://api.example.test/storage/article.png"><img src="https://api.example.test/storage/article.png"></p>',
    );

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledWith(file);
  });

  it("reuses successfully uploaded images when a later upload must be retried", async () => {
    const firstFile = new File(["first"], "first.png");
    const secondFile = new File(["second"], "second.png");
    const pending = new Map<string, PendingBlogImage>([
      ["blob:first", { file: firstFile }],
      ["blob:second", { file: secondFile }],
    ]);
    const uploadImage = vi.fn()
      .mockResolvedValueOnce("https://api.example.test/storage/first.png")
      .mockRejectedValueOnce(new Error("upload failed"))
      .mockResolvedValueOnce("https://api.example.test/storage/second.png");

    await expect(uploadPendingImagesInContent(
      '<img src="blob:first"><img src="blob:second">',
      pending,
      uploadImage,
    )).rejects.toThrow("upload failed");

    await expect(uploadPendingImagesInContent(
      '<img src="blob:first"><img src="blob:second">',
      pending,
      uploadImage,
    )).resolves.toBe(
      '<img src="https://api.example.test/storage/first.png"><img src="https://api.example.test/storage/second.png">',
    );

    expect(uploadImage).toHaveBeenCalledTimes(3);
  });
});
