<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\AvatarGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PublicStudentRegisterController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $tenant = currentTenant();

        if (! $tenant || $tenant->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant' => ['الأكاديمية غير متاحة.'],
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'parent_phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:8'],
            'password_confirmation' => ['required', 'string', 'same:password'],
            'gender' => ['nullable', 'string', 'max:20'],
            'study_type' => ['nullable', 'string', 'max:100'],
            'study_level' => ['nullable', 'string', 'max:100'],
            'governorate' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
        ]);

        $tenantId = $tenant->id;
        $phone = $validated['phone'] ?? null;

        if ($phone) {
            $existingMembership = TenantUser::query()
                ->where('tenant_id', $tenantId)
                ->where('phone', $phone)
                ->exists();

            if ($existingMembership) {
                throw ValidationException::withMessages([
                    'phone' => ['هذا الرقم مسجل بالفعل في هذه الأكاديمية.'],
                ]);
            }
        }

        $email = 'student_' . Str::random(16) . '@' . $tenant->slug . '.local';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'password' => Hash::make($validated['password']),
        ]);

        $avatar = AvatarGenerator::generate($validated['gender'] ?? null, $user->id);

        $membership = TenantUser::create([
            'tenant_id' => $tenantId,
            'user_id' => $user->id,
            'status' => 'active',
            'phone' => $phone,
            'parent_phone' => $validated['parent_phone'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'study_type' => $validated['study_type'] ?? null,
            'study_level' => $validated['study_level'] ?? null,
            'governorate' => $validated['governorate'] ?? null,
            'city' => $validated['city'] ?? null,
            'avatar' => $avatar,
            'joined_at' => now(),
        ]);

        $studentRole = Role::where('tenant_id', $tenantId)->where('slug', 'student')->first();
        if ($studentRole) {
            $membership->roles()->attach($studentRole->id, ['tenant_id' => $tenantId]);
        }

        $membership->load('roles.permissions');

        $accessToken = $user->createToken('access_token', ['access:api'], now()->addHours(24));
        $refreshToken = $user->createToken('refresh_token', ['refresh:token'], now()->addDays(30));

        $roles = $membership->roles;
        $permissions = $roles
            ->flatMap(fn ($role) => $role->permissions)
            ->unique('id')
            ->values();

        return response()->json([
            'message' => 'تم إنشاء حسابك بنجاح.',
            'access_token' => $accessToken->plainTextToken,
            'refresh_token' => $refreshToken->plainTextToken,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_super_admin' => false,
                'avatar' => $avatar,
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
                'can_access_dashboard' => true,
                'can_manage_courses' => false,
                'can_manage_users' => false,
                'can_manage_settings' => false,
            ],
            'navigation' => [],
            'subscription' => $tenant->subscription,
            'plan' => $tenant->plan,
            'feature_flags' => $tenant->feature_flags,
        ], 201);
    }
}
