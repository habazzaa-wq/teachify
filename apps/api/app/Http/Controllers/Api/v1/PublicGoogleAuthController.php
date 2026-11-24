<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Auth\GoogleAuthService;
use App\Services\AvatarGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PublicGoogleAuthController extends Controller
{
    private const COMPLETION_TTL_MINUTES = 15;

    public function __construct(private readonly GoogleAuthService $google)
    {
    }

    public function authenticate(Request $request): JsonResponse
    {
        $tenant = $this->resolveTenant();

        $validated = $request->validate([
            'access_token' => ['required', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $profile = $this->google->profileFromAccessToken($validated['access_token']);
        $phone = $this->normalizePhone($validated['phone'] ?? null);

        $user = $this->findLinkedUser($profile['sub'], $profile['email']);

        if ($user) {
            $membership = TenantUser::query()
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->first();

            $effectivePhone = $phone ?: ($membership?->phone ?: $user->phone);

            if (! $effectivePhone) {
                return $this->needsPhoneResponse($tenant, $profile, $user, $membership);
            }

            if ($phone) {
                $this->assertPhoneAvailable($tenant, $phone, $user->id);
            }

            $user = $this->syncGoogleUser($user, $profile);
            $membership = $this->ensureMembership($tenant, $user, $effectivePhone, $profile);

            return $this->authenticatedResponse($tenant, $user, $membership, 'تم تسجيل الدخول بنجاح.');
        }

        if (! $phone) {
            return $this->needsPhoneResponse($tenant, $profile, null, null);
        }

        $this->assertPhoneAvailable($tenant, $phone, null);
        $this->assertEmailAvailable($profile['email'], null);

        $user = $this->createGoogleUser($profile);
        $membership = $this->createMembership($tenant, $user, $phone, $profile);

        return $this->authenticatedResponse($tenant, $user, $membership, 'تم إنشاء حسابك بنجاح.');
    }

    public function complete(Request $request): JsonResponse
    {
        $tenant = $this->resolveTenant();

        $validated = $request->validate([
            'completion_token' => ['required', 'string'],
            'phone' => ['required', 'string', 'max:50'],
            'email_notifications_enabled' => ['nullable', 'boolean'],
        ]);

        $phone = $this->normalizePhone($validated['phone']);
        if (! $phone) {
            throw ValidationException::withMessages(['phone' => ['رقم الهاتف مطلوب.']]);
        }

        $payload = Cache::pull($this->completionCacheKey($validated['completion_token']));
        if (! is_array($payload)) {
            throw ValidationException::withMessages([
                'completion_token' => ['انتهت صلاحية جلسة تسجيل الدخول بجوجل. حاول مرة أخرى.'],
            ]);
        }

        if ((int) ($payload['tenant_id'] ?? 0) !== (int) $tenant->id) {
            throw ValidationException::withMessages([
                'completion_token' => ['جلسة تسجيل الدخول غير صالحة لهذه الأكاديمية.'],
            ]);
        }

        $profile = $payload['profile'] ?? null;
        if (! is_array($profile) || empty($profile['email']) || empty($profile['sub'])) {
            throw ValidationException::withMessages([
                'completion_token' => ['بيانات جلسة Google غير صالحة. حاول مرة أخرى.'],
            ]);
        }

        $existingUserId = isset($payload['user_id']) ? (int) $payload['user_id'] : null;
        $user = $existingUserId ? User::query()->find($existingUserId) : $this->findLinkedUser((string) $profile['sub'], (string) $profile['email']);

        $this->assertPhoneAvailable($tenant, $phone, $user?->id);

        if ($user) {
            $user = $this->syncGoogleUser($user, $profile);
            $membership = $this->ensureMembership($tenant, $user, $phone, $profile, $validated['email_notifications_enabled'] ?? null);
            return $this->authenticatedResponse($tenant, $user, $membership, 'تم تسجيل الدخول بنجاح.');
        }

        $this->assertEmailAvailable((string) $profile['email'], null);
        $user = $this->createGoogleUser($profile);
        $membership = $this->createMembership($tenant, $user, $phone, $profile, $validated['email_notifications_enabled'] ?? null);

        return $this->authenticatedResponse($tenant, $user, $membership, 'تم إنشاء حسابك بنجاح.');
    }

    private function resolveTenant(): Tenant
    {
        $tenant = currentTenant();
        if (! $tenant || $tenant->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant' => ['الأكاديمية غير متاحة.'],
            ]);
        }

        return $tenant;
    }

    private function findLinkedUser(string $googleId, string $email): ?User
    {
        $byGoogleId = User::query()->where('google_id', $googleId)->first();
        if ($byGoogleId) {
            return $byGoogleId;
        }

        return User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower($email)])->first();
    }

    private function syncGoogleUser(User $user, array $profile): User
    {
        $updates = [];

        if (empty($user->google_id)) {
            $updates['google_id'] = $profile['sub'];
        }
        if (empty($user->name) && ! empty($profile['name'])) {
            $updates['name'] = $profile['name'];
        }
        if (empty($user->avatar) && ! empty($profile['picture'])) {
            $updates['avatar'] = $profile['picture'];
        }
        if (empty($user->birth_date) && ! empty($profile['birth_date'])) {
            $updates['birth_date'] = $profile['birth_date'];
        }
        if (empty($user->email_verified_at) && ! empty($profile['email_verified'])) {
            $updates['email_verified_at'] = now();
        }

        if ($updates !== []) {
            $user->fill($updates);
            $user->save();
        }

        return $user;
    }

    private function createGoogleUser(array $profile): User
    {
        return User::create([
            'name' => $profile['name'] ?: $profile['email'],
            'email' => $profile['email'],
            'password' => Hash::make(Str::random(40)),
            'google_id' => $profile['sub'],
            'avatar' => $profile['picture'] ?? null,
            'birth_date' => $profile['birth_date'] ?? null,
            'email_verified_at' => now(),
        ]);
    }

    private function ensureMembership(Tenant $tenant, User $user, string $phone, array $profile, ?bool $emailNotificationsEnabled = null): TenantUser
    {
        $membership = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership) {
            return $this->createMembership($tenant, $user, $phone, $profile, $emailNotificationsEnabled);
        }

        $updates = [];
        if (empty($membership->phone)) {
            $updates['phone'] = $phone;
        }
        if (empty($membership->avatar)) {
            $updates['avatar'] = $user->avatar ?: AvatarGenerator::generate(null, $user->id);
        }
        if ($membership->status !== 'active') {
            $updates['status'] = 'active';
        }
        if ($updates !== []) {
            $membership->fill($updates);
            $membership->save();
        }

        $this->ensureStudentRole($tenant, $membership);
        $this->ensureNotificationPreferences($tenant, $membership, $emailNotificationsEnabled ?? true);

        return $membership->load('roles.permissions');
    }

    private function createMembership(Tenant $tenant, User $user, string $phone, array $profile, ?bool $emailNotificationsEnabled = null): TenantUser
    {
        $avatar = $user->avatar ?: AvatarGenerator::generate(null, $user->id);

        $membership = TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
            'phone' => $phone,
            'avatar' => $avatar,
            'joined_at' => now(),
        ]);

        if (empty($user->avatar)) {
            $user->avatar = $avatar;
            $user->save();
        }

        $this->ensureStudentRole($tenant, $membership);
        $this->ensureNotificationPreferences($tenant, $membership, $emailNotificationsEnabled ?? true);

        return $membership->load('roles.permissions');
    }

    private function ensureStudentRole(Tenant $tenant, TenantUser $membership): void
    {
        $studentRole = Role::query()->where('tenant_id', $tenant->id)->where('slug', 'student')->first();
        if (! $studentRole) {
            return;
        }
        if (! $membership->roles()->where('roles.id', $studentRole->id)->exists()) {
            $membership->roles()->attach($studentRole->id, ['tenant_id' => $tenant->id]);
        }
    }

    private function ensureNotificationPreferences(Tenant $tenant, TenantUser $membership, bool $emailEnabled): void
    {
        foreach (['session.scheduled', 'session.rescheduled', 'session.cancelled'] as $type) {
            \App\Models\NotificationPreference::updateOrCreate(
                ['tenant_id' => $tenant->id, 'tenant_user_id' => $membership->id, 'notification_type' => $type],
                ['in_app_enabled' => true, 'email_enabled' => $emailEnabled, 'whatsapp_enabled' => false]
            );
        }
    }

    private function needsPhoneResponse(Tenant $tenant, array $profile, ?User $user, ?TenantUser $membership): JsonResponse
    {
        $token = Str::random(64);
        Cache::put($this->completionCacheKey($token), [
            'tenant_id' => $tenant->id,
            'user_id' => $user?->id,
            'membership_id' => $membership?->id,
            'profile' => $profile,
        ], now()->addMinutes(self::COMPLETION_TTL_MINUTES));

        return response()->json([
            'needs_phone' => true,
            'completion_token' => $token,
            'profile' => [
                'name' => $profile['name'] ?? '',
                'email' => $profile['email'] ?? '',
                'avatar' => $profile['picture'] ?? null,
            ],
        ]);
    }

    private function assertPhoneAvailable(Tenant $tenant, string $phone, ?int $ignoreUserId): void
    {
        $query = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('phone', $phone);

        if ($ignoreUserId) {
            $query->where('user_id', '!=', $ignoreUserId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'phone' => ['هذا الرقم مسجل بالفعل في هذه الأكاديمية.'],
            ]);
        }
    }

    private function assertEmailAvailable(string $email, ?int $ignoreUserId): void
    {
        $query = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower($email)]);
        if ($ignoreUserId) {
            $query->where('id', '!=', $ignoreUserId);
        }
        if ($query->exists()) {
            throw ValidationException::withMessages([
                'email' => ['هذا البريد الإلكتروني مستخدم بالفعل.'],
            ]);
        }
    }

    private function normalizePhone(?string $phone): ?string
    {
        $phone = trim((string) $phone);
        return $phone === '' ? null : $phone;
    }

    private function completionCacheKey(string $token): string
    {
        return 'public_google_auth:' . $token;
    }

    private function authenticatedResponse(Tenant $tenant, User $user, TenantUser $membership, string $message): JsonResponse
    {
        $membership->loadMissing('roles.permissions');
        $roles = $membership->roles;
        $permissions = $roles->flatMap(fn ($role) => $role->permissions)->unique('id')->values();

        $accessToken = $user->createToken('access_token', ['access:api'], now()->addHours(24));
        $refreshToken = $user->createToken('refresh_token', ['refresh:token'], now()->addDays(30));

        return response()->json([
            'message' => $message,
            'access_token' => $accessToken->plainTextToken,
            'refresh_token' => $refreshToken->plainTextToken,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_super_admin' => false,
                'avatar' => $user->avatar,
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
}
