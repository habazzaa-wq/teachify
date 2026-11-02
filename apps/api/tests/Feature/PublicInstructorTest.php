<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicInstructorTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_instructor_is_listed_without_a_published_public_course(): void
    {
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_instructors' => true],
        ]);
        $user = User::factory()->create(['name' => 'New Instructor']);
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'is_instructor' => true,
        ]);

        $this->getJson('/api/v1/public/instructors', [
            'X-Tenant-ID' => (string) $tenant->id,
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $membership->id)
            ->assertJsonPath('data.0.name', 'New Instructor')
            ->assertJsonPath('data.0.coursesCount', 0)
            ->assertJsonPath('data.0.courses', []);
    }
}
