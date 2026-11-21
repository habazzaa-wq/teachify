import { toast } from "sonner";
import type { MediaLibrary } from "../../types";
import { useUploadManagerStore } from "../store";
import type { UploadSource } from "../types";
import { filterFilesForLibrary } from "../utils/files";

/**
 * Single entry point for files picked outside the upload drawer (hidden input,
 * drag & drop, paste, keyboard shortcut). It enforces the active library before
 * the rename dialog so a misplaced file is rejected early with a clear message.
 */
export function stageFilesForLibrary(
  files: File[],
  opts: { folderId?: number | null; source?: UploadSource; library?: MediaLibrary } = {},
): void {
  if (files.length === 0) return;

  const library = opts.library ?? useUploadManagerStore.getState().activeLibrary;
  const accepted = filterFilesForLibrary(files, library);
  const rejected = files.length - accepted.length;

  if (rejected > 0) {
    toast.warning(`تم تجاهل ${rejected} من ${files.length} ملف`, {
      description:
        library === "videos"
          ? "مكتبة الفيديوهات تقبل الفيديوهات فقط."
          : "الفيديوهات تُرفع من مكتبة الفيديوهات، وليس مكتبة الوسائط.",
    });
  }

  if (accepted.length === 0) return;

  useUploadManagerStore.getState().openRename(accepted, { ...opts, library });
}
