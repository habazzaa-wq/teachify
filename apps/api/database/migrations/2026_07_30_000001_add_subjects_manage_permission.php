<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $permission = Permission::updateOrCreate(
            ['slug' => 'subjects.manage'],
            [
                'name' => Str::headline(str_replace('.', ' ', 'subjects.manage')),
                'description' => null,
            ],
        );

        Role::whereIn('slug', ['admin', 'tenant_owner'])
            ->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching([$permission->id]));
    }

    public function down(): void
    {
    }
};
