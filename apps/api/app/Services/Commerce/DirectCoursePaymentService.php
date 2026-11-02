<?php

namespace App\Services\Commerce;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\WalletPayment;
use App\Services\Learning\EnrollmentService;
use Illuminate\Support\Facades\DB;

class DirectCoursePaymentService
{
    public function __construct(private readonly EnrollmentService $enrollments)
    {
    }

    public function complete(Tenant $tenant, WalletPayment $payment): void
    {
        DB::transaction(function () use ($tenant, $payment): void {
            $lockedPayment = WalletPayment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedPayment->isPaid()) {
                return;
            }

            $course = Course::query()
                ->where('tenant_id', $tenant->id)
                ->whereKey($lockedPayment->course_id)
                ->where('status', 'published')
                ->where('visibility', 'public')
                ->firstOrFail();
            $student = TenantUser::query()
                ->where('tenant_id', $tenant->id)
                ->whereKey($lockedPayment->tenant_user_id)
                ->where('status', 'active')
                ->firstOrFail();

            $alreadyEnrolled = CourseEnrollment::query()
                ->where('tenant_id', $tenant->id)
                ->where('course_id', $course->id)
                ->where('tenant_user_id', $student->id)
                ->where('status', 'active')
                ->exists();

            if (! $alreadyEnrolled) {
                $this->enrollments->enrollStudent($tenant, $course, $student, 'active', [
                    'payment_reference' => $lockedPayment->reference,
                    'amount_paid' => (float) $lockedPayment->amount,
                    'currency' => $lockedPayment->currency,
                ]);
            }

            $lockedPayment->update([
                'status' => WalletPayment::STATUS_PAID,
                'paid_at' => now(),
            ]);
        });
    }
}
