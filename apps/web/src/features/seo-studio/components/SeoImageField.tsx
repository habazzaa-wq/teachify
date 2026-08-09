"use client";

import { useTranslations } from "next-intl";
import { ImageOff, X } from "lucide-react";
import { AppButton } from "@/components/ui";
import { ChooseMediaButton } from "@/features/media-library/components/ChooseMediaButton";
import type { SeoImageData } from "../types";

interface SeoImageFieldProps {
  label: string;
  image: SeoImageData | null;
  onSelect: (assetId: number | null) => void;
}

function SeoImageField({ label, image, onSelect }: SeoImageFieldProps) {
  const t = useTranslations("seo");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <ChooseMediaButton
          mode="single"
          allowedTypes={["image"]}
          label={t("chooseImage")}
          onSelect={(result) => onSelect(result.id)}
        />
      </div>

      {image ? (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
          {image.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.title ?? label}
              className="h-16 w-16 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-background text-xs text-muted-foreground">
              {t("imageSelected")}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-medium">{image.title ?? label}</p>
            {image.width && image.height ? (
              <p className="text-xs text-muted-foreground">
                {t("imageDim")}: {image.width}×{image.height}
              </p>
            ) : null}
          </div>
          <AppButton
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onSelect(null)}
            aria-label={t("removeImage")}
          >
            <X className="h-4 w-4" />
          </AppButton>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          <ImageOff className="h-4 w-4" />
          {t("noSocialImage")}
        </div>
      )}
    </div>
  );
}

export { SeoImageField };
