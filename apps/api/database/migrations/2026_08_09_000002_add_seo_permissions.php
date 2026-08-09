<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * SEO & Content Studio permissions.
     *
     * - seo.view / seo.create / seo.update: granted to instructors (teachers).
     * - seo.publish / seo.delete / seo.manage_settings: reserved for
     *   administrators and tenant owners (moderation authority).
     */
    private const SLUGS = [
        'seo.view',
        'seo.create',
        'seo.update',
        'seo.publish',
        'seo.delete',
        'seo.manage_settings',
    ];

    public function up(): void
    {
        $permissions = [];
        foreach (self::SLUGS as $slug) {
            $permissions[$slug] = Permission::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => Str::headline(str_replace('.', ' ', $slug)),
                    'description' => null,
                ],
            );
        }

        Role::whereIn('slug', ['admin', 'tenant_owner'])
            ->each(function (Role $role) use ($permissions): void {
                $role->permissions()->syncWithoutDetaching(array_column($permissions, 'id'));
            });

        // Teachers get view/create/update only — publishing and deleting stay
        // with admin/owner roles (existing moderation model).
        Role::where('slug', 'instructor')
            ->each(function (Role $role) use ($permissions): void {
                $role->permissions()->syncWithoutDetaching([
                    $permissions['seo.view']->id,
                    $permissions['seo.create']->id,
                    $permissions['seo.update']->id,
                ]);
            });
    }

    public function down(): void
    {
        Permission::whereIn('slug', self::SLUGS)->delete();
    }
};
