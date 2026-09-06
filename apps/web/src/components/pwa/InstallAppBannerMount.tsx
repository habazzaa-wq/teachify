"use client";

import dynamic from "next/dynamic";

const InstallAppBanner = dynamic(
  () =>
    import("@/components/pwa/InstallAppBanner").then((m) => m.InstallAppBanner),
  { ssr: false },
);

export function InstallAppBannerMount() {
  return <InstallAppBanner />;
}