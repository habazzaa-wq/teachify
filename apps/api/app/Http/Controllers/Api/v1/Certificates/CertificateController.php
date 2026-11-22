<?php

namespace App\Http\Controllers\Api\v1\Certificates;

use App\Http\Controllers\Controller;
use App\Models\IssuedCertificate;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Certificates\CertificateIssuanceService;
use Illuminate\Http\JsonResponse;

class CertificateController extends Controller
{
    public function index(): JsonResponse
    {
        $query = IssuedCertificate::query()->with(['course', 'student.user', 'template', 'verification']);
        $authorization = app(TenantAuthorizationService::class);
        $user = request()->user();
        $tenant = currentTenant();

        if ($authorization->hasRole($user, $tenant, 'tenant_owner') || $authorization->hasRole($user, $tenant, 'admin')) {
            return response()->json(['certificates' => $query->latest('issued_at')->paginate(25)]);
        }

        if ($authorization->hasRole($user, $tenant, 'instructor')) {
            $membership = $authorization->membershipFor($user, $tenant);

            abort_unless($membership && $membership->status === 'active', 403);

            $query->whereHas('course', function ($query) use ($membership): void {
                $query
                    ->where('created_by_tenant_user_id', $membership->id)
                    ->orWhere('primary_instructor_tenant_user_id', $membership->id)
                    ->orWhereHas('instructors', function ($query) use ($membership): void {
                        $query->where('tenant_user_id', $membership->id);
                    });
            });

            return response()->json(['certificates' => $query->latest('issued_at')->paginate(25)]);
        }

        abort(403);
    }

    public function me(): JsonResponse
    {
        $authorization = app(TenantAuthorizationService::class);
        abort_unless($authorization->hasRole(request()->user(), currentTenant(), 'student'), 403);

        return response()->json([
            'certificates' => IssuedCertificate::query()
                ->with(['course', 'student.user', 'template', 'verification', 'completion'])
                ->where('tenant_user_id', app(TenantUser::class)->id)
                ->latest('issued_at')
                ->get(),
        ]);
    }

    public function show(IssuedCertificate $certificate): JsonResponse
    {
        abort_if($certificate->tenant_id !== currentTenant()->id, 404);

        $user = request()->user();
        $tenant = currentTenant();
        $authorization = app(TenantAuthorizationService::class);
        $membership = app(TenantUser::class);

        $isOwner = $membership && $certificate->tenant_user_id === $membership->id;
        $canManage = $authorization->hasRole($user, $tenant, 'tenant_owner')
            || $authorization->hasRole($user, $tenant, 'admin')
            || (
                $authorization->hasRole($user, $tenant, 'instructor')
                && $authorization->hasPermission($user, $tenant, 'certificates.view')
            );

        abort_unless($isOwner || $canManage, 403);

        $certificate->load(['course', 'student.user', 'template', 'verification', 'completion']);

        return response()->json(['certificate' => $certificate]);
    }

    public function revoke(IssuedCertificate $certificate, CertificateIssuanceService $certificates): JsonResponse
    {
        abort_if($certificate->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canRevoke(request()->user()), 403);

        $certificate = $certificates->revoke($certificate);

        return response()->json([
            'message' => 'Certificate revoked.',
            'certificate' => $certificate,
        ]);
    }

    private function canRevoke(User $user): bool
    {
        $authorization = app(TenantAuthorizationService::class);
        $tenant = currentTenant();

        return (
            $authorization->hasRole($user, $tenant, 'tenant_owner')
            || $authorization->hasRole($user, $tenant, 'admin')
        ) && $authorization->hasPermission($user, $tenant, 'courses.update');
    }
}
