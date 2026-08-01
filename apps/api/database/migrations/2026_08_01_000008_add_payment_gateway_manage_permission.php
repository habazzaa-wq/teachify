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
            ['slug' => 'payment-gateway.manage'],
            [
                'name' => Str::headline(str_replace('.', ' ', 'payment-gateway.manage')),
                'description' => 'إدارة إعدادات بوابة الدفع الإلكتروني',
            ],
        );

        Role::whereIn('slug', ['admin', 'tenant_owner'])
            ->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching([$permission->id]));
    }

    public function down(): void
    {
        $permission = Permission::where('slug', 'payment-gateway.manage')->first();
        if ($permission) {
            $permission->roles()->detach();
            $permission->delete();
        }
    }
};
