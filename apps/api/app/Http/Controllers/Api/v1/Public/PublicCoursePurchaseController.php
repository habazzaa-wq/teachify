<?php

namespace App\Http\Controllers\Api\v1\Public;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\Learning\EnrollmentService;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;

class PublicCoursePurchaseController extends Controller
{
    public function __construct(
        private readonly WalletService $walletService,
        private readonly EnrollmentService $enrollments,
    ) {
    }

    /**
     * Self-service purchase of a public course using the student's wallet.
     * The wallet is debited and the student is enrolled in a single transaction.
     */
    public function store(string $slug): JsonResponse
    {
        $tenant = currentTenant();
        $student = currentTenantUser();

        abort_if(! $student, 401, 'يجب تسجيل الدخول أولاً.');

        $course = Course::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->firstOrFail();

        $result = $this->walletService->purchaseCourse($tenant, $course, $student, $this->enrollments);

        return response()->json([
            'message' => $result['amount'] > 0
                ? 'تم شراء الدورة بنجاح.'
                : 'تم الاشتراك في الدورة بنجاح.',
            'enrolled' => true,
            'enrollment' => $result['enrollment'],
            'amount' => $result['amount'],
            'balance' => $result['balance'],
        ], 201);
    }
}
