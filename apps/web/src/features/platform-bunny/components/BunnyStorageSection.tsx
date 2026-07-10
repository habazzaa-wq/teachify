"use client";

import { Database } from "lucide-react";
import { StudioSurfaceCard, StudioSwitch } from "@/components/studio";
import { bunnyMessages as m } from "../messages";
import type { BunnySectionProps } from "../types";

export function BunnyStorageSection({ draft, onChange }: BunnySectionProps) {
  return (
    <StudioSurfaceCard variant="default" padding="lg" className="border-studio-border">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-studio-accent-soft text-studio-accent">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-studio-fg">{m.storage}</h3>
          <p className="text-sm text-studio-fg-muted">{m.storageDesc}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-studio-border bg-studio-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.enableResumable}</p>
            <p className="text-xs text-studio-fg-muted">{m.enableResumableHint}</p>
          </div>
          <StudioSwitch
            checked={draft.enableResumableUpload}
            onCheckedChange={(v) => onChange({ enableResumableUpload: v })}
            aria-label={m.enableResumable}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-studio-border bg-studio-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.enableDuplicate}</p>
            <p className="text-xs text-studio-fg-muted">{m.enableDuplicateHint}</p>
          </div>
          <StudioSwitch
            checked={draft.enableDuplicateDetection}
            onCheckedChange={(v) => onChange({ enableDuplicateDetection: v })}
            aria-label={m.enableDuplicate}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-studio-border bg-studio-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.enableChecksum}</p>
            <p className="text-xs text-studio-fg-muted">{m.enableChecksumHint}</p>
          </div>
          <StudioSwitch
            checked={draft.enableChecksumValidation}
            onCheckedChange={(v) => onChange({ enableChecksumValidation: v })}
            aria-label={m.enableChecksum}
          />
        </div>
      </div>
    </StudioSurfaceCard>
  );
}
