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
            ['slug' => 'recharge-codes.manage'],
            [
                'name' => Str::headline(str_replace('.', ' ', 'recharge-codes.manage')),
                'description' => 'إنشاء وإدارة أكواد شحن المحفظة',
            ],
        );

        Role::whereIn('slug', ['admin', 'tenant_owner'])
            ->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching([$permission->id]));
    }

    public function down(): void
    {
        $permission = Permission::where('slug', 'recharge-codes.manage')->first();
        if ($permission) {
            $permission->roles()->detach();
            $permission->delete();
        }
    }
};
