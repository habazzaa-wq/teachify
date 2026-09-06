import type { Metadata, Viewport } from "next";
import { Almarai, Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeScript } from "@/components/ThemeScript";
import { BrandThemeSSR } from "@/components/layout/BrandThemeSSR";
import { TenantDocumentMeta } from "@/components/layout/TenantDocumentMeta";
import {
  getRobotsPolicy,
  getSiteDescription,
  getSiteName,
  getSiteTitleTemplate,
  getVerificationTokens,
  robotsRulesForPolicy,
} from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { getRequestOrigin, resolveAssetUrl } from "@/lib/seo/url";
import { buildPwaMetadata } from "@/lib/pwa/metadata";
import { resolveManifestColor } from "@/lib/pwa/manifest";
import { getFontCssUrl, buildFontStack } from "@/features/settings/constants/google-fonts";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

const almarai = Almarai({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700"],
  variable: "--font-display",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, origin] = await Promise.all([getTenantSeoContext(), getRequestOrigin()]);
  const siteName = getSiteName(tenant);
  const description = getSiteDescription(tenant);
  const logo = resolveAssetUrl(
    tenant?.seo?.ogImage ?? tenant?.branding?.logo ?? null,
    origin,
  );
  const twitterImage = resolveAssetUrl(tenant?.seo?.twitterImage ?? logo, origin);
  const verification = getVerificationTokens(tenant);

  return {
    metadataBase: new URL(origin),
    title: {
      default: siteName,
      template: getSiteTitleTemplate(tenant) ?? `%s | ${siteName}`,
    },
    description,
    robots: robotsRulesForPolicy(getRobotsPolicy(tenant)),
    ...(verification.google || verification.bing
      ? {
          verification: {
            ...(verification.google ? { google: verification.google } : {}),
            ...(verification.bing
              ? { other: { "msvalidate.01": verification.bing } }
              : {}),
          },
        }
      : {}),
    openGraph: {
      type: "website",
      locale: "ar_SA",
      siteName,
      title: siteName,
      description,
      url: origin,
      ...(logo
        ? { images: [{ url: logo, alt: siteName, width: 512, height: 512 }] }
        : {}),
    },
    twitter: {
      card: twitterImage ? "summary_large_image" : "summary",
      title: siteName,
      description,
      ...(twitterImage ? { images: [twitterImage] } : {}),
    },
    ...buildPwaMetadata(tenant, origin),
  };
}

export async function generateViewport(): Promise<Viewport> {
  const tenant = await getTenantSeoContext();
  return {
    themeColor: resolveManifestColor(tenant?.branding?.primaryColor),
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

  const tenant = await getTenantSeoContext();
  const tenantFont = tenant?.branding?.font ?? null;
  const fontCssUrl = getFontCssUrl(tenantFont);
  const fontStack = buildFontStack(tenantFont);

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${almarai.variable} h-full`}
      style={
        fontStack
          ? ({ "--font-sans": fontStack } as React.CSSProperties)
          : undefined
      }
      suppressHydrationWarning
    >
      <head>
        {fontCssUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link id="tenant-dynamic-font" rel="stylesheet" href={fontCssUrl} />
          </>
        )}
        <ThemeScript />
        {/* Brand colors server-rendered so the first paint is already correct
            (kills the ~1s flash of the globals.css fallback colors). */}
        <BrandThemeSSR />
      </head>
      <body className="min-h-full bg-background font-sans antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            <AppProviders 
              serverHostname={serverHostname}
              tenantContext={tenantContext}
            >
              <TenantDocumentMeta />
              {children}
            </AppProviders>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
