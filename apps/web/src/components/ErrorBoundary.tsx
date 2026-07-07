"use client";

import * as React from "react";
import { AppButton } from "@/components/ui/AppButton";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level React error boundary. Catches unexpected render errors and shows
 * an Arabic recovery UI. Validation/auth/network errors are handled at the API
 * layer (normalized to ApiError) and surfaced via toasts/state components.
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = (): void => {
    this.setState({ error: null });
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

    return (
      <div
        role="alert"
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">
            حدث خطأ غير متوقع
          </h1>
          <p className="text-sm text-muted-foreground">
            تعذّر عرض هذه الصفحة. يمكنك المحاولة مرة أخرى.
          </p>
        </div>
        <AppButton onClick={this.reset}>إعادة المحاولة</AppButton>
      </div>
    );
  }
}

export { ErrorBoundary };
