"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
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
 * Two failure modes are handled explicitly:
 *  1. An image that fails *before* React hydrates never fires `onError`, so a
 *     plain `onError` handler leaves a broken <img> occupying space. On mount we
 *     inspect `complete`/`naturalWidth` and move on to the next candidate.
 *  2. `alt` text is intentionally empty (the parent link has an aria-label), so
 *     a broken image never reserves width while it is being verified.
 *
 * The image is revealed only after a successful load, which also removes the
 * flash of an empty box on slow connections.
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
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const markFailed = useCallback((source: string) => {
    setFailedSources((prev) =>
      prev.includes(source) ? prev : [...prev, source],
    );
  }, []);

  const src = candidates.find((candidate) => !failedSources.includes(candidate));
  const icon = plan.kind === "icon" ? plan.icon : plan.fallbackIcon;

  // Catch images that were already broken in the server-rendered HTML, before
  // React attached its event handlers (the main cause of the "invisible image
  // taking up space" symptom).
  useEffect(() => {
    if (!src) return;
    const image = imageRef.current;
    if (!image?.complete) return;

    if (image.naturalWidth > 0) {
      setLoadedSource(src);
    } else {
      markFailed(src);
    }
  }, [src, markFailed]);

  if (!src) {
    return <NavbarLogoIcon icon={icon} />;
  }

  const imageLoaded = loadedSource === src;

  return (
    <div className="relative flex h-9 items-center">
      {/* The icon stays visible while the image is loading or being verified,
          so there is never an empty slot or a broken alt-text box. */}
      {!imageLoaded && <NavbarLogoIcon icon={icon} />}
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
        onLoad={(event) => {
          if (event.currentTarget.naturalWidth === 0) {
            markFailed(src);
          } else {
            setLoadedSource(src);
          }
        }}
        onError={() => markFailed(src)}
        className={cn(
          imageLoaded
            ? "h-auto w-auto max-h-9 max-w-[200px] object-contain transition-all duration-500 group-hover:scale-105"
            : "pointer-events-none absolute h-px w-px opacity-0",
        )}
      />
      {imageLoaded && (
        /* Hover: border = secondary */
        <span
          className="pointer-events-none absolute -inset-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ border: `3px solid var(--brand-secondary)`, boxShadow: `0 0 24px rgba(0,0,0,0.271)` }}
        />
      )}
    </div>
  );
}
