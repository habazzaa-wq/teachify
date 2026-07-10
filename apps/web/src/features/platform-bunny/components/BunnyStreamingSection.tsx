"use client";

import { Radio } from "lucide-react";
import {
  StudioSurfaceCard,
  StudioSwitch,
  StudioInput,
} from "@/components/studio";
import { bunnyMessages as m } from "../messages";
import type { BunnySectionProps } from "../types";

export function BunnyStreamingSection({ draft, onChange }: BunnySectionProps) {
  return (
    <StudioSurfaceCard variant="default" padding="lg" className="border-studio-border">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-studio-accent-soft text-studio-accent">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-studio-fg">{m.streaming}</h3>
          <p className="text-sm text-studio-fg-muted">{m.streamingDesc}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-studio-border bg-studio-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.enableStream}</p>
            <p className="text-xs text-studio-fg-muted">{m.enableStreamHint}</p>
          </div>
          <StudioSwitch
            checked={draft.enableStream}
            onCheckedChange={(v) => onChange({ enableStream: v })}
            aria-label={m.enableStream}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-studio-border bg-studio-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.enableCdn}</p>
            <p className="text-xs text-studio-fg-muted">{m.enableCdnHint}</p>
          </div>
          <StudioSwitch
            checked={draft.enableCdn}
            onCheckedChange={(v) => onChange({ enableCdn: v })}
            aria-label={m.enableCdn}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-studio-border bg-studio-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.enableSignedUrls}</p>
            <p className="text-xs text-studio-fg-muted">{m.enableSignedUrlsHint}</p>
          </div>
          <StudioSwitch
            checked={draft.enableSignedUrls}
            onCheckedChange={(v) => onChange({ enableSignedUrls: v })}
            aria-label={m.enableSignedUrls}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-studio-border bg-studio-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.enableTranscoding}</p>
            <p className="text-xs text-studio-fg-muted">{m.enableTranscodingHint}</p>
          </div>
          <StudioSwitch
            checked={draft.enableTranscoding}
            onCheckedChange={(v) => onChange({ enableTranscoding: v })}
            aria-label={m.enableTranscoding}
          />
        </div>

        <StudioInput
          label={m.defaultThumbnailTime}
          type="number"
          min={0}
          max={3600}
          value={String(draft.defaultThumbnailTime ?? 0)}
          onChange={(e) =>
            onChange({ defaultThumbnailTime: Number.parseInt(e.target.value || "0", 10) })
          }
        />
      </div>
    </StudioSurfaceCard>
  );
}
