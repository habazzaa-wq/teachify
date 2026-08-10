"use client";

import { Wallet, Loader2 } from "lucide-react";
import { useWallet } from "../hooks";
import { formatCurrency } from "@/lib/format";

const secondaryContrast = "var(--brand-secondary-contrast)";

export function WalletBalanceBadge({ onClick }: { onClick?: () => void }) {
  const { data, isLoading } = useWallet(true);
  const balance = data?.balance ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      title="رصيد المحفظة"
      aria-label="رصيد المحفظة"
      className="group relative flex h-8 items-center gap-1.5 rounded-full px-2.5 transition-all duration-300 hover:scale-[1.03] active:scale-95"
      style={{
        border: `1px solid var(--brand-secondary)`,
        background: `var(--brand-secondary)`,
        boxShadow: `0 2px 10px rgba(0,0,0,0.145)`,
      }}
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{
          background: `var(--brand-primary)`,
          boxShadow: `0 2px 8px rgba(0,0,0,0.314)`,
        }}
      >
        <Wallet className="h-3 w-3 text-white" />
      </span>
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: secondaryContrast }} />
      ) : (
        <span className="text-xs font-bold whitespace-nowrap text-[var(--brand-secondary-contrast)]">
          {formatCurrency(balance)}
        </span>
      )}
    </button>
  );
}
