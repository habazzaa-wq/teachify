<?php

namespace App\Services\Community;

use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommunityExamGateService
{
    public function __construct(
        private readonly CommunitySettingService $settings,
    ) {}

    /**
     * Detect whether a member currently has an in-progress exam attempt
     * (either explicitly submitted or still running its timer).
     */
    public function isExamInProgress(TenantUser $member, Tenant $tenant): bool
    {
        return DB::table('exam_attempts')
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $member->user_id)
            ->whereNull('deleted_at')
            ->where(function ($query) {
                $query->where('status', 'in_progress')
                    ->orWhere(function ($timer) {
                        $timer->where('status', 'started')
                            ->whereNotNull('timer_ends_at')
                            ->where('timer_ends_at', '>', now());
                    });
            })
            ->exists();
    }

    /**
     * Enforce exam protection: block community access while an exam is active.
     *
     * @throws ValidationException
     */
    public function ensureNoActiveExam(TenantUser $member, Tenant $tenant): void
    {
        if (! $this->settings->forTenant($tenant)->exam_protection_enabled) {
            return;
        }

        if ($this->isExamInProgress($member, $tenant)) {
            throw ValidationException::withMessages([
                'community' => ['لا يمكنك دخول المنتدى أثناء أداء الامتحان.'],
            ]);
        }
    }
}
