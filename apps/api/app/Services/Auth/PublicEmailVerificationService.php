<?php

namespace App\Services\Auth;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Mail\TenantMailService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PublicEmailVerificationService
{
    public function issue(User $user, Tenant $tenant): void
    {
        $code = (string) random_int(100000, 999999);
        $token = Str::random(64);

        $user->forceFill([
            'email_verification_code_hash' => hash('sha256', $code),
            'email_verification_token_hash' => hash('sha256', $token),
            'email_verification_expires_at' => now()->addMinutes(30),
            'email_verification_sent_at' => now(),
            'email_verification_tenant_id' => $tenant->id,
        ])->save();

        $this->send($user, $tenant, $code, $token);
    }

    public function resend(User $user, Tenant $tenant): void
    {
        $sentAt = $user->email_verification_sent_at;
        if ($sentAt && $sentAt->diffInSeconds(now()) < 60) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                response()->json(['message' => 'يرجى الانتظار دقيقة قبل إعادة إرسال رمز التفعيل.', 'errors' => ['email' => ['يرجى الانتظار دقيقة قبل إعادة إرسال رمز التفعيل.']]], 429)
            );
        }
        $this->issue($user, $tenant);
    }

    public function verifyByCode(Tenant $tenant, string $email, string $code): User
    {
        $user = $this->findPendingUser($email);
        $this->assertValid($user, $tenant);

        if (! hash_equals((string) $user->email_verification_code_hash, hash('sha256', trim($code)))) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'code' => ['رمز التفعيل غير صحيح.'],
            ]);
        }

        return $this->markVerified($user);
    }

    public function verifyByToken(string $token, ?string $email = null): User
    {
        $hash = hash('sha256', $token);
        $query = User::query()->where('email_verification_token_hash', $hash);
        if ($email) {
            $query->whereRaw('LOWER(email) = ?', [mb_strtolower(trim($email))]);
        }
        $user = $query->first();

        if (! $user) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'token' => ['رابط التفعيل غير صالح أو منتهي الصلاحية.'],
            ]);
        }

        $tenant = currentTenant();
        $this->assertValid($user, $tenant);

        return $this->markVerified($user);
    }

    public function findPendingUser(string $email): ?User
    {
        return User::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower(trim($email))])
            ->first();
    }

    private function assertValid(?User $user, ?Tenant $tenant): void
    {
        if (! $user) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => ['لم يتم العثور على حساب بهذا البريد الإلكتروني.'],
            ]);
        }
        if ($user->email_verified_at) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => ['تم تفعيل هذا البريد الإلكتروني بالفعل. يمكنك تسجيل الدخول.'],
            ]);
        }
        if (! $user->email_verification_code_hash || ! $user->email_verification_expires_at) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => ['لا يوجد طلب تفعيل نشط. يرجى إعادة التسجيل أو طلب رمز جديد.'],
            ]);
        }
        if ($user->email_verification_expires_at->isPast()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'code' => ['انتهت صلاحية رمز التفعيل. يرجى طلب رمز جديد.'],
            ]);
        }
        if ($tenant && $user->email_verification_tenant_id && (int) $user->email_verification_tenant_id !== (int) $tenant->id) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => ['طلب التفعيل غير مرتبط بهذه الأكاديمية.'],
            ]);
        }
    }

    private function markVerified(User $user): User
    {
        $user->forceFill([
            'email_verified_at' => now(),
            'email_verification_code_hash' => null,
            'email_verification_token_hash' => null,
            'email_verification_expires_at' => null,
            'email_verification_sent_at' => null,
            'email_verification_tenant_id' => null,
        ])->save();

        return $user->fresh();
    }

    private function send(User $user, Tenant $tenant, string $code, string $token): void
    {
        $email = $user->email;
        if (! filled($email)) return;

        $frontendDomain = $tenant->getDefaultDomain() ?: request()->getHost();
        $scheme = request()->getScheme() ?: 'https';
        $verifyUrl = $scheme . '://' . $frontendDomain . '/verify-email?token=' . urlencode($token) . '&email=' . urlencode($email);
        $tenantName = $tenant->name ?? 'الأكاديمية';
        $subject = 'تفعيل بريدك الإلكتروني - ' . $tenantName;
        $html = $this->renderHtml($tenantName, $user->name ?: 'طالبنا', $code, $verifyUrl);

        app(TenantMailService::class)->sendHtml($tenant, $email, $subject, $html);
    }

    private function renderHtml(string $tenantName, string $userName, string $code, string $verifyUrl): string
    {
        $safeTenant = e($tenantName);
        $safeName = e($userName);
        $safeCode = e($code);
        $safeUrl = e($verifyUrl);

        return <<<HTML
<div dir="rtl" style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,'Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e7eaf3;box-shadow:0 10px 30px rgba(17,24,39,0.06);">
    <div style="padding:32px 28px;background:linear-gradient(135deg,#111827 0%,#1f2937 55%,#0f766e 100%);color:#ffffff;">
      <div style="font-size:13px;opacity:.85;letter-spacing:.3px;">{$safeTenant}</div>
      <h1 style="margin:10px 0 0;font-size:28px;line-height:1.35;font-weight:700;">تفعيل بريدك الإلكتروني</h1>
      <p style="margin:12px 0 0;font-size:15px;line-height:1.8;opacity:.92;">مرحبًا {$safeName}، خطوة واحدة بسيطة وتكون جاهزًا للبدء.</p>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 18px;color:#374151;font-size:15px;line-height:1.9;">
        شكرًا لتسجيلك في <strong style="color:#111827;">{$safeTenant}</strong>. لتأكيد حسابك وحماية بياناتك، يرجى تفعيل بريدك الإلكتروني باستخدام الكود التالي أو الضغط على زر التفعيل.
      </p>

      <div style="margin:22px 0;padding:22px;border-radius:16px;background:#f8fafc;border:1px dashed #cbd5e1;text-align:center;">
        <div style="font-size:13px;color:#64748b;margin-bottom:10px;">رمز التفعيل</div>
        <div style="font-size:34px;letter-spacing:8px;font-weight:800;color:#111827;direction:ltr;">{$safeCode}</div>
        <div style="font-size:12px;color:#64748b;margin-top:10px;">صالح لمدة 30 دقيقة</div>
      </div>

      <div style="text-align:center;margin:26px 0;">
        <a href="{$safeUrl}" style="display:inline-block;padding:14px 28px;border-radius:12px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">تفعيل الحساب الآن</a>
      </div>

      <p style="margin:0 0 10px;color:#6b7280;font-size:13px;line-height:1.8;text-align:center;">
        أو انسخ الرابط التالي في المتصفح:
      </p>
      <div style="padding:12px 14px;border-radius:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#374151;font-size:12px;line-height:1.7;word-break:break-all;direction:ltr;text-align:left;">
        {$safeUrl}
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.8;">
        إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان. لن يتم تفعيل الحساب بدون هذا الرمز أو الرابط.
      </p>
    </div>
  </div>
</div>
HTML;
    }
}
