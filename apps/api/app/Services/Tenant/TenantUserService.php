<?php

namespace App\Services\Tenant;

use App\Models\TenantUser;
use App\Models\User;
use App\Repositories\TenantUserRepository;
use App\Services\Security\AuditLogger;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TenantUserService
{
    public function __construct(
        private readonly TenantUserRepository $repository,
        private readonly AuditLogger $auditLogger,
    ) {}

    public function list(array $params): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->repository->list($params);
    }

    public function get(int $id): TenantUser
    {
        $tenantUser = $this->repository->findByIdOrFail($id);
        $tenantUser->loadMissing(['user', 'roles.permissions', 'createdBy.user', 'updatedBy.user']);
        return $tenantUser;
    }

    public function create(array $data): TenantUser
    {
        $email = mb_strtolower(trim($data['email']));

        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            $existingMembership = TenantUser::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('user_id', $existingUser->id)
                ->exists();

            if ($existingMembership) {
                throw ValidationException::withMessages([
                    'email' => ['This user is already a member of this tenant.'],
                ]);
            }
        }

        $user = $existingUser ?? User::create([
            'name' => $data['name'],
            'email' => $email,
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'avatar' => $data['avatar'] ?? null,
            'locale' => $data['locale'] ?? config('app.locale', 'ar'),
            'timezone' => $data['timezone'] ?? 'UTC',
        ]);

        $membership = $this->repository->create([
            'user_id' => $user->id,
            'status' => $data['status'] ?? 'active',
            'phone' => $data['phone'] ?? null,
            'avatar' => $data['avatar'] ?? null,
            'locale' => $data['locale'] ?? 'ar',
            'timezone' => $data['timezone'] ?? 'UTC',
            'department' => $data['department'] ?? null,
            'job_title' => $data['job_title'] ?? null,
            'notes' => $data['notes'] ?? null,
            'joined_at' => now(),
        ]);

        if (! empty($data['role_ids'])) {
            $membership->roles()->attach($data['role_ids'], ['tenant_id' => currentTenant()->id]);
        }

        $this->auditLogger->record('user_created', [
            'tenant_user_id' => $membership->id,
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        return $membership->loadMissing(['user', 'roles']);
    }

    public function update(int $id, array $data): TenantUser
    {
        $tenantUser = $this->repository->findByIdOrFail($id);

        $userData = array_intersect_key($data, array_flip(['name', 'email', 'phone', 'avatar', 'locale', 'timezone']));
        if (! empty($userData)) {
            if (isset($userData['email'])) {
                $userData['email'] = mb_strtolower(trim($userData['email']));
            }
            $tenantUser->user->fill($userData)->save();
        }

        $membershipData = array_intersect_key($data, array_flip([
            'phone', 'avatar', 'locale', 'timezone', 'department', 'job_title', 'notes', 'status',
        ]));

        if (! empty($membershipData)) {
            $this->repository->update($tenantUser, $membershipData);
        }

        if (array_key_exists('role_ids', $data)) {
            $tenantUser->roles()->sync(
                collect($data['role_ids'])->mapWithKeys(fn (int $id) => [$id => ['tenant_id' => currentTenant()->id]])->all(),
            );
        }

        $this->auditLogger->record('user_updated', [
            'tenant_user_id' => $tenantUser->id,
            'user_id' => $tenantUser->user_id,
        ]);

        return $tenantUser->refresh()->loadMissing(['user', 'roles', 'createdBy.user', 'updatedBy.user']);
    }

    public function delete(int $id): void
    {
        $tenantUser = $this->repository->findByIdOrFail($id);

        if (currentTenantUser()?->id === $tenantUser->id) {
            throw ValidationException::withMessages([
                'membership' => ['You cannot remove yourself from the tenant.'],
            ]);
        }

        $this->repository->delete($tenantUser);

        $this->auditLogger->record('user_deleted', [
            'tenant_user_id' => $tenantUser->id,
            'user_id' => $tenantUser->user_id,
            'email' => $tenantUser->user->email,
        ]);
    }

    public function restore(int $id): TenantUser
    {
        $tenantUser = $this->repository->restore($id);

        if (! $tenantUser) {
            throw ValidationException::withMessages([
                'id' => ['User not found or not deleted.'],
            ]);
        }

        $this->auditLogger->record('user_restored', [
            'tenant_user_id' => $tenantUser->id,
            'user_id' => $tenantUser->user_id,
        ]);

        return $tenantUser;
    }

    public function activate(int $id): TenantUser
    {
        $tenantUser = $this->repository->findByIdOrFail($id);
        $result = $this->repository->updateStatus($tenantUser, 'active');

        $this->auditLogger->record('user_activated', [
            'tenant_user_id' => $tenantUser->id,
            'user_id' => $tenantUser->user_id,
        ]);

        return $result;
    }

    public function suspend(int $id): TenantUser
    {
        $tenantUser = $this->repository->findByIdOrFail($id);

        if (currentTenantUser()?->id === $tenantUser->id) {
            throw ValidationException::withMessages([
                'membership' => ['You cannot suspend yourself.'],
            ]);
        }

        $result = $this->repository->updateStatus($tenantUser, 'suspended');

        $this->auditLogger->record('user_suspended', [
            'tenant_user_id' => $tenantUser->id,
            'user_id' => $tenantUser->user_id,
        ]);

        return $result;
    }

    public function bulkDelete(array $ids): int
    {
        $count = $this->repository->bulkDelete($ids);

        $this->auditLogger->record('users_bulk_deleted', [
            'count' => $count,
            'ids' => $ids,
        ]);

        return $count;
    }

    public function bulkRestore(array $ids): int
    {
        $count = $this->repository->bulkRestore($ids);

        $this->auditLogger->record('users_bulk_restored', [
            'count' => $count,
            'ids' => $ids,
        ]);

        return $count;
    }

    public function bulkActivate(array $ids): int
    {
        $count = $this->repository->bulkUpdateStatus($ids, 'active');

        $this->auditLogger->record('users_bulk_activated', [
            'count' => $count,
            'ids' => $ids,
        ]);

        return $count;
    }

    public function bulkSuspend(array $ids): int
    {
        $count = $this->repository->bulkUpdateStatus($ids, 'suspended');

        $this->auditLogger->record('users_bulk_suspended', [
            'count' => $count,
            'ids' => $ids,
        ]);

        return $count;
    }

    public function resetPassword(int $id): string
    {
        $tenantUser = $this->repository->findByIdOrFail($id);
        $password = Str::random(16);
        $tenantUser->user->forceFill(['password' => Hash::make($password)])->save();

        $this->auditLogger->record('password_reset', [
            'tenant_user_id' => $tenantUser->id,
            'user_id' => $tenantUser->user_id,
        ]);

        return $password;
    }

    public function getMetrics(): array
    {
        return [
            'totalUsers' => $this->repository->countByStatus('active') + $this->repository->countByStatus('inactive') + $this->repository->countByStatus('suspended') + $this->repository->countByStatus('pending'),
            'activeUsers' => $this->repository->countByStatus('active'),
            'inactiveUsers' => $this->repository->countByStatus('inactive'),
            'suspendedUsers' => $this->repository->countByStatus('suspended'),
            'twoFactorEnabled' => $this->repository->countWithTwoFactor(),
            'newThisMonth' => $this->repository->countNewThisMonth(),
            'departmentCount' => $this->repository->countDepartmentDistinct(),
            'pendingInvites' => $this->repository->countPendingInvites(),
        ];
    }

    public function exportCsv(array $params = []): StreamedResponse
    {
        $users = $this->repository->listAll($params);

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="users_' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($users): void {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Name', 'Email', 'Phone', 'Department', 'Job Title',
                'Role', 'Status', 'Locale', 'Timezone',
                'Last Login', 'Joined At', 'Created At',
            ]);

            foreach ($users as $membership) {
                fputcsv($handle, [
                    $membership->user->name,
                    $membership->user->email,
                    $membership->phone ?? $membership->user->phone,
                    $membership->department,
                    $membership->job_title,
                    $membership->roles->pluck('name')->implode(', '),
                    $membership->status,
                    $membership->locale,
                    $membership->timezone,
                    $membership->last_login_at?->toIso8601String(),
                    $membership->joined_at?->toIso8601String(),
                    $membership->created_at->toIso8601String(),
                ]);
            }

            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function getActivities(int $id): array
    {
        $tenantUser = $this->repository->findByIdOrFail($id);

        return $tenantUser->activityLogs()
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($log) => [
                'id' => (string) $log->id,
                'userId' => (string) $id,
                'action' => $log->event,
                'description' => $log->description ?? $log->event,
                'ipAddress' => $log->ip_address ?? request()->ip(),
                'userAgent' => $log->user_agent ?? '',
                'timestamp' => $log->created_at->toIso8601String(),
            ])
            ->toArray();
    }

    public function getSessions(int $id): array
    {
        $tenantUser = $this->repository->findByIdOrFail($id);

        return $tenantUser->user->tokens()
            ->where('name', 'access_token')
            ->get()
            ->map(fn ($token) => [
                'id' => (string) $token->id,
                'userId' => (string) $id,
                'ipAddress' => $token->ip_address ?? request()->ip(),
                'userAgent' => $token->user_agent ?? '',
                'location' => '',
                'isCurrent' => $token->id === (auth()->user()?->currentAccessToken()?->id ?? null),
                'lastActive' => $token->last_used_at?->toIso8601String() ?? $token->created_at->toIso8601String(),
                'createdAt' => $token->created_at->toIso8601String(),
            ])
            ->toArray();
    }

    public function forceLogout(int $id): void
    {
        $tenantUser = $this->repository->findByIdOrFail($id);

        $tenantUser->user->tokens()->where('name', 'access_token')->delete();

        $this->auditLogger->record('user_force_logout', [
            'tenant_user_id' => $tenantUser->id,
            'user_id' => $tenantUser->user_id,
        ]);
    }

    public function revokeSession(int $userId, int $sessionId): void
    {
        $tenantUser = $this->repository->findByIdOrFail($userId);

        $token = $tenantUser->user->tokens()->where('id', $sessionId)->first();

        if ($token) {
            $token->delete();
        }
    }
}
