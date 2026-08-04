"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton, AppInput, Label } from "@/components/ui";
import { usePlatformLogin } from "@/hooks/usePlatformAuthMutations";
import { loginSchema, mapFieldErrors, type LoginSchema } from "@/lib/validation";

/**
 * Super admin login form bound with React Hook Form.
 *
 * Imported dynamically from the platform login route so react-hook-form stays
 * out of the shared base bundle and is only fetched when this form renders.
 */
export function PlatformLoginForm() {
  const login = usePlatformLogin();

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
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="platform-email" className="text-slate-200">
          Email
        </Label>
        <AppInput
          id="platform-email"
          type="email"
          autoComplete="email"
          dir="ltr"
          placeholder="admin@platform.com"
          className="border-slate-700 bg-slate-950 text-slate-50"
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
        <Label htmlFor="platform-password" className="text-slate-200">
          Password
        </Label>
        <AppInput
          id="platform-password"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          className="border-slate-700 bg-slate-950 text-slate-50"
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
        className="w-full bg-indigo-500 hover:bg-indigo-600"
        loading={login.isPending}
      >
        {login.isPending ? "Signing in…" : "Sign in"}
      </AppButton>
    </form>
  );
}
