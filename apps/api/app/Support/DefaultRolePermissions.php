<?php

namespace App\Support;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Services\Authorization\PermissionService;
use Illuminate\Support\Str;

class DefaultRolePermissions
{
    /**
     * The canonical role -> permission mapping applied to every tenant,
     * whether it is created through the platform provisioning flow or the
     * identity seeder. Keep this list in sync with the platform feature set.
     *
     * @return array<string, list<string>>
     */
    public static function catalog(): array
    {
        return [
            'tenant_owner' => [
                'tenant.manage',
                'news.manage',
                'stages.manage',
                'subjects.manage',
                'users.view',
                'users.invite',
                'users.manage',
                'roles.view',
                'roles.assign',
                'permissions.manage',
                'categories.view',
                'categories.create',
                'categories.update',
                'categories.delete',
                'categories.restore',
                'categories.feature',
                'categories.activate',
                'courses.view',
                'courses.create',
                'courses.update',
                'courses.publish',
                'courses.archive',
                'courses.delete',
                'courses.assign_instructors',
                'courses.manage_settings',
                'enrollments.view',
                'enrollments.manage',
                'analytics.view',
                'modules.view',
                'modules.create',
                'modules.update',
                'modules.delete',
                'modules.publish',
                'modules.archive',
                'modules.feature',
                'modules.reorder',
                'sections.view',
                'sections.create',
                'sections.update',
                'sections.delete',
                'sections.publish',
                'sections.feature',
                'sections.reorder',
                'lessons.view',
                'lessons.create',
                'lessons.update',
                'lessons.delete',
                'lessons.publish',
                'lessons.archive',
                'lessons.feature',
                'lessons.reorder',
                'questions.view',
                'questions.create',
                'questions.update',
                'questions.delete',
                'questions.publish',
                'questions.archive',
                'questions.restore',
                'exams.view',
                'exams.create',
                'exams.update',
                'exams.delete',
                'exams.publish',
                'exams.archive',
                'exams.restore',
                'banks.view',
                'banks.create',
                'banks.update',
                'banks.delete',
                'banks.archive',
                'banks.restore',
                'question-categories.view',
                'question-categories.create',
                'question-categories.update',
                'question-categories.delete',
                'question-categories.restore',
                'media.view',
                'media.create',
                'media.update',
                'media.delete',
                'media.upload',
                'media.download',
                'media.archive',
                'media.manage',
                'recharge-codes.manage',
                'payment-gateway.manage',
                'seo.view',
                'seo.create',
                'seo.update',
                'seo.publish',
                'seo.delete',
                'seo.manage_settings',
            ],
            'admin' => [
                'users.view',
                'users.invite',
                'users.manage',
                'roles.view',
                'roles.assign',
                'permissions.manage',
                'categories.view',
                'categories.create',
                'categories.update',
                'categories.delete',
                'categories.restore',
                'categories.feature',
                'categories.activate',
                'courses.view',
                'courses.create',
                'courses.update',
                'courses.publish',
                'courses.archive',
                'courses.delete',
                'courses.assign_instructors',
                'courses.manage_settings',
                'enrollments.view',
                'enrollments.manage',
                'analytics.view',
                'modules.view',
                'modules.create',
                'modules.update',
                'modules.delete',
                'modules.publish',
                'modules.archive',
                'modules.feature',
                'modules.reorder',
                'sections.view',
                'sections.create',
                'sections.update',
                'sections.delete',
                'sections.publish',
                'sections.feature',
                'sections.reorder',
                'lessons.view',
                'lessons.create',
                'lessons.update',
                'lessons.delete',
                'lessons.publish',
                'lessons.archive',
                'lessons.feature',
                'lessons.reorder',
                'questions.view',
                'questions.create',
                'questions.update',
                'questions.delete',
                'questions.publish',
                'questions.archive',
                'questions.restore',
                'exams.view',
                'exams.create',
                'exams.update',
                'exams.delete',
                'exams.publish',
                'exams.archive',
                'exams.restore',
                'banks.view',
                'banks.create',
                'banks.update',
                'banks.delete',
                'banks.archive',
                'banks.restore',
                'question-categories.view',
                'question-categories.create',
                'question-categories.update',
                'question-categories.delete',
                'question-categories.restore',
                'news.manage',
                'stages.manage',
                'subjects.manage',
                'media.view',
                'media.create',
                'media.update',
                'media.delete',
                'media.upload',
                'media.download',
                'media.archive',
                'media.manage',
                'recharge-codes.manage',
                'payment-gateway.manage',
                'seo.view',
                'seo.create',
                'seo.update',
                'seo.publish',
                'seo.delete',
                'seo.manage_settings',
            ],
            'instructor' => [
                'categories.view',
                'courses.view',
                'courses.create',
                'courses.update',
                'enrollments.view',
                'analytics.view',
                'modules.view',
                'modules.create',
                'modules.update',
                'modules.reorder',
                'sections.view',
                'sections.create',
                'sections.update',
                'sections.reorder',
                'lessons.view',
                'lessons.create',
                'lessons.update',
                'questions.view',
                'questions.create',
                'questions.update',
                'exams.view',
                'exams.create',
                'exams.update',
                'banks.view',
                'question-categories.view',
                'media.view',
                'media.upload',
                'media.download',
                'seo.view',
                'seo.create',
                'seo.update',
            ],
            'student' => [
                'categories.view',
                'courses.view',
                'enrollments.view',
                'modules.view',
                'sections.view',
                'lessons.view',
                'exams.view',
                'banks.view',
                'question-categories.view',
                'media.view',
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function allPermissionSlugs(): array
    {
        return collect(self::catalog())
            ->flatten()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Ensure every tenant's default roles carry the canonical permission set
     * and clear the affected user permission caches. Idempotent: safe to run
     * repeatedly and for tenants that are already in sync.
     */
    public static function syncAllTenants(): void
    {
        $permissions = collect(self::allPermissionSlugs())
            ->mapWithKeys(fn (string $slug) => [
                $slug => Permission::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => Str::headline(str_replace('.', ' ', $slug)),
                        'description' => null,
                    ],
                ),
            ]);

        $permissionService = app(PermissionService::class);

        Tenant::query()->each(function (Tenant $tenant) use ($permissions, $permissionService): void {
            foreach (self::catalog() as $roleSlug => $permissionSlugs) {
                $role = Role::updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'slug' => $roleSlug,
                    ],
                    [
                        'name' => Str::headline(str_replace('_', ' ', $roleSlug)),
                    ],
                );

                $role->permissions()->sync(
                    $permissions->only($permissionSlugs)->pluck('id')->all(),
                );
            }

            $permissionService->clearAllUserCaches($tenant->id);
        });
    }
}
