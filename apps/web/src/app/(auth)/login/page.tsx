"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  AppButton,
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
  AppInput,
  Label,
} from "@/components/ui";
import { AuthLayout } from "@/layouts/AuthLayout";
import { useLogin } from "@/hooks";
import { loginSchema, mapFieldErrors, type LoginSchema } from "@/lib/validation";

function LoginPage() {
  const t = useTranslations("auth");
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
    } catch (error) {
      const apiError = error as {
        fieldErrors?: Record<string, string[]>;
        message?: string;
      };

      if (apiError?.fieldErrors) {
        const mapped = mapFieldErrors(apiError.fieldErrors);

        for (const [field, value] of Object.entries(mapped)) {
          setError(field as keyof LoginSchema, value);
        }
      }
      // Generic message already surfaced via the useLogin toast.
    }
  });

  return (
    <AuthLayout>
      <AppCard>
        <AppCardHeader className="text-center">
          <AppCardTitle>{t("loginTitle")}</AppCardTitle>
          <AppCardDescription>{t("loginSubtitle")}</AppCardDescription>
        </AppCardHeader>
        <AppCardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <AppInput
                id="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                placeholder="name@example.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <AppInput
                id="password"
                type="password"
                autoComplete="current-password"
                dir="ltr"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <AppButton
              type="submit"
              className="w-full"
              loading={login.isPending}
            >
              {login.isPending ? t("signingIn") : t("signIn")}
            </AppButton>
          </form>
        </AppCardContent>
      </AppCard>
    </AuthLayout>
  );
}

export default LoginPage;
