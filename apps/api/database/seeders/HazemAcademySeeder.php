<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Services\Platform\TenantCreationService;
use Illuminate\Database\Seeder;

class HazemAcademySeeder extends Seeder
{
    public function run(TenantCreationService $creationService): void
    {
        // Remove existing tenant with this slug to avoid unique constraint conflict
        Tenant::where('slug', 'hazem')->forceDelete();

        $result = $creationService->create([
            'academy_name' => 'Hazem Academy',
            'academy_slug' => 'hazem',
            'owner_name' => 'Hazem',
            'owner_email' => 'hazem@gmail.com',
            'owner_password' => bcrypt('password'),
        ]);

        $tenant = $result['tenant'];
        $owner = $result['owner'];
        $membership = $result['membership'];

        $this->command->info('✅ Hazem Academy seeded successfully.');
        $this->command->info("   Tenant ID    : {$tenant->id}");
        $this->command->info("   Name         : {$tenant->name}");
        $this->command->info("   Slug         : {$tenant->slug}");
        $this->command->info("   Domain       : hazem.academy.test");
        $this->command->info("   Owner        : {$owner->name} <{$owner->email}>");
        $this->command->info("   Membership   : {$membership->id}");
    }
}
