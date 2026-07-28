import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isDev && {
    allowedDevOrigins: ["academy.test", "*.academy.test"],
  }),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    if (!isDev) return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      {
        source: "/sanctum/:path*",
        destination: "http://localhost:8000/sanctum/:path*",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
