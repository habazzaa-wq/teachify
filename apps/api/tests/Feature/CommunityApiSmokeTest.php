<?php

namespace Tests\Feature;

use App\Models\CommunityChannel;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Community\CommunitySeedService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommunityApiSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_categories_channel_messages_search_and_stats_work_over_http(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');

        Sanctum::actingAs($student->user);

        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        app(CommunitySeedService::class)->seed($tenant);

        $channel = CommunityChannel::query()->where('slug', 'general-discussion')->firstOrFail();

        $this->getJson('/api/v1/community/categories', $headers)
            ->assertOk()
            ->assertJsonStructure(['categories' => ['*' => ['id', 'slug', 'name']]]);

        $this->getJson("/api/v1/community/channels/{$channel->id}", $headers)
            ->assertOk()
            ->assertJsonPath('channel.slug', 'general-discussion');

        $created = $this->postJson("/api/v1/community/channels/{$channel->id}/messages", [
            'body' => 'How do I solve linear equations?',
            'content_type' => 'text',
        ], $headers);

        $created->assertCreated()
            ->assertJsonPath('message.body_text', 'How do I solve linear equations?')
            ->assertJsonPath('message.status', 'active');

        $messageId = $created->json('message.id');

        $this->getJson("/api/v1/community/channels/{$channel->id}/messages", $headers)
            ->assertOk()
            ->assertJsonCount(1, 'messages');

        $this->getJson("/api/v1/community/messages/{$messageId}", $headers)
            ->assertOk()
            ->assertJsonPath('message.id', (string) $messageId);

        $this->getJson('/api/v1/community/search?q=linear', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'messages');

        $this->getJson('/api/v1/community/stats', $headers)
            ->assertOk();

        $this->getJson('/api/v1/community/gamification/me', $headers)
            ->assertOk()
            ->assertJsonStructure(['total_xp', 'today_xp', 'rank']);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $tenant = Tenant::factory()->create();

        $this->getJson('/api/v1/community/categories', ['X-Tenant-ID' => (string) $tenant->id])
            ->assertUnauthorized();
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        $this->seedTenantPermissions($tenant);

        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);

        $role = Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $roleSlug)
            ->firstOrFail();

        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        return $membership->load('user');
    }

    private function seedTenantPermissions(Tenant $tenant): void
    {
        if (Role::query()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $this->seed(IdentityAccessSeeder::class);

        if (! Permission::query()->where('slug', 'courses.view')->exists()) {
            $this->fail('Course permissions were not seeded.');
        }
    }
}
