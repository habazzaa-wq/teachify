<?php

namespace Database\Seeders;

use App\Models\PlatformAdmin;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformAdminSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'admin@platform.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
            ],
        );

        PlatformAdmin::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'status' => 'active',
                'role' => 'super_admin',
                'granted_at' => now(),
                'granted_by_user_id' => null,
            ],
        );
    }
}
