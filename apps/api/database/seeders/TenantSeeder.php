<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = [
            ['name' => 'Alpha Academy', 'slug' => 'alpha'],
            ['name' => 'Beta Academy', 'slug' => 'beta'],
            ['name' => 'Hazem Academy', 'slug' => 'hazem'],
            ['name' => 'Gamma Learning', 'slug' => 'gamma'],
            ['name' => 'Delta Institute', 'slug' => 'delta'],
        ];

        $baseDomain = config('app.base_domain', 'academy.test');

        foreach ($tenants as $data) {
            $tenant = Tenant::firstOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'status' => 'active',
                ],
            );

            $domain = $data['slug'].'.'.$baseDomain;

            TenantDomain::firstOrCreate(
                ['domain' => $domain],
                [
                    'tenant_id' => $tenant->id,
                    'subdomain' => $data['slug'],
                    'type' => 'platform_subdomain',
                    'status' => 'active',
                    'is_primary' => true,
                ],
            );
        }
    }
}
