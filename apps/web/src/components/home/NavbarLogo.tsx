"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { NavbarLogoPlan } from "@/features/settings/utils/navbar-logo";

const primary = "var(--brand-primary)";

function NavbarLogoIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      className="relative flex h-9 w-9 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
      style={{
        backgroundColor: primary,
        boxShadow: `0 2px 20px rgba(0,0,0,0.251)`,
      }}
    >
      <Icon className="h-5 w-5 text-[var(--brand-primary-contrast)]" />
      {/* Hover: border = secondary */}
      <span
        className="absolute -inset-[3.5px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ border: `3px solid var(--brand-secondary)`, boxShadow: `0 0 24px rgba(0,0,0,0.314)` }}
      />
    </div>
  );
}

/**
 * Paints the navbar logo from a resolved `NavbarLogoPlan`.
 *
 * The real image is painted from the very first render. A Lucide icon is only
 * used when there is no image at all or when every image candidate failed —
 * showing it "while loading" made the logo morph from an icon into the image
 * roughly half a second after every page load.
 *
 * An image that fails before React hydrates never fires `onError`, so on mount
 * we also inspect `complete`/`naturalWidth` and move on to the next candidate.
 */
export function NavbarLogo({ plan }: { plan: NavbarLogoPlan }) {
  const candidates =
    plan.kind === "image" ? [plan.src, ...plan.fallbacks] : [];
  const signature =
    plan.kind === "image"
      ? `image:${candidates.join("|")}`
      : `icon:${plan.icon.displayName ?? "logo"}`;

  // Remount on a new branding config/theme so verification starts clean.
  return <NavbarLogoInner key={signature} plan={plan} />;
}

function NavbarLogoInner({ plan }: { plan: NavbarLogoPlan }) {
  const candidates =
    plan.kind === "image" ? [plan.src, ...plan.fallbacks] : [];
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const markFailed = useCallback((source: string) => {
    setFailedSources((prev) =>
      prev.includes(source) ? prev : [...prev, source],
    );
  }, []);

  const src = candidates.find((candidate) => !failedSources.includes(candidate));
  const icon = plan.kind === "icon" ? plan.icon : plan.fallbackIcon;

  // Catch images that were already broken in the server-rendered HTML, before
  // React attached its event handlers.
  useEffect(() => {
    if (!src) return;
    const image = imageRef.current;
    if (!image?.complete) return;

    if (image.naturalWidth === 0) {
      markFailed(src);
    }
  }, [src, markFailed]);

  if (!src) {
    return <NavbarLogoIcon icon={icon} />;
  }

  return (
    <div className="relative flex h-9 items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        ref={imageRef}
        src={src}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        decoding="async"
        draggable={false}
        onError={() => markFailed(src)}
        className="h-auto w-auto max-h-9 max-w-[200px] object-contain"
      />
      {/* Hover: border = secondary */}
      <span
        className="pointer-events-none absolute -inset-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ border: `3px solid var(--brand-secondary)`, boxShadow: `0 0 24px rgba(0,0,0,0.271)` }}
      />
    </div>
  );
}
