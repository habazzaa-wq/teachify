"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  Crop,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { api } from "@/services/api";
import { normalizeApiError } from "@/services/api/errors";
import { cn } from "@/lib/cn";
import { useAnswerPages } from "../../hooks";
import { EXAM_SESSION_QUERY_KEY } from "../../constants";
import { examSessionService } from "../../services";
import type { ExamAnswerPage, ExamAnswerPagesPayload, ExamPageManageResult } from "../../types";
import type { ImagePageDraft, ImageRotation } from "../types";
import { usePageUploader, ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "../usePageUploader";
import { CropEditor } from "./CropEditor";

interface ImageAnswerCaptureProps {
  attemptId: string;
  examQuestionId: string;
  disabled?: boolean;
  onBusyChange?: (examQuestionId: string, busy: boolean) => void;
  onAnsweredChange?: (examQuestionId: string, answered: boolean) => void;
}

const SECTION_LABEL =
  "px-1 text-[11px] font-extrabold tracking-wide text-muted-foreground";

export function ImageAnswerCapture({
  attemptId,
  examQuestionId,
  disabled = false,
  onBusyChange,
  onAnsweredChange,
}: ImageAnswerCaptureProps) {
  const { data: pagesData } = useAnswerPages(attemptId, examQuestionId);
  const existingPages = pagesData?.pages ?? null;

  const uploader = usePageUploader({
    attemptId,
    examQuestionId,
    disabled,
    existingPages,
    onBusyChange: (busy) => onBusyChange?.(examQuestionId, busy),
    onAnsweredChange: (answered) => onAnsweredChange?.(examQuestionId, answered),
  });

  const queryClient = useQueryClient();
  const { busy: uploadBusy, forgetServerPage } = uploader;
  const pagesQueryKey = useMemo(
    () => [EXAM_SESSION_QUERY_KEY, attemptId, "answer-pages", examQuestionId] as const,
    [attemptId, examQuestionId],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorNonce, setEditorNonce] = useState(0);
  const [managing, setManaging] = useState(false);
  const managingRef = useRef(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const openEditor = (draftId: string) => {
    setEditingId(draftId);
    setEditorNonce((nonce) => nonce + 1);
  };
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [serverPreviews, setServerPreviews] = useState<Record<string, string | null>>({});
  const serverPreviewLoadingRef = useRef<Record<string, boolean>>({});
  const serverObjectURLsRef = useRef<Record<string, string>>({});
  const [serverEditLoading, setServerEditLoading] = useState(false);

  useEffect(() => {
    const urls = serverObjectURLsRef.current;
    return () => {
      for (const url of Object.values(urls)) URL.revokeObjectURL(url);
    };
  }, []);

  const editingDraft = editingId
    ? uploader.drafts.find((draft) => draft.id === editingId) ?? null
    : null;

  const editorVisible =
    !!editingDraft &&
    editingDraft.status !== "uploading" &&
    editingDraft.status !== "expired";

  const visibleDrafts = uploader.drafts.filter(uploader.draftDedup);
  const queueCount = visibleDrafts.filter(
    (draft) => draft.status === "draft" || draft.status === "error",
  ).length;
  const selectable = !disabled;

  const toggleServerPreview = useCallback(async (page: ExamAnswerPage) => {
    if (serverPreviewLoadingRef.current[page.id]) return;
    const existing = serverObjectURLsRef.current[page.id];
    if (existing) {
      URL.revokeObjectURL(existing);
      delete serverObjectURLsRef.current[page.id];
      setServerPreviews((prev) => ({ ...prev, [page.id]: null }));
      return;
    }
    serverPreviewLoadingRef.current[page.id] = true;
    try {
      const { data } = await api.get(page.url, {
        responseType: "blob",
        timeout: 60_000,
      });
      const objectUrl = URL.createObjectURL(data);
      serverObjectURLsRef.current[page.id] = objectUrl;
      setServerPreviews((prev) => ({ ...prev, [page.id]: objectUrl }));
    } finally {
      serverPreviewLoadingRef.current[page.id] = false;
    }
  }, []);

  /**
   * Optimistically reconcile the answer-pages cache against the server's
   * post-delete/reorder payload so the page list (and the header's
   * count/badge) stay in sync without a round-trip. A deleted page is dropped
   * from the cache; any surviving pageOrder is replaced with the server's.
   */
  const patchManageResult = useCallback(
    (result: ExamPageManageResult, removedId: string | null) => {
      const cached = queryClient.getQueryData<ExamAnswerPagesPayload>(pagesQueryKey);
      if (!cached) return;

      const orderById = new Map(result.pages.map((page) => [page.id, page.pageOrder]));
      const pages = cached.pages
        .filter((page) => orderById.has(page.id))
        .sort(
          (a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0),
        )
        .map((page) => ({ ...page, pageOrder: orderById.get(page.id) ?? page.pageOrder }));

      queryClient.setQueryData<ExamAnswerPagesPayload>(pagesQueryKey, {
        ...cached,
        answerMode: result.answerMode,
        gradingStatus: result.gradingStatus,
        pages,
      });

      if (removedId) {
        const cachedUrl = serverObjectURLsRef.current[removedId];
        if (cachedUrl) {
          URL.revokeObjectURL(cachedUrl);
          delete serverObjectURLsRef.current[removedId];
          delete serverPreviewLoadingRef.current[removedId];
          setServerPreviews((prev) => {
            const next = { ...prev };
            delete next[removedId];
            return next;
          });
        }
      }
    },
    [pagesQueryKey, queryClient],
  );

  /**
   * Shared busy/error wrapper for the Phase D-FIX delete + reorder mutations.
   * Guards against overlapping manage operations (same mechanism as the
   * uploader's busy ref) and surfaces the server's validation message.
   */
  const runManage = useCallback(
    async (
      operation: () => Promise<ExamPageManageResult>,
      removedPageId: string | null,
    ) => {
      if (uploadBusy || managingRef.current) return;
      managingRef.current = true;
      setManaging(true);
      setManageError(null);
      try {
        const result = await operation();
        patchManageResult(result, removedPageId);
        if (removedPageId) forgetServerPage(removedPageId);
      } catch (error) {
        const apiError = normalizeApiError(error);
        const fieldMessage =
          apiError.fieldErrors?.page_ids?.[0] ??
          apiError.fieldErrors?.attempt?.[0];
        setManageError(
          fieldMessage ?? apiError.message ?? "تعذّر تعديل الصفحة. أعد المحاولة لاحقًا.",
        );
      } finally {
        managingRef.current = false;
        setManaging(false);
      }
    },
    [forgetServerPage, patchManageResult, uploadBusy],
  );

  const handleDeletePage = useCallback(
    (page: ExamAnswerPage) => {
      if (uploadBusy) return;
      void runManage(
        () => examSessionService.deletePage(attemptId, examQuestionId, page.id),
        page.id,
      );
    },
    [attemptId, examQuestionId, runManage, uploadBusy],
  );

  const handleEditServerPage = async (page: ExamAnswerPage) => {
    if (uploadBusy || managingRef.current || serverEditLoading) return;
    setServerEditLoading(true);
    try {
      const { data } = await api.get(page.url, {
        responseType: "blob",
        timeout: 60_000,
      });
      const type: string = data.type || "image/jpeg";
      const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
      const file = new File([data], `page-${page.id}.${ext}`, { type });
      const draftId = uploader.addServerPageForEdit(file, page.id);
      if (draftId) openEditor(draftId);
    } finally {
      setServerEditLoading(false);
    }
  };

  const handleMovePage = useCallback(
    (page: ExamAnswerPage, direction: -1 | 1) => {
      if (uploadBusy) return;
      const pages =
        queryClient.getQueryData<ExamAnswerPagesPayload>(pagesQueryKey)?.pages ??
        existingPages ??
        [];
      const index = pages.findIndex((candidate) => candidate.id === page.id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= pages.length) return;
      const next = pages.filter((candidate) => candidate.id !== page.id);
      next.splice(target, 0, page);
      void runManage(
        () =>
          examSessionService.reorderPages(
            attemptId,
            examQuestionId,
            next.map((candidate) => candidate.id),
          ),
        null,
      );
    },
    [attemptId, examQuestionId, existingPages, pagesQueryKey, queryClient, runManage, uploadBusy],
  );

  return (
    <div className="mt-4 space-y-3">
      <div
        className={cn(
          "rounded-2xl border-2 border-dashed p-4",
          selectable
            ? "border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/[0.04]"
            : "border-border/40 bg-muted/30",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <ImagePlus className="h-4 w-4 text-[var(--brand-primary)]" />
          <h3 className="text-sm font-extrabold text-foreground">إجابة مصوّرة</h3>
          {uploader.answered && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">
              <Check className="h-3 w-3" />
              تم الرفع
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          يمكنك رفع صور لإجابتك الورقية (اختياري) بدلاً من الكتابة أو إلى جانبها.
        </p>

        {existingPages && existingPages.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className={SECTION_LABEL}>الصفحات المرفوعة ({existingPages.length})</p>
            </div>
            {manageError && (
              <p className="text-[10px] font-semibold leading-relaxed text-red-500">
                {manageError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {existingPages.map((page, index) => (
                <ServerPageCard
                  key={page.id}
                  page={page}
                  preview={serverPreviews[page.id] ?? null}
                  onToggle={() => void toggleServerPreview(page)}
                  onDelete={selectable ? () => void handleDeletePage(page) : undefined}
                  onEdit={
                    selectable && !serverEditLoading
                      ? () => void handleEditServerPage(page)
                      : undefined
                  }
                  onMoveUp={
                    selectable && index > 0
                      ? () => void handleMovePage(page, -1)
                      : undefined
                  }
                  onMoveDown={
                    selectable && index < existingPages.length - 1
                      ? () => void handleMovePage(page, 1)
                      : undefined
                  }
                  mutating={managing || uploadBusy}
                />
              ))}
            </div>
          </div>
        )}

        {visibleDrafts.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className={SECTION_LABEL}>صفحات جديدة ({visibleDrafts.length})</p>
              {queueCount > 0 && (
                <button
                  type="button"
                  disabled={!selectable}
                  onClick={() => void uploader.uploadAll()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "var(--brand-primary)" }}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  رفع الكل ({queueCount})
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {visibleDrafts.map((draft, index) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  index={index}
                  total={visibleDrafts.length}
                  selectable={selectable}
                  uploading={uploader.uploadingId === draft.id}
                  onEdit={
                    draft.status === "draft" ||
                    draft.status === "error" ||
                    draft.status === "done"
                      ? () => openEditor(draft.id)
                      : undefined
                  }
                  onRotate={
                    draft.status === "draft" ||
                    draft.status === "error" ||
                    draft.status === "done"
                      ? () =>
                          uploader.setRotation(
                            draft.id,
                            ((draft.rotation + 90) % 360) as ImageRotation,
                          )
                      : undefined
                  }
                  onMoveUp={
                    draft.status !== "done"
                      ? index > 0
                        ? () => uploader.moveDraft(draft.id, -1)
                        : undefined
                      : undefined
                  }
                  onMoveDown={
                    draft.status !== "done"
                      ? index < visibleDrafts.length - 1
                        ? () => uploader.moveDraft(draft.id, 1)
                        : undefined
                      : undefined
                  }
                  onRemove={
                    draft.status === "draft" ||
                    draft.status === "error" ||
                    draft.status === "expired"
                      ? () => uploader.removeDraft(draft.id)
                      : undefined
                  }
                  onUpload={
                    draft.status === "draft" || draft.status === "error"
                      ? () => void uploader.uploadDraft(draft.id)
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}

        {selectable && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-lg shadow-[rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "var(--brand-primary)" }}
            >
              <Camera className="h-4 w-4" />
              التقاط صورة
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 text-sm font-bold text-foreground/80 transition-all duration-200 hover:bg-muted"
            >
              <ImagePlus className="h-4 w-4" />
              اختيار من الجهاز
            </button>
          </div>
        )}

        <p className="mt-2 text-[10px] font-medium text-muted-foreground/70">
          الصيغ المدعومة: JPG / PNG / WebP وغيرها — بحد أقصى{" "}
          {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB للصورة الواحدة.
        </p>

        {uploader.busy && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 ring-1 ring-amber-500/30">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            جارٍ رفع صفحة الإجابة... يُرجى عدم الانتقال بين الأسئلة أو إغلاق الصفحة حتى يكتمل الرفع.
          </div>
        )}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        capture="environment"
        multiple
        className="hidden"
        onChange={(event) => {
          if (selectable) uploader.addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        multiple
        className="hidden"
        onChange={(event) => {
          if (selectable) uploader.addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {editorVisible && (
        <CropEditor
          key={`${editingDraft.id}-${editorNonce}`}
          open
          file={editingDraft.source}
          rotation={editingDraft.rotation}
          initialCrop={editingDraft.crop}
          title="تعديل صورة الإجابة"
          onRotationChange={(rotation) => uploader.setRotation(editingDraft.id, rotation)}
          onApply={(crop) => uploader.setCrop(editingDraft.id, crop)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function ServerPageCard({
  page,
  preview,
  onToggle,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  mutating,
}: {
  page: ExamAnswerPage;
  preview: string | null;
  onToggle: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  mutating?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-2">
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg bg-muted/30">
        {preview ? (
          <img
            src={preview}
            alt={`صفحة ${page.pageOrder}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] font-bold">صفحة {page.pageOrder}</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-[11px] font-extrabold text-muted-foreground">
          صفحة {page.pageOrder}
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          {onEdit && onDelete && (
            <IconButton
              label="قصّ"
              title="قصّ الصفحة المرفوعة"
              disabled={mutating}
              onClick={onEdit}
            >
              <Crop className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {onDelete && (
            <>
              <IconButton
                label="أعلى"
                title="تقديم الصفحة"
                disabled={!onMoveUp || mutating}
                onClick={onMoveUp}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                label="أسفل"
                title="تأخير الصفحة"
                disabled={!onMoveDown || mutating}
                onClick={onMoveDown}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label="حذف" title="حذف الصفحة" danger disabled={mutating} onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)]/10"
          >
            {preview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                إخفاء
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                معاينة
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DraftCardProps {
  draft: ImagePageDraft;
  index: number;
  total: number;
  selectable: boolean;
  uploading: boolean;
  onEdit?: () => void;
  onRotate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  onUpload?: () => void;
}

function DraftCard({
  draft,
  index,
  total,
  selectable,
  uploading,
  onEdit,
  onRotate,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpload,
}: DraftCardProps) {
  const canManage =
    selectable &&
    (draft.status === "draft" ||
      draft.status === "error" ||
      draft.status === "done");
  const previewUrl = draft.processed?.url ?? draft.rawUrl;

  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-2">
      <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-lg bg-muted/30">
        <img
          src={previewUrl}
          alt={`صفحة جديدة ${index + 1}`}
          className="h-full w-full object-contain"
        />

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <span className="text-xs font-extrabold tabular-nums text-white">
              جارٍ الرفع {draft.progress}%
            </span>
          </div>
        )}

        {draft.status === "done" && (
          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
            تم الرفع
          </span>
        )}

        {draft.status === "expired" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-3 text-center">
            <span className="text-[11px] font-bold text-white">{draft.error}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-extrabold text-muted-foreground">
            صفحة {index + 1} من {total}
          </p>
          {draft.status === "error" && draft.error && (
            <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold leading-snug text-red-500">
              {draft.error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {canManage && (
            <>
              <IconButton label="قصّ" title="قصّ الصورة" onClick={onEdit}>
                <Crop className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label="تدوير" title="تدوير 90 درجة" onClick={onRotate}>
                <RotateCw className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label="أعلى" title="تقديم الصفحة" disabled={!onMoveUp} onClick={onMoveUp}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                label="أسفل"
                title="تأخير الصفحة"
                disabled={!onMoveDown}
                onClick={onMoveDown}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label="حذف" title="حذف الصفحة" danger onClick={onRemove}>
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </>
          )}

          {draft.status === "error" && (
            <button
              type="button"
              onClick={() => onUpload?.()}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-500 px-2.5 text-[11px] font-extrabold text-white transition-colors hover:bg-red-600"
            >
              <RefreshCw className="h-3 w-3" />
              إعادة
            </button>
          )}

          {draft.status === "draft" && onUpload && (
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-extrabold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "var(--brand-primary)" }}
            >
              رفع
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  title,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      disabled={disabled || !onClick}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors",
        !disabled && onClick && !danger && "hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]",
        !disabled && onClick && danger && "hover:border-red-500 hover:bg-red-500/10 hover:text-red-500",
        (disabled || !onClick) && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}