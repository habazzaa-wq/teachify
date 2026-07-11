import type { Metadata } from "next";
import { Cairo, Baloo_2 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeScript } from "@/components/ThemeScript";
import { env } from "@/config/env";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: env.appName,
  description: "منصة إدارة التعلم — لوحة تحكم الأكاديمية",
};

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
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${baloo.variable} h-full`} suppressHydrationWarning>
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
