import { getRequestConfig } from "next-intl/server";

export const locales = ["ar"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "ar";

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
