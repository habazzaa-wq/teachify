import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeScript } from "@/components/ThemeScript";
import { TenantDocumentMeta } from "@/components/layout/TenantDocumentMeta";
import {
  getSiteDescription,
  getSiteName,
  getSiteTitleTemplate,
  getVerificationTokens,
} from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { getRequestOrigin, resolveAssetUrl } from "@/lib/seo/url";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, origin] = await Promise.all([getTenantSeoContext(), getRequestOrigin()]);
  const siteName = getSiteName(tenant);
  const description = getSiteDescription(tenant);
  const logo = resolveAssetUrl(tenant?.branding?.logo ?? null, origin);
  const verification = getVerificationTokens(tenant);

  return {
    metadataBase: new URL(origin),
    title: {
      default: siteName,
      template: getSiteTitleTemplate(tenant) ?? `%s | ${siteName}`,
    },
    description,
    robots: { index: true, follow: true },
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
      card: "summary",
      title: siteName,
      description,
    },
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
              <TenantDocumentMeta />
              {children}
            </AppProviders>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
