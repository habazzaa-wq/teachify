<?php

namespace Database\Seeders;

use App\Models\PlatformAdmin;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('seeders.superadmin.email', 'admin@platform.com');
        $password = config('seeders.superadmin.password', 'change_me');

        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make($password),
            ],
        );

        // Ensure PlatformAdmin record exists and is active (idempotent)
        PlatformAdmin::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'status' => 'active',
                'role' => 'super_admin',
                'granted_at' => now(),
                'granted_by_user_id' => null,
            ],
        );

        $this->command->info("Super Admin seeded: {$email}");
    }
}
