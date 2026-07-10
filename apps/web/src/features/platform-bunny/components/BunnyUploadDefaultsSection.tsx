"use client";

import { Upload } from "lucide-react";
import {
  StudioSurfaceCard,
  StudioInput,
  StudioSelect,
} from "@/components/studio";
import { BUNNY_PRIVACY_OPTIONS } from "../constants";
import { bunnyMessages as m } from "../messages";
import { coerceInt } from "../utils";
import type { BunnyPrivacy, BunnySectionProps } from "../types";

const PRIVACY_OPTIONS = BUNNY_PRIVACY_OPTIONS.map((p) => ({
  value: p,
  label:
    p === "private"
      ? m.privacyPrivate
      : p === "public"
        ? m.privacyPublic
        : m.privacyPaid,
}));

export function BunnyUploadDefaultsSection({ draft, onChange }: BunnySectionProps) {
  return (
    <StudioSurfaceCard variant="default" padding="lg" className="border-studio-border">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-studio-accent-soft text-studio-accent">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-studio-fg">{m.upload}</h3>
          <p className="text-sm text-studio-fg-muted">{m.uploadDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StudioSelect
          label={m.defaultPrivacy}
          value={draft.defaultPrivacy ?? "private"}
          options={PRIVACY_OPTIONS}
          onChange={(e) => onChange({ defaultPrivacy: e.target.value as BunnyPrivacy })}
        />
        <StudioInput
          label={m.defaultExpiration}
          hint={m.defaultExpirationHint}
          type="number"
          min={0}
          value={draft.defaultExpirationDays ?? ""}
          onChange={(e) => onChange({ defaultExpirationDays: coerceInt(e.target.value) })}
        />
        <StudioInput
          label={m.maxUploadSize}
          hint={m.maxUploadSizeHint}
          type="number"
          min={1}
          value={draft.maxUploadSize ?? ""}
          onChange={(e) => onChange({ maxUploadSize: coerceInt(e.target.value) })}
        />
        <StudioInput
          label={m.chunkSize}
          type="number"
          min={1}
          max={512}
          value={draft.chunkSize ?? ""}
          onChange={(e) => onChange({ chunkSize: coerceInt(e.target.value) })}
        />
      </div>
    </StudioSurfaceCard>
  );
}
