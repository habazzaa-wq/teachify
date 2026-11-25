<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentFieldsSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_save_and_read_student_field_choices(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();
        TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/settings/student_fields', [
            'values' => [
                'parent_phone' => false,
                'gender' => false,
            ],
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonPath('values.parent_phone', false)
            ->assertJsonPath('values.gender', false);

        $this->getJson('/api/v1/settings/student_fields', ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonPath('values.parent_phone', false)
            ->assertJsonPath('values.gender', false)
            ->assertJsonPath('values.nationality', true)
            ->assertJsonPath('values.study_type', true);

        $this->assertDatabaseHas('tenant_settings', [
            'tenant_id' => $tenant->id,
            'group' => 'student_fields',
        ]);
    }
}
