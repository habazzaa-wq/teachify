<?php

namespace App\Jobs\Mail;

use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Queue\Middleware\SetCorrelationContext;
use App\Queue\Middleware\SetTenantContext;
use App\Services\Mail\TenantMailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendStudentInvitationMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct(
        public int $tenantId,
        public int $invitationId,
        public string $token,
    ) {
        $this->onQueue('notifications');
    }

    public function middleware(): array
    {
        return [new SetTenantContext($this->tenantId), new SetCorrelationContext()];
    }

    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function handle(TenantMailService $mail): void
    {
        $tenant = Tenant::withoutGlobalScopes()->find($this->tenantId);
        $invitation = TenantInvitation::query()
            ->where('id', $this->invitationId)
            ->where('tenant_id', $this->tenantId)
            ->first();

        if (! $tenant || ! $invitation || $invitation->status !== 'pending') {
            return;
        }

        $email = $invitation->email;
        if (! filled($email)) {
            return;
        }

        $tenantName = $tenant->name ?: 'المنصة';
        $acceptUrl = 'https://'.$tenant->getDefaultDomain()
            .'/accept-invitation?token='.urlencode($this->token)
            .'&email='.urlencode($email);
        $expiresAt = $invitation->expires_at?->translatedFormat('d M Y') ?: '—';
        $subject = 'دعوة للانضمام إلى '.$tenantName;
        $html = $this->renderHtml($tenantName, $email, $acceptUrl, $expiresAt);

        $mail->sendHtml($tenant, $email, $subject, $html);
    }

    public function failed(Throwable $exception): void
    {
        Log::warning('student_invitation.email_failed', [
            'tenant_id' => $this->tenantId,
            'invitation_id' => $this->invitationId,
            'error' => $exception->getMessage(),
        ]);
    }

    private function renderHtml(string $tenantName, string $email, string $acceptUrl, string $expiresAt): string
    {
        $safeTenant = e($tenantName);
        $safeEmail = e($email);
        $safeUrl = e($acceptUrl);
        $safeExpiry = e($expiresAt);

        return <<<HTML
<div dir="rtl" style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,'Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e7eaf3;box-shadow:0 10px 30px rgba(17,24,39,0.06);">
    <div style="padding:32px 28px;background:linear-gradient(135deg,#111827 0%,#1f2937 55%,#0f766e 100%);color:#ffffff;">
      <div style="font-size:13px;opacity:.85;">{$safeTenant}</div>
      <h1 style="margin:10px 0 0;font-size:28px;line-height:1.35;">دعوة للانضمام</h1>
      <p style="margin:12px 0 0;font-size:15px;line-height:1.8;opacity:.92;">تمت دعوتك لإنشاء حساب طالب في {$safeTenant}.</p>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 18px;color:#374151;font-size:15px;line-height:1.9;">
        مرحبًا، تم إرسال هذه الدعوة إلى <strong dir="ltr" style="color:#111827;">{$safeEmail}</strong>. اضغط على الزر أدناه لاختيار اسمك وكلمة المرور وتفعيل حسابك.
      </p>
      <div style="text-align:center;margin:26px 0;">
        <a href="{$safeUrl}" style="display:inline-block;padding:14px 28px;border-radius:12px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">قبول الدعوة وإنشاء الحساب</a>
      </div>
      <p style="margin:0 0 10px;color:#6b7280;font-size:13px;line-height:1.8;text-align:center;">أو انسخ الرابط التالي في المتصفح:</p>
      <div style="padding:12px 14px;border-radius:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#374151;font-size:12px;line-height:1.7;word-break:break-all;direction:ltr;text-align:left;">{$safeUrl}</div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.8;">صالحة حتى {$safeExpiry}. إذا لم تكن أنت من طلب هذه الدعوة، يمكنك تجاهل هذه الرسالة.</p>
    </div>
  </div>
</div>
HTML;
    }
}
