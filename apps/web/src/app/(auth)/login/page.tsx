"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui";
import { AuthLayout } from "@/layouts/AuthLayout";

const EmailLoginForm = dynamic(
  () => import("@/features/auth/components/email-login-form").then((m) => m.EmailLoginForm),
);

function LoginPage() {
  const t = useTranslations("auth");

  return (
    <AuthLayout>
      <AppCard>
        <AppCardHeader className="text-center">
          <AppCardTitle>{t("loginTitle")}</AppCardTitle>
          <AppCardDescription>{t("loginSubtitle")}</AppCardDescription>
        </AppCardHeader>
        <AppCardContent>
          <EmailLoginForm />
        </AppCardContent>
      </AppCard>
    </AuthLayout>
  );
}

export default LoginPage;
