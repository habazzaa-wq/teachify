"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppInput,
  AppButton,
} from "@/components/ui";

interface InlineCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog heading, e.g. "محاضرة جديدة". */
  heading: string;
  /** Label for the title field, e.g. "عنوان المحاضرة". */
  titleLabel: string;
  description?: string;
  pending?: boolean;
  onSubmit: (values: { title: string; slug?: string }) => void;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Minimal inline creation dialog (title + optional slug).
 * Used for lectures and sections — no giant forms.
 */
function InlineCreateDialog({
  open,
  onOpenChange,
  heading,
  titleLabel,
  description,
  pending = false,
  onSubmit,
}: InlineCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setSlug("");
      setSlugTouched(false);
    }
  }, [open]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      if (!slugTouched) setSlug(slugify(e.target.value));
    },
    [slugTouched],
  );

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed || pending) return;
    onSubmit({ title: trimmed, slug: slug.trim() || undefined });
  }, [title, slug, pending, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-md">
        <AppDialogHeader>
          <AppDialogTitle>{heading}</AppDialogTitle>
          {description && <AppDialogDescription>{description}</AppDialogDescription>}
        </AppDialogHeader>
        <div className="space-y-4 p-2">
          <div className="space-y-1.5">
            <label htmlFor="inline-create-title" className="text-xs font-medium text-muted-foreground">
              {titleLabel}
            </label>
            <AppInput
              id="inline-create-title"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder={titleLabel}
              aria-label={titleLabel}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="inline-create-slug" className="text-xs font-medium text-muted-foreground">
              الرابط (Slug)
            </label>
            <AppInput
              id="inline-create-slug"
              value={slug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="يُولَّد تلقائياً من العنوان"
              dir="ltr"
              aria-label="Slug"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <AppButton variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              إلغاء
            </AppButton>
            <AppButton
              size="sm"
              onClick={handleSubmit}
              disabled={!title.trim() || pending}
              loading={pending}
            >
              إنشاء
            </AppButton>
          </div>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}

export { InlineCreateDialog };
