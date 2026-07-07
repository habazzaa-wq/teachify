"use client";

import { useState, useCallback } from "react";
import {
  AppInput,
  AppTextarea,
  AppBadge,
  AppButton,
} from "@/components/ui";
import { X, Plus } from "lucide-react";
import { TAG_OPTIONS } from "../../constants";

interface CreateNotesTabProps {
  data: {
    notes: string;
    tags: string[];
  };
  errors: Record<string, string>;
  onChange: (key: string, value: string | string[]) => void;
}

function CreateNotesTab({ data, errors, onChange }: CreateNotesTabProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || data.tags.includes(trimmed)) return;
    onChange("tags", [...data.tags, trimmed]);
  }, [data.tags, onChange]);

  const removeTag = useCallback((tag: string) => {
    onChange("tags", data.tags.filter((t) => t !== tag));
  }, [data.tags, onChange]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  }, [tagInput, addTag]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">ملاحظات المشرف</label>
        <AppTextarea
          value={data.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="ملاحظات داخلية حول المؤسسة (اختياري)"
          rows={5}
        />
        {errors.notes && (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.notes}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">الوسوم</label>
        <div className="flex gap-2">
          <AppInput
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="أدخل وسماً ثم Enter"
            className="flex-1"
          />
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { addTag(tagInput); setTagInput(""); }}
            disabled={!tagInput.trim()}
          >
            <Plus className="h-4 w-4" />
            إضافة
          </AppButton>
        </div>

        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.tags.map((tag) => (
              <AppBadge key={tag} variant="secondary" className="gap-1 ps-2.5">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </AppBadge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">وسوم مقترحة</label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.filter((t) => !data.tags.includes(t)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="inline-flex items-center rounded-full border border-input px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Plus className="h-3 w-3 me-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { CreateNotesTab };
