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
import {
  getFontCssUrl,
  buildFontStack,
  resolveTenantFont,
} from "@/features/settings/constants/google-fonts";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo-local",
  display: "swap",
});

const almarai = Almarai({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700"],
  // Keep the bundled face under its own variable. `--font-display` is a
  // semantic slot that follows the tenant font (see below); using it here
  // made Almarai circular once a font was selected.
  variable: "--font-almarai-local",
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
  const savedTheme = headersList
    .get("cookie")
    ?.match(/(?:^|;\s*)teachify-theme=(dark|light)(?:;|$)/)?.[1];
  const initialTheme = savedTheme === "dark" ? "dark" : "light";
  const tenantContextRaw = headersList.get("x-tenant-context");
  let tenantContext = null;

  if (tenantContextRaw) {
    try {
      tenantContext = JSON.parse(Buffer.from(tenantContextRaw, "base64").toString("utf-8"));
    } catch (e) {
      console.error("Failed to parse tenant context from header", e);
    }
  }

  const [tenant, origin] = await Promise.all([getTenantSeoContext(), getRequestOrigin()]);
  const faviconUrl = resolveAssetUrl(tenant?.branding?.favicon ?? null, origin);
  // One font for every surface: the site editor mirrors the value into both
  // branding rows, but accept either shape so a legacy/default payload still
  // renders the tenant's choice on the public site.
  const tenantFont = resolveTenantFont(
    tenant?.branding,
    tenant?.platform_branding,
    tenant?.platformBranding,
  );
  const fontCssUrl = getFontCssUrl(tenantFont);
  const fontStack =
    buildFontStack(tenantFont) ??
    'var(--font-cairo-local), "Cairo", "system-ui", "sans-serif"';

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${almarai.variable} h-full theme-initializing${initialTheme === "dark" ? " dark" : ""}`}
      data-theme={initialTheme}
      data-tenant-font={tenantFont ? "true" : undefined}
      style={
        {
          "--font-sans": fontStack,
          // Headings use the same face once the teacher picks one; without a
          // saved font keep the built-in display face as before.
          "--font-display": tenantFont
            ? fontStack
            : 'var(--font-almarai-local), "Almarai", "system-ui", "sans-serif"',
          colorScheme: initialTheme,
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <head>
        {/* The chosen favicon must be in the first HTML response. Creating it
            only after hydration made the browser tab icon change ~0.5s in. */}
        {faviconUrl && (
          <link id="tenant-favicon" rel="icon" href={faviconUrl} />
        )}
        {fontCssUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
              id="tenant-dynamic-font"
              rel="stylesheet"
              href={fontCssUrl}
              fetchPriority="high"
            />
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
              tenantContext={tenantContext ?? tenant}
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
