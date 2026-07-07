"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

function AppOfflineBanner() {
  const [online, setOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div
        className={cn(
          "fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-4 py-2.5 text-sm font-medium text-success shadow-lg backdrop-blur-xl animate-slide-up",
        )}
      >
        <RefreshCw className="h-4 w-4" />
        تمت إعادة الاتصال بالإنترنت
      </div>
    );
  }

  if (online) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-destructive/90 px-4 py-2 text-sm font-medium text-destructive-foreground backdrop-blur-xl animate-slide-down",
      )}
    >
      <WifiOff className="h-4 w-4" />
      لا يوجد اتصال بالإنترنت. بعض الميزات قد لا تعمل.
    </div>
  );
}

export { AppOfflineBanner };
