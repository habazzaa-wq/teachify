import { GraduationCap, type LucideIcon } from "lucide-react";
import { getNavbarIcon } from "@/features/settings/constants/navbar-icons";
import { toAbsoluteAssetUrl } from "@/lib/url";

/**
 * A deterministic description of what the public navbar should paint.
 *
 * The image list is ordered: the navbar tries each URL in turn and only falls
 * back to the icon when every image failed to load. Keeping this decision in a
 * pure helper means the server-rendered HTML and the first client render always
 * agree on the same source (no logo flicker after hydration).
 */
export type NavbarLogoPlan =
  | { kind: "icon"; icon: LucideIcon }
  | {
      kind: "image";
      /** First image to try. */
      src: string;
      /** Tried in order when `src` is broken (e.g. deleted media-library file). */
      fallbacks: string[];
      /** Painted when all image candidates fail. */
      fallbackIcon: LucideIcon;
    };

export interface ResolveNavbarLogoInput {
  logoType?: string | null;
  logoIcon?: string | null;
  logoImage?: string | null;
  /** Image from the other branding source (platform ↔ tenant), if different. */
  alternateImage?: string | null;
  legacyLogo?: string | null;
  darkLogo?: string | null;
  lightLogo?: string | null;
  theme?: "light" | "dark";
}

/**
 * Resolve logo settings into a single render plan.
 *
 * Values can arrive from two places (server-resolved platform branding and the
 * tenant's older appearance settings). They are validated *together* here so a
 * stale `logoType` from one source can never be combined with a missing image
 * from another source and leave an empty slot in the navbar.
 */
export function resolveNavbarLogo({
  logoType,
  logoIcon,
  logoImage,
  alternateImage,
  legacyLogo,
  darkLogo,
  lightLogo,
  theme = "light",
}: ResolveNavbarLogoInput): NavbarLogoPlan {
  const fallbackIcon = getNavbarIcon(logoIcon) ?? GraduationCap;

  if (logoType === "icon") {
    return { kind: "icon", icon: fallbackIcon };
  }

  const images: string[] = [];
  const addImage = (url: string | null | undefined) => {
    const absolute = toAbsoluteAssetUrl(url);
    if (absolute && !images.includes(absolute)) images.push(absolute);
  };

  // Explicitly selected image first, then the other branding source, then the
  // theme-specific legacy logo and finally the oldest `logo` field.
  addImage(logoImage);
  addImage(alternateImage);
  addImage(theme === "dark" ? darkLogo ?? legacyLogo : lightLogo ?? legacyLogo);
  addImage(legacyLogo);

  const [src, ...fallbacks] = images;
  if (!src) {
    return { kind: "icon", icon: fallbackIcon };
  }

  return {
    kind: "image",
    src,
    fallbacks,
    fallbackIcon,
  };
}
