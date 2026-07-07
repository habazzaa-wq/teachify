<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class IdentityAccessSeeder extends Seeder
{
    /**
     * @var array<string, list<string>>
     */
    private array $rolePermissions = [
        'tenant_owner' => [
            'tenant.manage',
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
        ],
        'student' => [
            'categories.view',
            'courses.view',
            'enrollments.view',
            'modules.view',
            'sections.view',
            'lessons.view',
        ],
    ];

    public function run(): void
    {
        $permissions = collect($this->allPermissionSlugs())
            ->mapWithKeys(fn (string $slug) => [
                $slug => Permission::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => Str::headline(str_replace('.', ' ', $slug)),
                        'description' => null,
                    ],
                ),
            ]);

        Tenant::query()->each(function (Tenant $tenant) use ($permissions): void {
            foreach ($this->rolePermissions as $roleSlug => $permissionSlugs) {
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
        });
    }

    /**
     * @return list<string>
     */
    private function allPermissionSlugs(): array
    {
        return collect($this->rolePermissions)
            ->flatten()
            ->unique()
            ->values()
            ->all();
    }
}
