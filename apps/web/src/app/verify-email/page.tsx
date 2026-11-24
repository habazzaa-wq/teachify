"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, MailX } from "lucide-react";
import { publicRegisterService } from "@/features/auth/services/public-register.service";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const email = (searchParams.get("email") || "").trim();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const setTenantContext = useTenantStore((s) => s.setTenantContext);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("جارٍ التحقق من رابط التفعيل...");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      setMessage("رابط التفعيل غير صالح.");
      return;
    }

    (async () => {
      try {
        const response = await publicRegisterService.verifyEmail({
          token,
          email: email || undefined,
        });

        setTokens(response.access_token, response.refresh_token);
        setTenantContext({
          tenant: {
            ...response.tenant,
            feature_flags: response.feature_flags ?? null,
          } as any,
          membership: response.membership as any,
          roles: response.roles as any,
          permissions: response.permissions as any,
          abilities: response.abilities as any,
          navigation: response.navigation as any,
        });
        setUser(response.user as any);

        try {
          localStorage.setItem(
            "public-register-state",
            JSON.stringify({
              name: response.user.name,
              token: response.access_token,
              refreshToken: response.refresh_token,
              avatar: response.user.avatar ?? null,
            }),
          );
        } catch {}

        setStatus("success");
        setMessage("تم تفعيل بريدك الإلكتروني بنجاح. جارٍ تحويلك إلى حسابك...");
        setTimeout(() => router.replace("/student/dashboard"), 1200);
      } catch (err: any) {
        const msg =
          err?.fieldErrors?.token?.[0] ||
          err?.fieldErrors?.code?.[0] ||
          err?.fieldErrors?.email?.[0] ||
          err?.message ||
          "تعذر تفعيل البريد الإلكتروني. قد يكون الرابط منتهي الصلاحية.";
        setStatus("error");
        setMessage(msg);
      }
    })();
  }, [token, email, router, setTokens, setUser, setTenantContext]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16" dir="rtl">
      <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-8 text-center shadow-xl">
        {status === "loading" && (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        {status === "success" && (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
          </div>
        )}
        {status === "error" && (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-600">
            <MailX className="h-8 w-8" />
          </div>
        )}

        <h1 className="text-xl font-bold text-foreground">
          {status === "loading" ? "جارٍ تفعيل البريد" : status === "success" ? "تم التفعيل" : "تعذر التفعيل"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-7">{message}</p>

        {status === "error" && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="h-10 px-5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--brand-primary, #0f766e)" }}
            >
              الصفحة الرئيسية
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16" dir="rtl">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-8 text-center shadow-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-foreground">جارٍ تفعيل البريد</h1>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
