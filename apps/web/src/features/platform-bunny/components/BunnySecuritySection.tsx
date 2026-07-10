"use client";

import { useState } from "react";
import { Shield, RefreshCw, KeyRound } from "lucide-react";
import {
  StudioSurfaceCard,
  StudioButton,
} from "@/components/studio";
import { BunnySecretField } from "./BunnySecretField";
import { BunnyConfirmDialog } from "./BunnyConfirmDialog";
import { useRotateBunnySecrets } from "../hooks";
import { bunnyMessages as m } from "../messages";
import type { BunnySectionProps } from "../types";

export function BunnySecuritySection({ settings }: BunnySectionProps) {
  const [rotateOpen, setRotateOpen] = useState(false);
  const [signedOpen, setSignedOpen] = useState(false);
  const rotate = useRotateBunnySecrets();

  return (
    <StudioSurfaceCard variant="default" padding="lg" className="border-studio-border">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-studio-accent-soft text-studio-accent">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-studio-fg">{m.security}</h3>
          <p className="text-sm text-studio-fg-muted">{m.securityDesc}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <StudioButton
          type="button"
          variant="secondary"
          onClick={() => setRotateOpen(true)}
        >
          <RefreshCw className="h-4 w-4" />
          {m.rotateSecrets}
        </StudioButton>
        <StudioButton
          type="button"
          variant="secondary"
          onClick={() => setSignedOpen(true)}
        >
          <KeyRound className="h-4 w-4" />
          {m.regenerateSigned}
        </StudioButton>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <BunnySecretField
          label={m.apiKey}
          field="api_key"
          maskedValue={settings.apiKeyMasked}
          hasValue={settings.hasApiKey}
        />
        <BunnySecretField
          label={m.streamApiKey}
          field="stream_api_key"
          maskedValue={settings.streamApiKeyMasked}
          hasValue={settings.hasStreamApiKey}
        />
        <BunnySecretField
          label={m.storageZonePassword}
          field="storage_zone_password"
          maskedValue={settings.storageZonePasswordMasked}
          hasValue={settings.hasStoragePassword}
        />
        <BunnySecretField
          label={m.regenerateSigned}
          field="signed_url_secret"
          maskedValue={settings.signedUrlSecretMasked}
          hasValue={settings.hasSignedUrlSecret}
        />
      </div>

      <BunnyConfirmDialog
        open={rotateOpen}
        onOpenChange={setRotateOpen}
        title={m.rotateSecrets}
        description={m.rotateSecretsDesc}
        confirmLabel={m.rotate}
        requiredText={m.rotate}
        loading={rotate.isPending}
        onConfirm={() =>
          rotate.mutate(
            {},
            { onSuccess: () => setRotateOpen(false) },
          )
        }
      />

      <BunnyConfirmDialog
        open={signedOpen}
        onOpenChange={setSignedOpen}
        title={m.regenerateSigned}
        description={m.regenerateSignedDesc}
        confirmLabel={m.regenerateSigned}
        requiredText={m.regenerateSigned}
        loading={rotate.isPending}
        onConfirm={() =>
          rotate.mutate(
            { regenerateSignedUrlSecret: true },
            { onSuccess: () => setSignedOpen(false) },
          )
        }
      />
    </StudioSurfaceCard>
  );
}
