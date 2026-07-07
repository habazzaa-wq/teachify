"use client";

import { Shield } from "lucide-react";

function PlatformAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 text-slate-50"
    >
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
          <Shield className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Platform Super Admin
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            إدارة المنصة · Platform Administration
          </p>
        </div>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export { PlatformAuthLayout };
