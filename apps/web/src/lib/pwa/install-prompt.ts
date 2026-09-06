/**
 * Pure install-prompt logic for the per-tenant "Install App" banner.
 *
 * Kept free of browser globals so it can be unit-tested in a plain node/vitest
 * environment (the same way the manifest logic in this folder is tested).
 * The React layer (`useInstallPrompt` / `InstallPromptBridge`) only wires these
 * pure helpers to `window`, `navigator`, `localStorage` and `matchMedia`.
 */

/**
 * Minimal shape of the browser `beforeinstallprompt` event. The real event is
 * a `BeforeInstallPromptEvent`; we only use the two members a caller needs.
 */
export interface BeforeInstallPromptEvent {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
}

export interface InstallPromptChoice {
  outcome: "accepted" | "dismissed";
  platform: string;
}

export type InstallPromptOutcome = "accepted" | "dismissed" | "unavailable";

/**
 * Which branch the banner should render:
 *  - "hidden"  → already installed (standalone) or the user dismissed it.
 *  - "native"  → a real `beforeinstallprompt` event was captured → call
 *                `prompt()` to show the browser's install dialog.
 *  - "manual"  → no native prompt support on this browser (iOS Safari, desktop
 *                browsers without support) → show manual "add to home screen"
 *                instructions instead of silently doing nothing.
 */
export type InstallPromptVariant = "hidden" | "native" | "manual";

export interface ResolveInstallPromptVariantInput {
  /** Running in standalone / installed PWA display mode on load. */
  standalone: boolean;
  /** Fired any time after load (the `appinstalled` event). */
  installCompleted: boolean;
  /** Persisted "already installed on this browser" flag. A fresh
   *  `beforeinstallprompt` (captured as `deferredPrompt`) means the user has
   *  uninstalled since then, so the hook treats it as stale before this flag
   *  hides the banner again. */
  installCompletedPersisted?: boolean;
  /** Captured `beforeinstallprompt` event, if any. */
  deferredPrompt: BeforeInstallPromptEvent | null;
  /** Whether the user previously dismissed this tenant's banner. */
  dismissed: boolean;
}

export function resolveInstallPromptVariant({
  standalone,
  installCompleted,
  installCompletedPersisted = false,
  deferredPrompt,
  dismissed,
}: ResolveInstallPromptVariantInput): InstallPromptVariant {
  if (standalone || installCompleted || dismissed) {
    return "hidden";
  }
  // A fresh `beforeinstallprompt` only fires while the origin is NOT installed:
  // Chrome/Edge stop firing it once the app is on the device and start firing
  // it again right after the user uninstalls. A captured prompt is therefore
  // authoritative over any stale "installed" flag — without this, uninstalling
  // the app leaves the icon hidden forever because the persisted flag survives
  // in localStorage (desktop Chromium keeps origin storage in the browser
  // profile, so removing the app does not clear it).
  if (deferredPrompt) {
    return "native";
  }
  return installCompletedPersisted ? "hidden" : "manual";
}

export interface CheckStandaloneInput {
  /** `navigator.standalone` (iOS-only, boolean-ish). */
  navigatorStandalone?: unknown;
  /** `window.matchMedia("(display-mode: standalone)").matches`. */
  displayModeMatches?: boolean;
}

/**
 * Detect whether the page is already running as an installed PWA.
 *
 * Covers the standard `display-mode: standalone` media query plus the iOS-only
 * `navigator.standalone` flag (iOS Safari does not expose display-mode until
 * iOS 15.4+, so the legacy flag is still required for older devices).
 */
export function checkStandalone({
  navigatorStandalone,
  displayModeMatches,
}: CheckStandaloneInput = {}): boolean {
  const legacyIosFlag = typeof navigatorStandalone === "boolean"
    ? navigatorStandalone
    : !!navigatorStandalone;
  return legacyIosFlag || displayModeMatches === true;
}

/**
 * Best-effort iOS Safari detection for the manual-instructions copy.
 *
 * Covers real iPhones/iPods/iPads plus iPadOS, whose Safari reports a Mac
 * user agent ("Macintosh; Intel Mac OS X …") yet still lacks
 * `beforeinstallprompt`.
 */
export function isIosSafari(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent;
  const realIos = /iPhone|iPad|iPod/i.test(ua);
  const ipadOsLikeSafari =
    /Macintosh/i.test(ua) &&
    /Safari/i.test(ua) &&
    /Version\/\d+/i.test(ua) &&
    !/Chrome|CriOS|Edg\//i.test(ua);
  return realIos || ipadOsLikeSafari;
}

export const INSTALL_DISMISSAL_PREFIX = "install-app-dismissed:v1";

/**
 * localStorage key recording that the app was INSTALLED on this browser (not
 * dismissed). Chrome/Edge stop firing `beforeinstallprompt` once the origin is
 * installed, so without this flag the install icon would linger and route users
 * to the manual-instructions dialog even though they already have the app.
 * Unlike the dismissal flag (session-only), completion is persisted on purpose:
 * an installed app stays installed, so the icon must not come back.
 */
export const INSTALL_COMPLETED_PREFIX = "install-app-installed:v1";

/**
 * localStorage key that scopes the dismissal to ONE tenant, so a browser
 * shared by multiple tenants never hides the banner for a tenant that the
 * user has not dismissed.
 */
export function dismissalKeyFor(tenantScope: string): string {
  return `${INSTALL_DISMISSAL_PREFIX}:${tenantScope}`;
}

/**
 * Resolution of the dismissal scope: prefers the tenant slug (stable across
 * tenant rebrands), then falls back to the host the page is served from, and
 * finally to an inert default. `slug` is normalized to lowercase so a
 * "The-Mechanist" vs "the-mechanist" mismatch can never split the key.
 */
export function resolveInstallScope(
  slug: string | null | undefined,
  host: string | null | undefined,
): string {
  const value = slug?.trim().toLowerCase() || host?.trim().toLowerCase() || "platform";
  return value;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function hasInstallDismissal(
  storage: StorageLike | null | undefined,
  scope: string,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(dismissalKeyFor(scope)) === "1";
  } catch {
    return false;
  }
}

export function markInstallDismissed(
  storage: StorageLike | null | undefined,
  scope: string,
): void {
  if (!storage) return;
  try {
    storage.setItem(dismissalKeyFor(scope), "1");
  } catch {
    // localStorage can throw in private/blocked contexts; dismissal is best-effort.
  }
}

export function clearInstallDismissal(
  storage: StorageLike | null | undefined,
  scope: string,
): void {
  if (!storage) return;
  try {
    storage.removeItem(dismissalKeyFor(scope));
  } catch {
    // best-effort
  }
}

export function installCompletedKeyFor(scope: string): string {
  return `${INSTALL_COMPLETED_PREFIX}:${scope}`;
}

export function hasInstallCompletion(
  storage: StorageLike | null | undefined,
  scope: string,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(installCompletedKeyFor(scope)) === "1";
  } catch {
    return false;
  }
}

export function markInstallCompleted(
  storage: StorageLike | null | undefined,
  scope: string,
): void {
  if (!storage) return;
  try {
    storage.setItem(installCompletedKeyFor(scope), "1");
  } catch {
    // best-effort (private/blocked contexts)
  }
}

export function clearInstallCompletion(
  storage: StorageLike | null | undefined,
  scope: string,
): void {
  if (!storage) return;
  try {
    storage.removeItem(installCompletedKeyFor(scope));
  } catch {
    // best-effort
  }
}