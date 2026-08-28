"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, FileEdit, UploadCloud, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUploadManagerStore, type RenameDraftFile } from "../store";
import { useUploadManager } from "../hooks";
import { createFilePreview, revokeFilePreview } from "../utils/files";
import { formatBytes } from "../utils/format";
import { CATEGORY_ICONS } from "./icons";

/** Keep the original extension if the teacher types a name without one. */
function finalizeName(defaultName: string, edited: string): string {
  const trimmed = edited.trim();
  if (trimmed === "") return defaultName;
  const dotAt = defaultName.lastIndexOf(".");
  const ext = dotAt > 0 ? defaultName.slice(dotAt) : "";
  if (ext && !trimmed.includes(".")) return `${trimmed}${ext}`;
  return trimmed;
}

interface InnerProps {
  draft: RenameDraftFile[];
  onConfirm: (names: string[]) => void;
  onCancel: () => void;
}

function PrepareUploadDialogInner({ draft, onConfirm, onCancel }: InnerProps) {
  const [names, setNames] = useState<string[]>(() => draft.map((d) => d.defaultName));

  const previews = useMemo(() => draft.map((d) => createFilePreview(d.file)), [draft]);
  useEffect(() => {
    return () => {
      for (const url of previews) revokeFilePreview(url);
    };
  }, [previews]);

  const lowerNames = names.map((n) => n.trim().toLowerCase());
  const duplicates = useMemo(() => {
    const seen = new Set<string>();
    const dup = new Set<string>();
    for (const n of lowerNames) {
      if (n === "") continue;
      if (seen.has(n)) dup.add(n);
      seen.add(n);
    }
    return dup;
  }, [lowerNames]);

  const handleChange = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const handleConfirm = () => {
    onConfirm(draft.map((d, i) => finalizeName(d.defaultName, names[i] ?? "")));
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="تسمية الملفات قبل الرفع"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="relative flex max-h-[85vh] w-[min(92vw,34rem)] flex-col overflow-hidden rounded-2xl border border-studio-border bg-studio-surface shadow-floating"
    >
      <header className="flex items-center justify-between gap-3 border-b border-studio-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-studio-accent-soft text-studio-accent">
            <FileEdit className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-studio-fg">تسمية الملفات قبل الرفع</h2>
            <p className="text-xs text-studio-fg-muted">
              {draft.length === 1
                ? "يمكنك ترك الاسم كما هو أو تغييره قبل الرفع"
                : `يمكنك ترك الأسماء كما هي أو تغييرها قبل رفع ${draft.length} ملف`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="إغلاق"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-studio-border text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="studio-scrollbar flex-1 overflow-y-auto px-4 py-3">
        <ul className="flex flex-col gap-3">
          {draft.map((d, i) => {
            const CategoryIcon = CATEGORY_ICONS[d.category]!;
            const isEmpty = names[i]?.trim() === "";
            const isDup = d.defaultName !== "" && duplicates.has(lowerNames[i] ?? "");
            return (
              <li key={d.id} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-studio-border bg-studio-soft">
                  {previews[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[i]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CategoryIcon className="h-5 w-5 text-studio-fg-muted" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <input
                    type="text"
                    value={names[i] ?? ""}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirm();
                    }}
                    aria-label={`اسم الملف ${i + 1}`}
                    className={cn(
                      "w-full rounded-md border bg-studio-bg px-2.5 py-1.5 text-[13px] text-studio-fg outline-none transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-studio-ring",
                      isEmpty
                        ? "border-studio-warning/50"
                        : isDup
                          ? "border-studio-danger/50"
                          : "border-studio-border focus-visible:border-studio-accent",
                    )}
                  />
                  <div className="flex items-center gap-2 text-[11px] text-studio-fg-muted">
                    <span className="shrink-0 rounded bg-studio-soft px-1.5 py-0.5">
                      {formatBytes(d.size)}
                    </span>
                    {isEmpty && <span className="text-studio-warning">سيُرفع بالاسم الأصلي</span>}
                    {isDup && (
                      <span className="flex items-center gap-1 text-studio-danger">
                        <AlertTriangle className="h-3 w-3" /> اسم مكرر
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-studio-border px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-studio-border px-3 py-2 text-sm font-medium text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg"
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-2 rounded-lg bg-studio-accent px-3 py-2 text-sm font-semibold text-studio-accent-fg transition-colors hover:bg-studio-accent/90"
        >
          <UploadCloud className="h-4 w-4" />
          إضافة للرفع
        </button>
      </footer>
    </motion.div>
  );
}

export function PrepareUploadDialog() {
  const isOpen = useUploadManagerStore((s) => s.isRenameOpen);
  const draft = useUploadManagerStore((s) => s.renameDraft);
  const folderId = useUploadManagerStore((s) => s.renameFolderId);
  const source = useUploadManagerStore((s) => s.renameSource);
  const closeRename = useUploadManagerStore((s) => s.closeRename);
  const { enqueueFiles } = useUploadManager();

  const handleConfirm = (names: string[]) => {
    enqueueFiles(draft.map((d) => d.file), { folderId, names, source: source ?? "file-input" });
    closeRename();
  };

  const batchKey = draft.map((d) => d.id).join("|");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-studio-fg/40 backdrop-blur-sm" onClick={closeRename} aria-hidden />
          <PrepareUploadDialogInner
            key={batchKey}
            draft={draft}
            onConfirm={handleConfirm}
            onCancel={closeRename}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
