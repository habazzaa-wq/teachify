<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Auth\PublicEmailVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PublicEmailVerificationController extends Controller
{
    public function verify(Request $request, PublicEmailVerificationService $verification): JsonResponse
    {
        $tenant = currentTenant();
        if (! $tenant || $tenant->status !== 'active') {
            throw ValidationException::withMessages(['tenant' => ['الأكاديمية غير متاحة.']]);
        }

        $validated = $request->validate([
            'email' => ['nullable', 'email', 'max:255'],
            'code' => ['nullable', 'string', 'max:20'],
            'token' => ['nullable', 'string', 'max:128'],
        ]);

        $code = trim((string) ($validated['code'] ?? ''));
        $token = trim((string) ($validated['token'] ?? ''));
        $email = mb_strtolower(trim((string) ($validated['email'] ?? '')));

        if ($token === '' && ($email === '' || $code === '')) {
            throw ValidationException::withMessages([
                'code' => ['يرجى إدخال رمز التفعيل أو استخدام رابط التفعيل.'],
            ]);
        }

        $user = $token !== ''
            ? $verification->verifyByToken($token, $email !== '' ? $email : null)
            : $verification->verifyByCode($tenant, $email, $code);

        $membership = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership) {
            throw ValidationException::withMessages([
                'email' => ['لم يتم العثور على عضوية الطالب في هذه الأكاديمية.'],
            ]);
        }

        $membership->load('roles.permissions');
        $user = $user->fresh();

        $accessToken = $user->createToken('access_token', ['access:api'], now()->addHours(24));
        $refreshToken = $user->createToken('refresh_token', ['refresh:token'], now()->addDays(30));

        $roles = $membership->roles;
        $permissions = $roles->flatMap(fn ($role) => $role->permissions)->unique('id')->values();

        return response()->json([
            'message' => 'تم تفعيل البريد الإلكتروني بنجاح.',
            'access_token' => $accessToken->plainTextToken,
            'refresh_token' => $refreshToken->plainTextToken,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_super_admin' => false,
                'avatar' => $membership->avatar ?? $user->avatar,
            ],
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status,
                'domain' => $tenant->getDefaultDomain(),
            ],
            'membership' => [
                'id' => $membership->id,
                'tenant_id' => $membership->tenant_id,
                'status' => $membership->status,
                'joined_at' => $membership->joined_at,
                'last_accessed_at' => $membership->last_accessed_at,
            ],
            'roles' => $roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])->values(),
            'permissions' => $permissions->map(fn ($permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'slug' => $permission->slug,
            ])->values(),
            'abilities' => [
                'can_access_dashboard' => false,
                'can_manage_courses' => false,
                'can_manage_users' => false,
                'can_manage_settings' => false,
            ],
            'navigation' => [],
            'subscription' => $tenant->subscription,
            'plan' => $tenant->plan,
            'feature_flags' => $tenant->feature_flags,
        ]);
    }

    public function resend(Request $request, PublicEmailVerificationService $verification): JsonResponse
    {
        $tenant = currentTenant();
        if (! $tenant || $tenant->status !== 'active') {
            throw ValidationException::withMessages(['tenant' => ['الأكاديمية غير متاحة.']]);
        }

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $user = $verification->findPendingUser($validated['email']);
        if (! $user) {
            throw ValidationException::withMessages(['email' => ['لم يتم العثور على حساب بهذا البريد الإلكتروني.']]);
        }
        if ($user->email_verified_at) {
            return response()->json(['message' => 'تم تفعيل البريد الإلكتروني بالفعل. يمكنك تسجيل الدخول.']);
        }

        $verification->resend($user, $tenant);

        return response()->json([
            'message' => 'تم إرسال رمز تفعيل جديد إلى بريدك الإلكتروني.',
            'verification_required' => true,
            'email' => mb_strtolower(trim($validated['email'])),
        ]);
    }
}
