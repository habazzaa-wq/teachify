export interface PendingBlogImage {
  file: File;
  uploadedUrl?: string;
}

export async function uploadPendingImagesInContent(
  content: string,
  pendingImages: Map<string, PendingBlogImage>,
  uploadImage: (file: File) => Promise<string>,
): Promise<string> {
  let savedContent = content;

  for (const [localUrl, image] of pendingImages) {
    if (!savedContent.includes(localUrl)) continue;

    image.uploadedUrl ??= await uploadImage(image.file);
    savedContent = savedContent.replaceAll(localUrl, image.uploadedUrl);
  }

  return savedContent;
}
