import { describe, expect, it } from "vitest";
import {
  checkStandalone,
  clearInstallCompletion,
  clearInstallDismissal,
  dismissalKeyFor,
  hasInstallCompletion,
  hasInstallDismissal,
  installCompletedKeyFor,
  isIosSafari,
  markInstallCompleted,
  markInstallDismissed,
  resolveInstallPromptVariant,
  resolveInstallScope,
  type BeforeInstallPromptEvent,
  type StorageLike,
} from "@/lib/pwa/install-prompt";
import { asInstallIosSteps } from "@/components/pwa/install-instructions";

function makePrompt(): BeforeInstallPromptEvent {
  return {
    prompt: () => Promise.resolve(),
    userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
  };
}

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe("resolveInstallPromptVariant", () => {
  const base = {
    standalone: false,
    installCompleted: false,
    deferredPrompt: null as BeforeInstallPromptEvent | null,
    dismissed: false,
  };

  it("hides the banner when the app is already running standalone", () => {
    expect(
      resolveInstallPromptVariant({ ...base, standalone: true }),
    ).toBe("hidden");
  });

  it("hides the banner once the app has been installed this session", () => {
    expect(
      resolveInstallPromptVariant({ ...base, installCompleted: true }),
    ).toBe("hidden");
  });

  it("hides the banner when the user dismissed it", () => {
    expect(
      resolveInstallPromptVariant({ ...base, dismissed: true }),
    ).toBe("hidden");
  });

  it("hides the banner when the app was installed on this browser previously", () => {
    expect(
      resolveInstallPromptVariant({ ...base, installCompletedPersisted: true }),
    ).toBe("hidden");
  });

  it("re-shows the native prompt when a stale persisted flag exists but a fresh beforeinstallprompt fired (app was uninstalled)", () => {
    expect(
      resolveInstallPromptVariant({
        ...base,
        installCompletedPersisted: true,
        deferredPrompt: makePrompt(),
      }),
    ).toBe("native");
  });

  it("shows the native-prompt path when a beforeinstallprompt event was captured", () => {
    expect(
      resolveInstallPromptVariant({
        ...base,
        deferredPrompt: makePrompt(),
      }),
    ).toBe("native");
  });

  it("shows the manual-instructions path when no native event is available", () => {
    expect(resolveInstallPromptVariant(base)).toBe("manual");
  });

  it("standalone + captured event still hides (already installed wins)", () => {
    expect(
      resolveInstallPromptVariant({
        ...base,
        standalone: true,
        deferredPrompt: makePrompt(),
      }),
    ).toBe("hidden");
  });
});

describe("checkStandalone", () => {
  it("detects display-mode: standalone", () => {
    expect(checkStandalone({ displayModeMatches: true })).toBe(true);
  });

  it("detects the iOS-only navigator.standalone flag (boolean)", () => {
    expect(checkStandalone({ navigatorStandalone: true })).toBe(true);
  });

  it("detects a truthy legacy navigator.standalone value", () => {
    expect(checkStandalone({ navigatorStandalone: 1 })).toBe(true);
  });

  it("returns false on a normal browser tab", () => {
    expect(
      checkStandalone({ navigatorStandalone: false, displayModeMatches: false }),
    ).toBe(false);
  });

  it("returns false with no signal", () => {
    expect(checkStandalone()).toBe(false);
  });
});

describe("isIosSafari", () => {
  it("detects iPhone Safari", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    expect(isIosSafari(ua)).toBe(true);
  });

  it("detects iPad Safari", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
    expect(isIosSafari(ua)).toBe(true);
  });

  it("detects iPadOS Safari that reports a Macintosh user agent", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
    expect(isIosSafari(ua)).toBe(true);
  });

  it("treats a Macintosh Safari Version UA as iOS-like (iPadOS ambiguity)", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
    expect(isIosSafari(ua)).toBe(true);
  });

  it("rejects non-iOS browsers (Android Chrome, desktop Chrome)", () => {
    expect(
      isIosSafari(
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36",
      ),
    ).toBe(false);
    expect(
      isIosSafari(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      ),
    ).toBe(false);
  });

  it("rejects undefined user agents", () => {
    expect(isIosSafari(undefined)).toBe(false);
    expect(isIosSafari(null)).toBe(false);
  });
});

describe("tenant-scoped dismissal storage", () => {
  it("keeps one tenant's dismissal key distinct from another", () => {
    expect(dismissalKeyFor("tenant-a")).not.toBe(dismissalKeyFor("tenant-b"));
    expect(dismissalKeyFor("tenant-a")).toContain("tenant-a");
  });

  it("persists a dismissal for one tenant without leaking to another", () => {
    const storage = new MemoryStorage();
    markInstallDismissed(storage, "tenant-a");

    expect(hasInstallDismissal(storage, "tenant-a")).toBe(true);
    expect(hasInstallDismissal(storage, "tenant-b")).toBe(false);
  });

  it("reports no dismissal when nothing was stored", () => {
    expect(hasInstallDismissal(new MemoryStorage(), "tenant-a")).toBe(false);
  });

  it("tolerates a null storage (private browsing / SSR)", () => {
    markInstallDismissed(null, "tenant-a");
    expect(hasInstallDismissal(null, "tenant-a")).toBe(false);
  });

  it("clears a previously stored dismissal", () => {
    const storage = new MemoryStorage();
    markInstallDismissed(storage, "tenant-a");
    clearInstallDismissal(storage, "tenant-a");
    expect(hasInstallDismissal(storage, "tenant-a")).toBe(false);
  });

  it("keeps the completion key distinct from the dismissal key", () => {
    expect(installCompletedKeyFor("tenant-a")).not.toBe(
      dismissalKeyFor("tenant-a"),
    );
  });

  it("persists install completion per scope without leaking to another", () => {
    const storage = new MemoryStorage();
    markInstallCompleted(storage, "tenant-a");

    expect(hasInstallCompletion(storage, "tenant-a")).toBe(true);
    expect(hasInstallCompletion(storage, "tenant-b")).toBe(false);
    expect(hasInstallDismissal(storage, "tenant-a")).toBe(false);
  });

  it("reports no completion when nothing was stored and tolerates null storage", () => {
    expect(hasInstallCompletion(new MemoryStorage(), "tenant-a")).toBe(false);
    markInstallCompleted(null, "tenant-a");
    expect(hasInstallCompletion(null, "tenant-a")).toBe(false);
  });

  it("clears a previously stored completion", () => {
    const storage = new MemoryStorage();
    markInstallCompleted(storage, "tenant-a");
    clearInstallCompletion(storage, "tenant-a");
    expect(hasInstallCompletion(storage, "tenant-a")).toBe(false);
  });

  it("prefers the tenant slug over the host and normalizes it", () => {
    expect(resolveInstallScope("  The-Mechanist  ", "the-mechanist.com")).toBe(
      "the-mechanist",
    );
    expect(resolveInstallScope(null, "tenant-b.example")).toBe(
      "tenant-b.example",
    );
    expect(resolveInstallScope(null, null)).toBe("platform");
  });
});

describe("manual instructions (no native prompt path)", () => {
  it("provides iOS Safari share/add-to-home-screen steps", () => {
    const steps = asInstallIosSteps(true);
    expect(steps).toHaveLength(3);
    expect(steps.join(" ")).toContain("إضافة إلى الشاشة الرئيسية");
  });

  it("provides a generic fallback for unsupported browsers", () => {
    const steps = asInstallIosSteps(false);
    expect(steps).toHaveLength(3);
    expect(steps.join(" ")).toContain("تثبيت التطبيق");
  });
});