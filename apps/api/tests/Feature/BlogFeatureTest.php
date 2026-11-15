<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\MediaAsset;
use App\Models\PlatformAdmin;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BlogFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_blog_is_unavailable_until_the_tenant_feature_is_enabled(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_blog' => false]]);

        $this->getJson('/api/v1/public/blog', ['X-Tenant-ID' => (string) $tenant->id])
            ->assertNotFound();
    }

    public function test_public_blog_only_exposes_published_articles_that_are_due(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_blog' => true]]);
        $author = $this->membership($tenant, 'instructor');
        $this->article($tenant, $author, ['slug' => 'published', 'status' => 'published', 'published_at' => now()->subMinute()]);
        $this->article($tenant, $author, ['slug' => 'draft', 'status' => 'draft']);
        $this->article($tenant, $author, ['slug' => 'scheduled', 'status' => 'published', 'published_at' => now()->addDay()]);

        $this->getJson('/api/v1/public/blog', ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'published')
            ->assertJsonMissingPath('data.0.content');

        $this->getJson('/api/v1/public/blog/draft', ['X-Tenant-ID' => (string) $tenant->id])
            ->assertNotFound();
        $this->getJson('/api/v1/public/blog/scheduled', ['X-Tenant-ID' => (string) $tenant->id])
            ->assertNotFound();
    }

    public function test_public_blog_filters_by_search_and_category_and_paginates(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_blog' => true]]);
        $author = $this->membership($tenant, 'instructor');
        $this->article($tenant, $author, [
            'slug' => 'design-basics',
            'title' => 'Design Basics',
            'excerpt' => 'A guide to visual design',
            'category' => 'Design',
            'status' => 'published',
            'published_at' => now()->subMinutes(3),
        ]);
        $this->article($tenant, $author, [
            'slug' => 'design-systems',
            'title' => 'Design Systems',
            'excerpt' => 'Build a design system',
            'category' => 'Design',
            'status' => 'published',
            'published_at' => now()->subMinutes(2),
        ]);
        $this->article($tenant, $author, [
            'slug' => 'learning-habits',
            'title' => 'Learning Habits',
            'category' => 'Learning',
            'status' => 'published',
            'published_at' => now()->subMinute(),
        ]);

        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        $this->getJson('/api/v1/public/blog?per_page=1&page=2&category=Design', $headers)
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'design-basics')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('categories.0', 'Design')
            ->assertJsonPath('categories.1', 'Learning');

        $this->getJson('/api/v1/public/blog?search=visual', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'design-basics');
    }

    public function test_admin_can_create_an_article(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_blog' => true]]);
        $admin = $this->membership($tenant, 'tenant_owner');
        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        Sanctum::actingAs($admin->user);
        $this->withHeaders($headers)->postJson('/api/v1/blog/manage', [
            'title' => 'Admin article',
            'content' => 'A detailed article body.',
            'status' => 'published',
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'admin-article')
            ->assertJsonPath('data.status', 'published');
    }

    public function test_blog_writer_uploads_article_images_to_server_storage_without_media_library_assets(): void
    {
        Storage::fake('public');
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_blog' => true]]);
        $admin = $this->membership($tenant, 'tenant_owner');
        Sanctum::actingAs($admin->user);

        $response = $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id])
            ->post('/api/v1/blog/manage/upload-image', [
                'file' => UploadedFile::fake()->image('cover.jpg')->size(400),
            ])
            ->assertCreated()
            ->assertJsonPath('data.filename', 'cover.jpg');

        $url = $response->json('data.url');
        $this->assertMatchesRegularExpression(
            '#^/storage/blog/'.$tenant->id.'/[0-9A-HJKMNP-TV-Z]{26}\.jpg$#',
            $url,
        );
        Storage::disk('public')->assertExists(substr($url, strlen('/storage/')));
        $this->assertSame(0, MediaAsset::query()->count());
    }

    public function test_instructor_can_upload_blog_images_to_server_storage(): void
    {
        Storage::fake('public');
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_blog' => true, 'has_instructors' => true],
        ]);
        $instructor = $this->membership($tenant, 'instructor', true);
        $token = $instructor->user->createToken(
            'instructor_access_token',
            ['instructor:access', 'instructor:tenant:'.$tenant->id],
        );
        $headers = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$token->plainTextToken,
        ];

        $response = $this->withHeaders($headers)->post('/api/v1/instructor/blog/manage/upload-image', [
            'file' => UploadedFile::fake()->image('inline.webp')->size(400),
        ])->assertCreated()
            ->assertJsonPath('data.filename', 'inline.webp');

        $url = $response->json('data.url');
        $this->assertMatchesRegularExpression(
            '#^/storage/blog/'.$tenant->id.'/[0-9A-HJKMNP-TV-Z]{26}\.webp$#',
            $url,
        );
        Storage::disk('public')->assertExists(substr($url, strlen('/storage/')));
        $this->assertSame(0, MediaAsset::query()->count());
    }

    public function test_instructors_only_manage_their_own_articles(): void
    {
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_blog' => true, 'has_instructors' => true],
        ]);
        $instructor = $this->membership($tenant, 'instructor', true);
        $otherInstructor = $this->membership($tenant, 'instructor', true);
        $token = $instructor->user->createToken(
            'instructor_access_token',
            ['instructor:access', 'instructor:tenant:'.$tenant->id],
        );
        $headers = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$token->plainTextToken,
        ];

        $owned = $this->article($tenant, $instructor, ['slug' => 'my-article']);
        $scheduled = $this->article($tenant, $instructor, [
            'slug' => 'scheduled-article',
            'status' => 'published',
            'published_at' => now()->addDay(),
        ]);
        $notOwned = $this->article($tenant, $otherInstructor, ['slug' => 'their-article']);

        $this->withHeaders($headers)->getJson('/api/v1/instructor/blog/manage')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['slug' => 'my-article']);
        $this->withHeaders($headers)->getJson('/api/v1/instructor/blog/manage/'.$owned->id)->assertOk();
        $this->withHeaders($headers)->getJson('/api/v1/instructor/blog/manage/'.$scheduled->id)
            ->assertOk()
            ->assertJsonPath('data.status', 'scheduled');
        $this->withHeaders($headers)->getJson('/api/v1/instructor/blog/manage/'.$notOwned->id)->assertForbidden();
    }

    public function test_platform_tenant_update_can_enable_the_blog_feature(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_blog' => false]]);
        $platformAdmin = User::factory()->create();
        PlatformAdmin::factory()->create(['user_id' => $platformAdmin->id]);
        Sanctum::actingAs($platformAdmin, ['platform:access']);

        $this->putJson('/api/platform/tenants/'.$tenant->id, [
            'feature_flags' => ['has_blog' => true],
        ])->assertOk()
            ->assertJsonPath('tenant.featureFlags.hasBlog', true);
    }

    private function membership(Tenant $tenant, string $roleSlug, bool $isInstructor = false): TenantUser
    {
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
            'is_instructor' => $isInstructor,
        ]);
        $role = Role::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => $roleSlug],
            ['name' => str($roleSlug)->replace('_', ' ')->title()->toString()],
        );
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);

        return $membership;
    }

    private function article(Tenant $tenant, TenantUser $author, array $attributes = []): BlogPost
    {
        app()->instance('currentTenant', $tenant);

        return BlogPost::query()->create(array_merge([
            'tenant_id' => $tenant->id,
            'author_tenant_user_id' => $author->id,
            'title' => 'Article '.$attributes['slug'],
            'slug' => 'article',
            'content' => 'Article body',
            'status' => 'draft',
        ], $attributes));
    }
}
