"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, MailWarning } from "lucide-react";
import { invitationService } from "@/features/auth/services/invitation.service";
import { authService } from "@/services/api/auth.service";
import { tenantService } from "@/services/api/tenant.service";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import type { CurrentUserResponse } from "@/types/auth.types";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const email = (searchParams.get("email") || "").trim();

  const setAuthTokens = useAuthStore((s) => s.setTokens);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const setTenantContext = useTenantStore((s) => s.setTenantContext);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("رابط الدعوة غير صالح.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setMessage("كلمة المرور يجب ألا تقل عن 8 أحرف.");
      return;
    }
    if (password !== confirmation) {
      setStatus("error");
      setMessage("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setBusy(true);
    setStatus("form");
    setMessage("");
    try {
      await invitationService.accept({ token, name: name.trim(), password });

      const loginResult = await authService.login({ email, password });
      setAuthTokens(loginResult.access_token, loginResult.refresh_token);
      setAuthUser(loginResult.user);

      const loginData: CurrentUserResponse = {
        user: loginResult.user,
        tenant: loginResult.tenant,
        membership: loginResult.membership,
        roles: loginResult.roles,
        permissions: loginResult.permissions,
        abilities: loginResult.abilities,
        navigation: loginResult.navigation,
        subscription: loginResult.subscription,
        plan: loginResult.plan,
        feature_flags: loginResult.feature_flags,
      };
      const context = await tenantService.resolveFromLogin(loginData);
      setTenantContext({
        tenant: context.tenant,
        membership: context.membership,
        roles: context.roles,
        permissions: context.permissions,
        abilities: context.abilities,
        navigation: context.navigation,
      });

      localStorage.setItem(
        "public-register-state",
        JSON.stringify({
          name: loginResult.user.name,
          token: loginResult.access_token,
          refreshToken: loginResult.refresh_token,
          avatar: loginResult.user.avatar ?? null,
        }),
      );
      window.dispatchEvent(new Event("public-auth-updated"));

      setStatus("success");
      setMessage("تم قبول الدعوة وإنشاء حسابك بنجاح. جارٍ تحويلك إلى لوحة الطالب...");
      setTimeout(() => router.replace("/student/dashboard"), 1200);
    } catch (err: any) {
      setStatus("error");
      setMessage(
        err?.fieldErrors?.token?.[0] ||
          err?.fieldErrors?.password?.[0] ||
          err?.response?.data?.message ||
          err?.message ||
          "تعذر قبول الدعوة. قد يكون الرابط منتهي الصلاحية أو مستخدمًا بالفعل.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16" dir="rtl">
      <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-8 shadow-xl">
        {status === "success" ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold text-foreground">تم التفعيل</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{message}</p>
          </div>
        ) : status === "error" ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-600">
              <MailWarning className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold text-foreground">تعذر قبول الدعوة</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{message}</p>
            <button
              onClick={() => {
                setStatus("form");
                setMessage("");
              }}
              className="mt-6 h-10 w-full rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--brand-primary, #0f766e)" }}
            >
              المحاولة مرة أخرى
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-foreground">قبول الدعوة</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                أدخل اسمك وكلمة المرور لإنشاء حساب الطالب على {email || "بريدك الإلكتروني"}.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">الاسم الكامل</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">كلمة المرور</label>
                <input
                  id="password"
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmation" className="text-sm font-medium">تأكيد كلمة المرور</label>
                <input
                  id="confirmation"
                  type="password"
                  dir="ltr"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button
                type="submit"
                disabled={busy || !token}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "var(--brand-primary, #0f766e)" }}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                إنشاء الحساب وتفعيل الدعوة
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center" dir="rtl">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
