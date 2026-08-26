"use client";

import Link from "next/link";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useBrandColors } from "@/hooks/useBrandColors";

const DEVELOPER_WHATSAPP = "https://wa.me/201011245565";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function PublicFooter() {
  const theme = useUiStore((s) => s.theme);
  const { tenant } = useActiveTenant();
  const platformBranding = useTenantStore((s) => s.platformBranding);
  const { primary, secondary } = useBrandColors();

  const brandLogo = platformBranding?.logo ?? tenant?.branding?.logo ?? null;
  const logo = theme === "dark"
    ? platformBranding?.darkLogo ?? tenant?.branding?.dark_logo ?? brandLogo
    : platformBranding?.lightLogo ?? tenant?.branding?.light_logo ?? brandLogo;
  const tenantName = platformBranding?.name ?? tenant?.name ?? "أكاديميتي";

  return (
    <footer className="relative border-t bg-background/90 backdrop-blur-xl">
      {/* Soft brand hairline on the very top edge */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(to left, transparent, ${primary}45 25%, ${secondary}40 50%, ${primary}45 75%, transparent)`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 py-7 sm:flex-row sm:gap-6">
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-2.5">
            {logo ? (
              <Image
                src={logo}
                alt={tenantName}
                width={100}
                height={28}
                className="h-6 w-auto transition-opacity duration-300 group-hover:opacity-80"
              />
            ) : (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
                style={{ backgroundColor: primary }}
              >
                <GraduationCap className="h-4 w-4 text-white" />
              </span>
            )}
            <span className="text-base font-bold tracking-tight" style={{ color: primary }}>
              {tenantName}
            </span>
          </Link>

          {/* Credit + WhatsApp */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground/80">
              Developed by{" "}
              <span className="font-bold text-foreground">Mahmoud Habazza</span>
            </span>
            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="تواصل مع مطور المنصة عبر واتساب"
              title="تواصل عبر واتساب"
              className="group relative flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                backgroundColor: "#25D366",
                boxShadow: "0 4px 16px rgba(37,211,102,0.35)",
              }}
            >
              <span
                className="absolute -inset-[3px] rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ border: "2px solid rgba(37,211,102,0.45)" }}
              />
              <WhatsAppIcon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
