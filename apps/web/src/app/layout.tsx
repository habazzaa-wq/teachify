import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeScript } from "@/components/ThemeScript";
import { env } from "@/config/env";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { resolveAssetUrl, getRequestOrigin } from "@/lib/seo/url";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Tenant-aware PWA / iOS install metadata, derived from the same server-side
 * tenant context as the rest of the site (cached per request, no duplicate
 * resolution or branding fetch). Platform hosts fall back to app-name branding.
 */
export async function generateViewport(): Promise<Viewport> {
  const tenant = await getTenantSeoContext();
  const themeColor = tenant?.branding?.primaryColor?.trim() || "#ffffff";
  return { themeColor };
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantSeoContext();
  const origin = await getRequestOrigin();

  const siteName = tenant?.name?.trim() || env.appName;
  const appleIcon = resolveAssetUrl(
    tenant?.branding?.favicon ??
      tenant?.branding?.lightLogo ??
      tenant?.branding?.darkLogo ??
      tenant?.branding?.logo ??
      null,
    origin,
  );

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: "منصة إدارة التعلم — لوحة تحكم الأكاديمية",
    manifest: "/manifest.webmanifest",
    other: {
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": siteName,
    },
    icons: appleIcon
      ? {
          apple: [{ url: appleIcon }],
        }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const messages = await getMessages();
  const headersList = await headers();
  const serverHostname = headersList.get("x-hostname") ?? "";
  const tenantContextRaw = headersList.get("x-tenant-context");
  let tenantContext = null;

  if (tenantContextRaw) {
    try {
      tenantContext = JSON.parse(Buffer.from(tenantContextRaw, "base64").toString("utf-8"));
    } catch (e) {
      console.error("Failed to parse tenant context from header", e);
    }
  }

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full bg-background font-sans antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            <AppProviders 
              serverHostname={serverHostname}
              tenantContext={tenantContext}
            >
              {children}
            </AppProviders>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
