"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

let gisLoadPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gis="true"]');
    if (existing) {
      // The script may have finished loading before this component mounted.
      if (existing.dataset.gisLoaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener(
        "load",
        () => {
          existing.dataset.gisLoaded = "true";
          resolve();
        },
        { once: true },
      );
      existing.addEventListener(
        "error",
        () => {
          gisLoadPromise = null;
          reject(new Error("GIS load failed"));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.gis = "true";
    script.onload = () => {
      script.dataset.gisLoaded = "true";
      resolve();
    };
    script.onerror = () => {
      gisLoadPromise = null;
      reject(new Error("GIS load failed"));
    };
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

interface GoogleAuthButtonProps {
  onToken: (accessToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  clientId?: string | null;
}

export function GoogleAuthButton({
  onToken,
  onError,
  disabled,
  label = "المتابعة عبر Google",
  className,
  clientId: clientIdProp,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [readyClientId, setReadyClientId] = useState<string | null>(null);
  const clientRef = useRef<{ requestAccessToken: (options?: { prompt?: string }) => void } | null>(null);
  const clientId =
    clientIdProp?.trim() || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;
  const ready = clientId !== null && readyClientId === clientId;

  useEffect(() => {
    if (!clientId) {
      clientRef.current = null;
      return;
    }
    let cancelled = false;
    loadGisScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.oauth2) return;
        clientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile https://www.googleapis.com/auth/user.birthday.read",
          callback: async (response) => {
            if (response.error || !response.access_token) {
              setLoading(false);
              onError?.("لم يتم إكمال تسجيل الدخول عبر Google.");
              return;
            }
            try {
              await onToken(response.access_token);
            } catch (e: unknown) {
              const message = e instanceof Error ? e.message : "";
              onError?.(message || "حدث خطأ أثناء تسجيل الدخول عبر Google.");
            } finally {
              setLoading(false);
            }
          },
          error_callback: () => {
            setLoading(false);
            onError?.("تعذر فتح نافذة Google. حاول مرة أخرى.");
          },
        });
        setReadyClientId(clientId);
      })
      .catch(() => {
        if (!cancelled) {
          clientRef.current = null;
          setReadyClientId(null);
          onError?.("تعذر تحميل خدمة Google.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, onError, onToken]);

  const handleClick = useCallback(() => {
    if (!clientId) {
      onError?.("تسجيل الدخول بجوجل غير مُفعّل حالياً.");
      return;
    }
    if (!clientRef.current) {
      onError?.("خدمة Google لم تجهز بعد. حاول مرة أخرى.");
      return;
    }
    setLoading(true);
    clientRef.current.requestAccessToken({ prompt: "select_account" });
  }, [clientId, onError]);

  if (!clientId) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/25 p-3 shadow-sm">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || !ready}
        aria-busy={loading || !ready}
        className={cn(
          "group flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border/70 bg-white px-4 text-sm font-semibold text-[#1f2937] shadow-sm transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60",
          className,
        )}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-2 2.9l3.2 2.5c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.4-.2-2H12z" />
              <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6C4.7 19.7 8.1 22 12 22z" />
              <path fill="#4A90E2" d="M6.4 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7V7.7H3.1C2.4 9 2 10.5 2 12s.4 3 1.1 4.3l3.3-2.6z" />
              <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.9 14.7 2 12 2 8.1 2 4.7 4.3 3.1 7.7l3.3 2.6c.8-2.4 3-4.5 5.6-4.5z" />
            </svg>
          </span>
        )}
        <span>{loading ? "جارٍ الاتصال بـ Google..." : label}</span>
      </button>
      <p className="mt-2 text-center text-[11px] leading-4 text-muted-foreground/60">
        طريقة سريعة وآمنة بدون الحاجة إلى كلمة مرور
      </p>
    </div>
  );
}
