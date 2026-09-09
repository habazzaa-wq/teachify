"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/cn";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  error: Error | null;
  globalError: string | null;
}

/**
 * Top-level React error boundary. Catches unexpected render errors and shows
 * an Arabic recovery UI. Validation/auth/network errors are handled at the API
 * layer (normalized to ApiError) and surfaced via toasts/state components.
 *
 * The underlying error is never shown by default, but a "تفاصيل تقنية" toggle
 * exposes message + stack (and the last captured window/rejection error) so
 * unreproducible crashes can be diagnosed from a single screen.
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, globalError: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, globalError: null };
  }

  private onError = (event: ErrorEvent): void => {
    if (this.state.globalError) return;
    this.setState({ globalError: event.message ?? String(event.error) });
  };

  private onUnhandled = (event: PromiseRejectionEvent): void => {
    if (this.state.globalError) return;
    const reason = event.reason;
    this.setState({
      globalError:
        reason instanceof Error ? reason.message : String(reason),
    });
  };

  override componentDidMount(): void {
    window.addEventListener("error", this.onError);
    window.addEventListener("unhandledrejection", this.onUnhandled);
  }

  override componentWillUnmount(): void {
    window.removeEventListener("error", this.onError);
    window.removeEventListener("unhandledrejection", this.onUnhandled);
  }

  reset = (): void => {
    this.setState({ error: null, globalError: null });
  };

  override render(): React.ReactNode {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    const Fallback = this.props.fallback;

    if (Fallback) {
      return <Fallback error={error} reset={this.reset} />;
    }

    return <FallbackScreen error={error} globalError={this.state.globalError} onReset={this.reset} />;
  }
}

function FallbackScreen({
  error,
  globalError,
  onReset,
}: {
  error: Error;
  globalError: string | null;
  onReset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const message = error.message || globalError || "خطأ JavaScript غير معروف";
  const stack =
    error.stack ||
    (globalError ? `global: ${globalError}` : "لا يوجد stack متاح");

  const copyDetails = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(
        `${message}\n\n${stack}`.replace(/\n{3,}/g, "\n\n"),
      );
    } catch {
      // clipboard unavailable — the text is already visible on screen
    }
  };

  return (
    <div
      role="alert"
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-muted-foreground">
          تعذّر عرض هذه الصفحة. يمكنك المحاولة مرة أخرى.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <AppButton onClick={onReset}>إعادة المحاولة</AppButton>
        <button
          type="button"
          onClick={() => setShowDetails((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", showDetails && "rotate-180")}
          />
          {showDetails ? "إخفاء التفاصيل التقنية" : "تفاصيل تقنية"}
        </button>
      </div>

      {showDetails && (
        <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-4 text-start">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-foreground">تفاصيل الخطأ</p>
            <button
              type="button"
              onClick={() => void copyDetails()}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
              نسخ
            </button>
          </div>
          <pre
            dir="ltr"
            className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground/80"
          >
            {message}

            {stack}
          </pre>
        </div>
      )}
    </div>
  );
}

export { ErrorBoundary };
