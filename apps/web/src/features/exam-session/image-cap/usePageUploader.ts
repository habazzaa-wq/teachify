"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeApiError } from "@/services/api/errors";
import { EXAM_SESSION_QUERY_KEY } from "../constants";
import { examSessionService } from "../services";
import type {
  ClassifiedUploadError,
  CropRect,
  ImagePageDraft,
  ImageRotation,
  PageUploadFinishResult,
  PageUploadResult,
} from "./types";
import type { ExamAnswerPage } from "../types";
import {
  ACCEPTED_IMAGE_TYPES,
  isAcceptedImage,
  MAX_UPLOAD_BYTES,
  outputFileNameFor,
  outputMimeFor,
  renderProcessedImage,
} from "./imageProcessing";

export interface UsePageUploaderOptions {
  attemptId: string;
  examQuestionId: string;
  /** Attempt left in_progress (timer expired / submitted / grading). */
  disabled?: boolean;
  /** Already-uploaded pages (Phase C read endpoint) — dedupe source. */
  existingPages?: ExamAnswerPage[] | null;
  onBusyChange?: (busy: boolean) => void;
  onAnsweredChange?: (answered: boolean) => void;
}

function classifyUploadError(error: unknown): ClassifiedUploadError {
  const apiError = normalizeApiError(error);
  const fieldErrors = apiError.fieldErrors ?? {};
  const examMessage = fieldErrors.exam?.[0];
  const attemptMessage = fieldErrors.attempt?.[0];
  const pageMessage = fieldErrors.page?.[0];
  const sessionMessage = fieldErrors.session?.[0];
  const questionMessage = fieldErrors.exam_question?.[0];

  if (
    examMessage ||
    (attemptMessage ?? "").includes("in-progress") ||
    (attemptMessage ?? "").includes("expired")
  ) {
    return {
      kind: "expired",
      field: "exam",
      message:
        examMessage ??
        "انتهى وقت الامتحان أو أصبحت المحاولة غير قابلة للتعديل.",
    };
  }

  if (pageMessage) {
    return { kind: "retryable", field: "page", message: pageMessage };
  }

  if (sessionMessage || questionMessage) {
    return {
      kind: "fatal",
      message: sessionMessage ?? questionMessage ?? "تعذّرت عملية الرفع.",
    };
  }

  if (apiError.isNetworkError) {
    return {
      kind: "retryable",
      message: "تعذّر الاتصال بالشبكة. تحقق من اتصالك ثم أعد المحاولة.",
    };
  }

  if (apiError.status === 404 || apiError.status === 410) {
    return {
      kind: "fatal",
      message: "تعذّر العثور على جلسة الرفع. أعد اختيار الصورة ثم حاول مجددًا.",
    };
  }

  if (apiError.status === 429) {
    return {
      kind: "retryable",
      message: "طلبات كثيرة جدًا. انتظر قليلًا ثم أعد المحاولة.",
    };
  }

  if (apiError.status >= 500 || apiError.status === 0) {
    return { kind: "retryable", message: apiError.message };
  }

  return { kind: "retryable", message: apiError.message };
}

function directPut(
  url: string,
  headers: Record<string, string>,
  blob: Blob,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [key, value] of Object.entries(headers)) {
      if (value != null) xhr.setRequestHeader(key, value);
    }
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status}).`));
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Upload failed: network error.")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Upload cancelled.")),
    );
    xhr.send(blob);
  });
}

function nextId(): string {
  return `page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Per-question photo answer uploader. Mirrors the exam session's existing
 * patterns:
 *  - local component/feature state (like the workspace map in ExamSessionPage)
 *  - the intent → direct PUT → confirm flow of Phase B2, with the same raw-XHR
 *    PUT+progress approach the media-library UploadDrawer uses
 *  - React Query for the read-back of already-uploaded pages
 *  - retry-on-failure with backoff-free explicit retry buttons (no mid-file
 *    resume: the B2 flow exposes a single direct PUT, not chunked uploads)
 */
export function usePageUploader({
  attemptId,
  examQuestionId,
  disabled = false,
  existingPages,
  onBusyChange,
  onAnsweredChange,
}: UsePageUploaderOptions) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<ImagePageDraft[]>([]);
  const draftsRef = useRef<ImagePageDraft[]>([]);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  const uploadingRef = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Guards against a slower preview render for an older edit overwriting the
  // result of a newer edit on the same draft.
  const renderTokensRef = useRef<Record<string, number>>({});

  const existingIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    existingIdsRef.current = new Set((existingPages ?? []).map((page) => page.id));
  }, [existingPages]);

  const priorDisabled = useRef(disabled);
  useEffect(() => {
    if (!disabled || priorDisabled.current) return;
    // The attempt left in_progress (timer expired / submitted / grading) while
    // pages were still queued. Phantom confirms would 422 server-side; surface
    // the state instead of silently dropping the in-flight work.
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.status === "done"
          ? draft
          : {
              ...draft,
              status: "expired" as const,
              progress: 0,
              error: "انتهى وقت الامتحان. لم يتم رفع هذه الصفحة.",
            },
      ),
    );
    priorDisabled.current = disabled;
  }, [disabled]);

  const answered =
    (existingPages ?? []).length > 0 ||
    drafts.some((draft) => draft.status === "done");

  useEffect(() => {
    onAnsweredChange?.(answered);
  }, [answered, onAnsweredChange]);

  useEffect(() => {
    onBusyChange?.(busyRef.current);
  }, [busy, onBusyChange]);

  function setDraft(id: string, patch: Partial<ImagePageDraft>, base?: ImagePageDraft[]): void {
    setDrafts((prev) =>
      (base ?? prev).map((draft) =>
        draft.id === id ? { ...draft, ...patch } : draft,
      ),
    );
  }

  const addFiles = useCallback(
    (files: FileList | File[] | null) => {
      if (disabled || !files) return;
      const accepted = Array.from(files).filter((file) => {
        if (!isAcceptedImage(file)) return false;
        if (file.size > MAX_UPLOAD_BYTES) return false;
        return true;
      });
      if (accepted.length === 0) return;

      setDrafts((prev) => {
        const next = [...prev];
        for (const file of accepted) {
          const id = nextId();
          const draft: ImagePageDraft = {
            id,
            source: file,
            rawUrl: URL.createObjectURL(file),
            rotation: 0,
            crop: null,
            processed: null,
            status: "draft",
            progress: 0,
            error: null,
            capturedAt: new Date().toISOString(),
            serverPageId: null,
          };
          next.push(draft);
        }
        return next;
      });
    },
    [disabled],
  );

  /**
   * Seed a draft from an already-confirmed page (fetched blob + its server id)
   * so the student can crop/rotate an uploaded page and re-upload a REPLACEMENT.
   * Returns the new draft id (for the crop editor to open immediately) or null.
   */
  const addServerPageForEdit = useCallback(
    (file: File, serverPageId: string): string | null => {
      if (busyRef.current) return null;
      const id = nextId();
      const draft: ImagePageDraft = {
        id,
        source: file,
        rawUrl: URL.createObjectURL(file),
        rotation: 0,
        crop: null,
        processed: null,
        status: "draft",
        progress: 0,
        error: null,
        capturedAt: new Date().toISOString(),
        serverPageId,
      };
      setDrafts((prev) => [...prev, draft]);
      return id;
    },
    [],
  );

  const removeDraft = useCallback(
    (id: string) => {
      if (busyRef.current) return;
      setDrafts((prev) => {
        const target = prev.find((d) => d.id === id);
        if (target && target.status !== "draft" && target.status !== "error" && target.status !== "expired") {
          return prev;
        }
        if (target) {
          URL.revokeObjectURL(target.rawUrl);
          if (target.processed) URL.revokeObjectURL(target.processed.url);
        }
        return prev.filter((d) => d.id !== id);
      });
    },
    [],
  );

  /**
   * Drop the local draft copies of a page that was deleted on the server
   * (Phase D-FIX). A just-uploaded page exists twice: as the hidden `done`
   * draft AND as an entry in `existingPages`. When the student deletes that
   * page, the stale `done` draft would otherwise keep the `answered` signal
   * true after the answer reverted to unanswered.
   */
  const forgetServerPage = useCallback((serverPageId: string) => {
    setDrafts((prev) => {
      const dropped = prev.filter(
        (d) => d.serverPageId === serverPageId && d.status === "done",
      );
      for (const draft of dropped) {
        URL.revokeObjectURL(draft.rawUrl);
        if (draft.processed) URL.revokeObjectURL(draft.processed.url);
      }
      return prev.filter((d) => d.serverPageId !== serverPageId);
    });
  }, []);

  const refreshProcessed = useCallback((id: string) => {
    const draft = draftsRef.current.find((d) => d.id === id);
    if (!draft) return;
    if (draft.status === "done" || draft.status === "uploading") return;

    const token = (renderTokensRef.current[id] = (renderTokensRef.current[id] ?? 0) + 1);
    setDraft(id, { processed: null });
    void renderProcessedImage(draft.source, draft.rotation, draft.crop)
      .then((processed) => {
        const current = draftsRef.current.find((d) => d.id === id);
        if (
          renderTokensRef.current[id] !== token ||
          !current ||
          current.status === "done" ||
          current.status === "uploading"
        ) {
          URL.revokeObjectURL(processed.url);
          return;
        }
        setDrafts((prev) => {
          let oldUrl: string | null = null;
          const next = prev.map((item) => {
            if (item.id !== id) return item;
            if (item.processed && item.processed.url !== processed.url) {
              oldUrl = item.processed.url;
            }
            return { ...item, processed };
          });
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          return next;
        });
      })
      .catch(() => {
        if (renderTokensRef.current[id] === token) {
          setDraft(id, { processed: null });
        }
      });
  }, []);

  /**
   * Apply rotation/crop edits through one guarded path. Editing a page that is
   * already uploaded (status "done") keeps its serverPageId, flips the card
   * back to a draft so the edit/upload controls reappear, and the next upload
   * REPLACES the stale server page instead of appending a duplicate.
   */
  const applyEdits = useCallback(
    (id: string, patch: Partial<Pick<ImagePageDraft, "rotation" | "crop">>) => {
      const draft = draftsRef.current.find((d) => d.id === id);
      if (!draft || busyRef.current) return;
      if (draft.status === "done") {
        setDraft(id, { ...patch, processed: null, status: "draft" });
      } else {
        setDraft(id, { ...patch, processed: null });
      }
      refreshProcessed(id);
    },
    [refreshProcessed],
  );

  const setRotation = useCallback(
    (id: string, rotation: ImageRotation) => {
      applyEdits(id, { rotation });
    },
    [applyEdits],
  );

  const setCrop = useCallback(
    (id: string, crop: CropRect | null) => {
      applyEdits(id, { crop });
    },
    [applyEdits],
  );

  const clearEdits = useCallback(
    (id: string) => {
      applyEdits(id, { rotation: 0, crop: null });
    },
    [applyEdits],
  );

  const moveDraft = useCallback(
    (id: string, direction: -1 | 1) => {
      if (busyRef.current) return;
      setDrafts((prev) => {
        const index = prev.findIndex((d) => d.id === id);
        const item = prev[index];
        const target = index + direction;
        if (!item || index < 0 || target < 0 || target >= prev.length) return prev;
        if (item.status === "done" || item.status === "uploading") return prev;
        const next = [...prev];
        next.splice(index, 1);
        next.splice(target, 0, item);
        return next;
      });
    },
    [],
  );

  const invalidatePages = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [EXAM_SESSION_QUERY_KEY, attemptId, "answer-pages", examQuestionId],
    });
  }, [queryClient, attemptId, examQuestionId]);

  const runUpload = useCallback(
    async (draft: ImagePageDraft): Promise<PageUploadResult> => {
      // Always render fresh so the uploaded bytes exactly match the current
      // rotation/crop, even if the eager preview render hasn't caught up yet.
      let processed: Awaited<ReturnType<typeof renderProcessedImage>>;
      try {
        processed = await renderProcessedImage(draft.source, draft.rotation, draft.crop);
      } catch {
        // The file could not be decoded/encoded client-side (unsupported
        // format, corrupt bytes, canvas limits). This is NOT a network/server
        // failure — surface an actionable message instead of the generic
        // "unexpected error" the upload-error classifier would otherwise pick.
        throw {
          status: 415,
          message:
            "تعذّرت معالجة هذه الصورة (القص/التدوير). جرّب صورة أخرى بصيغة JPG أو PNG.",
          fieldErrors: {},
          isNetworkError: false,
          raw: null,
        };
      }

      const original_filename = outputFileNameFor(draft.source, draft.rotation);
      const mime_type = processed.mimeType || outputMimeFor(draft.source);
      const size_bytes = processed.blob.size;

      const intent = await examSessionService.createPageUploadIntent(attemptId, examQuestionId, {
        original_filename,
        mime_type,
        size_bytes,
      });

      if (!intent.uploadUrl) {
        throw {
          status: 501,
          message: "نظام رفع الملفات غير متاح لهذه الأكاديمية.",
          fieldErrors: {},
          isNetworkError: false,
          raw: null,
        };
      }

      await directPut(intent.uploadUrl, intent.headers, processed.blob, (progress) => {
        setDraft(draft.id, { progress });
      });

      // Dimensions sent to confirm are of the PROCESSED (rotated/cropped) image
      // so the read-back mirrors what the student actually submitted.
      const replacedPageId = draft.serverPageId;
      const result = await examSessionService.confirmPageUpload(
        attemptId,
        examQuestionId,
        intent.sessionId,
        {
          captured_at: draft.capturedAt,
          width: processed.width,
          height: processed.height,
          size_bytes: processed.blob.size,
          mime_type,
          original_filename,
        },
      );

      // When this draft was a re-edit of an already-confirmed page (crop or
      // rotation applied after the first upload), remove the stale server page
      // so the freshly confirmed one does not get duplicated. Non-terminal: a
      // leftover page stays visible in the read endpoint and can be removed
      // manually, so a failure here must not fail the re-upload itself.
      if (replacedPageId && replacedPageId !== result.pageId) {
        try {
          await examSessionService.deletePage(attemptId, examQuestionId, replacedPageId);
        } catch {
          // ignore — the new page is already confirmed
        }
      }

      return {
        type: "ok" as const,
        pageId: result.pageId,
        pageOrder: result.pageOrder,
        gradingStatus: result.gradingStatus,
      };
    },
    [attemptId, examQuestionId],
  );

  const finishUpload = useCallback(
    (id: string, result: PageUploadFinishResult) => {
      let next: Partial<ImagePageDraft>;
      if (result.type === "error") {
        next =
          result.error.kind === "expired"
            ? {
                status: "expired" as const,
                progress: 0,
                error: result.error.message,
              }
            : {
                status: "error" as const,
                progress: 0,
                error: result.error.message,
              };
      } else if (result.type === "expired") {
        next = {
          status: "expired" as const,
          progress: 0,
          error: result.message ?? "انتهى وقت الامتحان. لم يتم حفظ الصفحة.",
        };
      } else {
        next = {
          status: "done" as const,
          progress: 100,
          serverPageId: result.pageId,
          error: null,
        };
      }
      setDraft(id, next);
    },
    [],
  );

  const uploadDraft = useCallback(
    async (id: string) => {
      if (uploadingRef.current !== null) return;
      const draft = draftsRef.current.find((d) => d.id === id);
      if (!draft) return;
      if (draft.status === "done" || draft.status === "uploading") return;

      uploadingRef.current = id;
      setUploadingId(id);
      busyRef.current = true;
      setBusy(true);
      setDraft(id, { status: "uploading", progress: 0, error: null });

      try {
        const result = await runUpload(draft);
        finishUpload(id, result);
        invalidatePages();
      } catch (error) {
        const classified = classifyUploadError(error);
        finishUpload(id, { type: "error", error: classified });
      } finally {
        uploadingRef.current = null;
        setUploadingId(null);
        busyRef.current = false;
        setBusy(false);
      }
    },
    [runUpload, finishUpload, invalidatePages],
  );

  const retryDraft = useCallback(
    (id: string) => {
      void uploadDraft(id);
    },
    [uploadDraft],
  );

  const uploadAll = useCallback(async () => {
    if (busyRef.current) return;
    const queued = draftsRef.current.filter(
      (d) => d.status === "draft" || d.status === "error",
    );
    if (queued.length === 0) return;
    for (const draft of queued) {
      if (uploadingRef.current !== null) break;
      await uploadDraft(draft.id);
    }
  }, [uploadDraft]);

  // Release object URLs for drafts that are still around on unmount.
  useEffect(() => {
    return () => {
      for (const draft of draftsRef.current) {
        URL.revokeObjectURL(draft.rawUrl);
        if (draft.processed) URL.revokeObjectURL(draft.processed.url);
      }
    };
  }, []);

  const draftDedup = useCallback(
    (draft: ImagePageDraft): boolean => {
      if (draft.status !== "done") return true;
      return draft.serverPageId === null || !existingIdsRef.current.has(draft.serverPageId);
    },
    [],
  );

  return {
    drafts,
    uploadingId,
    busy,
    addFiles,
    addServerPageForEdit,
    removeDraft,
    forgetServerPage,
    setRotation,
    setCrop,
    clearEdits,
    moveDraft,
    uploadDraft,
    uploadAll,
    retryDraft,
    draftDedup,
    answered,
  };
}

export { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES };