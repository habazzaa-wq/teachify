<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $primaryDomain = $this->domains->where('is_primary', true)->first();
        $plan = $this->plan ?? [];
        $limits = $this->limits ?? [];
        $planLimits = $plan['limits'] ?? [];

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description ?? '',
            'status' => $this->status,
            'domain' => $primaryDomain ? [
                'platformSubdomain' => $primaryDomain->subdomain ?? '',
                'customDomain' => $primaryDomain->type === 'custom' ? $primaryDomain->domain : null,
                'wildcard' => false,
                'sslStatus' => $primaryDomain->ssl_status ?? 'pending',
                'dnsStatus' => $primaryDomain->verified_at ? 'verified' : 'pending',
                'verificationStatus' => $primaryDomain->verified_at ? 'verified' : 'unverified',
            ] : [
                'platformSubdomain' => $this->slug,
                'customDomain' => null,
                'wildcard' => false,
                'sslStatus' => 'pending',
                'dnsStatus' => 'pending',
                'verificationStatus' => 'unverified',
            ],
            'domainHistory' => $this->domains->map(fn ($d) => [
                'id' => (string) $d->id,
                'domain' => $d->domain,
                'type' => $d->is_primary ? 'primary' : 'custom',
                'action' => $d->verified_at ? 'verified' : 'added',
                'timestamp' => $d->created_at->toIso8601String(),
            ])->toArray(),
            'owner' => $this->owner ?? ['name' => '', 'email' => '', 'phone' => ''],
            'ownerAccount' => $this->owner_account ? [
                'name' => $this->owner_account['name'] ?? '',
                'email' => $this->owner_account['email'] ?? '',
                'phone' => $this->owner_account['phone'] ?? '',
                'password' => $this->owner_account['password'] ?? '',
                'passwordChanged' => (bool) ($this->owner_account['password_changed'] ?? $this->owner_account['passwordChanged'] ?? false),
                'welcomeEmail' => (bool) ($this->owner_account['welcome_email'] ?? $this->owner_account['welcomeEmail'] ?? false),
                'twoFactorEnabled' => (bool) ($this->owner_account['two_factor_enabled'] ?? $this->owner_account['twoFactorEnabled'] ?? false),
                'status' => $this->owner_account['status'] ?? 'active',
            ] : [
                'name' => '', 'email' => '', 'phone' => '',
                'password' => '', 'passwordChanged' => false,
                'welcomeEmail' => false, 'twoFactorEnabled' => false,
                'status' => 'active',
            ],
            'address' => $this->address ?? [
                'street' => '', 'city' => '', 'state' => '',
                'country' => 'SA', 'zip' => '',
            ],
            'timezone' => $this->timezone ?? 'Asia/Riyadh',
            'language' => $this->language ?? 'ar',
            'currency' => $this->currency ?? 'SAR',
            'phone' => $this->phone ?? '',
            'subscription' => $this->subscription ? [
                'planId' => $this->subscription['plan_id'] ?? $this->subscription['planId'] ?? $plan['id'] ?? '',
                'planName' => $this->subscription['plan_name'] ?? $this->subscription['planName'] ?? $plan['name'] ?? '',
                'billingCycle' => $this->subscription['billing_cycle'] ?? $this->subscription['billingCycle'] ?? 'monthly',
                'renewal' => $this->subscription['renewal'] ?? '',
                'startDate' => $this->subscription['start_date'] ?? $this->subscription['startDate'] ?? '',
                'trialEndDate' => $this->subscription['trial_end_date'] ?? $this->subscription['trialEndDate'] ?? null,
                'status' => $this->subscription['status'] ?? $this->status,
                'price' => (float) ($this->subscription['price'] ?? $plan['price'] ?? 0),
                'currency' => $this->subscription['currency'] ?? 'SAR',
                'paymentMethod' => $this->subscription['payment_method'] ?? $this->subscription['paymentMethod'] ?? '—',
                'autoRenew' => (bool) ($this->subscription['auto_renew'] ?? $this->subscription['autoRenew'] ?? true),
                'invoices' => $this->subscription['invoices'] ?? [],
            ] : [
                'planId' => $plan['id'] ?? '',
                'planName' => $plan['name'] ?? '',
                'billingCycle' => 'monthly',
                'renewal' => '', 'startDate' => '', 'trialEndDate' => null,
                'status' => $this->status, 'price' => (float) ($plan['price'] ?? 0),
                'currency' => 'SAR',
                'paymentMethod' => '—', 'autoRenew' => true, 'invoices' => [],
            ],
            'limits' => [
                'storage' => (int) ($limits['storage'] ?? $planLimits['storage'] ?? 0),
                'storageUsed' => (int) ($limits['storageUsed'] ?? 0),
                'bandwidth' => (int) ($limits['bandwidth'] ?? $planLimits['bandwidth'] ?? 0),
                'bandwidthUsed' => (int) ($limits['bandwidthUsed'] ?? 0),
                'videos' => (int) ($limits['videos'] ?? $planLimits['videos'] ?? 0),
                'videosUsed' => (int) ($limits['videosUsed'] ?? 0),
                'courses' => (int) ($limits['courses'] ?? $planLimits['courses'] ?? 0),
                'coursesUsed' => (int) ($limits['coursesUsed'] ?? 0),
                'users' => (int) ($limits['users'] ?? $planLimits['users'] ?? 0),
                'usersUsed' => (int) ($limits['usersUsed'] ?? 0),
                'admins' => (int) ($limits['admins'] ?? $planLimits['admins'] ?? 0),
                'adminsUsed' => (int) ($limits['adminsUsed'] ?? 0),
                'teachers' => (int) ($limits['teachers'] ?? $planLimits['teachers'] ?? 0),
                'teachersUsed' => (int) ($limits['teachersUsed'] ?? 0),
                'students' => (int) ($limits['students'] ?? $planLimits['students'] ?? 0),
                'studentsUsed' => (int) ($limits['studentsUsed'] ?? 0),
                'apiRequests' => (int) ($limits['apiRequests'] ?? $planLimits['api_requests'] ?? 0),
                'apiRequestsUsed' => (int) ($limits['apiRequestsUsed'] ?? 0),
                'liveClasses' => (int) ($limits['liveClasses'] ?? $planLimits['live_classes'] ?? 0),
                'liveClassesUsed' => (int) ($limits['liveClassesUsed'] ?? 0),
                'certificates' => (int) ($limits['certificates'] ?? $planLimits['certificates'] ?? 0),
                'certificatesUsed' => (int) ($limits['certificatesUsed'] ?? 0),
                'assignments' => (int) ($limits['assignments'] ?? $planLimits['assignments'] ?? 0),
                'assignmentsUsed' => (int) ($limits['assignmentsUsed'] ?? 0),
                'quizzes' => (int) ($limits['quizzes'] ?? $planLimits['quizzes'] ?? 0),
                'quizzesUsed' => (int) ($limits['quizzesUsed'] ?? 0),
                'communities' => (int) ($limits['communities'] ?? $planLimits['communities'] ?? 0),
                'communitiesUsed' => (int) ($limits['communitiesUsed'] ?? 0),
            ],
            'branding' => $this->branding ? [
                'logo' => $this->branding['logo'] ?? null,
                'darkLogo' => $this->branding['dark_logo'] ?? null,
                'favicon' => $this->branding['favicon'] ?? null,
                'primaryColor' => $this->branding['primary_color'] ?? $this->branding['primaryColor'] ?? '#6366f1',
                'secondaryColor' => $this->branding['secondary_color'] ?? $this->branding['secondaryColor'] ?? '#8b5cf6',
                'accentColor' => $this->branding['accent_color'] ?? $this->branding['accentColor'] ?? '#f59e0b',
                'fonts' => $this->branding['fonts'] ?? 'Cairo',
                'loginBackground' => $this->branding['login_background'] ?? $this->branding['loginBackground'] ?? null,
                'emailBranding' => (bool) ($this->branding['email_branding'] ?? $this->branding['emailBranding'] ?? false),
                'whiteLabel' => (bool) ($this->branding['white_label'] ?? $this->branding['whiteLabel'] ?? false),
            ] : [
                'logo' => null, 'darkLogo' => null, 'favicon' => null,
                'primaryColor' => '#6366f1', 'secondaryColor' => '#8b5cf6',
                'accentColor' => '#f59e0b', 'fonts' => 'Cairo',
                'loginBackground' => null, 'emailBranding' => false,
                'whiteLabel' => false,
            ],
            'integrations' => $this->integrations_json ?? [
                'bunnyStorage' => 'not_configured', 'bunnyStream' => 'not_configured',
                'smtp' => 'not_configured', 'sso' => 'not_configured',
                'googleOAuth' => 'not_configured', 'zoom' => 'not_configured',
                'webhook' => 'not_configured', 'apiKeys' => 'not_configured',
            ],
            'notes' => $this->notes ?? '',
            'tags' => $this->tags ?? [],
            'revenue' => 0,
            'security' => $this->security ?? [
                'twoFactorEnabled' => false,
                'passwordLastChanged' => $this->created_at->toIso8601String(),
                'failedLogins' => 0, 'activeSessions' => 0,
                'trustedDevices' => 0, 'recoveryCodes' => false,
            ],
            'storage' => $this->storage_json ?? [
                'currentStorage' => 0, 'currentBandwidth' => 0, 'videosCount' => 0,
                'remainingStorage' => (int) ($planLimits['storage'] ?? 0),
                'remainingBandwidth' => (int) ($planLimits['bandwidth'] ?? 0),
            ],
            'activity' => [],
            'logs' => [],
            'recentLogins' => 0,
            'recentApiCalls' => 0,
            'companyName' => $this->company_name ?? '',
            'supportEmail' => $this->support_email ?? '',
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at->toIso8601String(),
            'lastActivity' => $this->updated_at->toIso8601String(),
            'lastLogin' => $this->created_at->toIso8601String(),
        ];
    }
}
