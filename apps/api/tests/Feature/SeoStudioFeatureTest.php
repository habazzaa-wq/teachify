<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\EducationalStage;
use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SeoContent;
use App\Models\SeoFaq;
use App\Models\SeoRevision;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\AuthorizationService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SeoStudioFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_article_with_seo_metadata_and_publish(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $response = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'دليل تعلم الرياضيات',
            'status' => 'draft',
            'excerpt' => 'ملخص قصير للمقال',
            'seo_title' => 'دليل تعلم الرياضيات 2026',
            'seo_description' => 'دليل شامل لتعلّم الرياضيات خطوة بخطوة مع أمثلة تطبيقية للمبتدئين.',
            'focus_keyword' => 'تعلم الرياضيات',
            'content_format' => 'markdown',
            'content' => "# مقدمة\n\nمحتوى المقال التعليمي هنا.",
            'indexable' => true,
            'in_sitemap' => true,
            'structured_data_type' => 'article',
        ], $this->tenantHeader($tenant));

        $response->assertCreated()
            ->assertJsonPath('data.title', 'دليل تعلم الرياضيات')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.author.id', (string) $admin->id)
            ->assertJsonPath('data.seo.focusKeyword', 'تعلم الرياضيات')
            ->assertJsonPath('data.contentType', 'article');

        $content = SeoContent::withoutGlobalScopes()->where('tenant_id', $tenant->id)->firstOrFail();
        $this->assertSame('draft', $content->status);
        $this->assertNotNull($content->slug);
        $this->assertNotNull($content->author_tenant_user_id);

        // Admin can publish.
        $this->postJson("/api/v1/seo/contents/{$content->id}/publish", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $content->refresh();
        $this->assertTrue($content->isPublished());
        $this->assertNotNull($content->published_at);
    }

    public function test_slug_is_unique_within_tenant_but_allowed_across_tenants(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        $adminA = $this->memberWithRole($tenantA, 'admin');
        $adminB = $this->memberWithRole($tenantB, 'admin');

        Sanctum::actingAs($adminA->user);
        $this->postJson('/api/v1/seo/contents', [
            'title' => 'دليل الدراسة الفعالة',
            'slug' => 'study-guide',
            'content_type' => 'guide',
        ], $this->tenantHeader($tenantA))->assertCreated();

        // Same slug in a different tenant is fine.
        Sanctum::actingAs($adminB->user);
        $this->postJson('/api/v1/seo/contents', [
            'title' => 'دليل الدراسة الفعالة',
            'slug' => 'study-guide',
            'content_type' => 'guide',
        ], $this->tenantHeader($tenantB))->assertCreated();

        // Duplicate within the same tenant gets a suffixed unique slug.
        Sanctum::actingAs($adminA->user);
        $this->postJson('/api/v1/seo/contents', [
            'title' => 'دليل الدراسة الفعالة',
            'slug' => 'study-guide',
            'content_type' => 'guide',
        ], $this->tenantHeader($tenantA))
            ->assertCreated()
            ->assertJsonPath('data.slug', 'study-guide-2');
    }

    public function test_instructor_can_create_but_not_publish_or_delete(): void
    {
        $tenant = Tenant::factory()->create();
        $instructor = $this->memberWithRole($tenant, 'instructor');
        Sanctum::actingAs($instructor->user);

        $created = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'مقال للمراجعة',
            'status' => 'review',
        ], $this->tenantHeader($tenant));

        $created->assertCreated()->assertJsonPath('data.status', 'review');

        $id = $created->json('data.id');

        $this->postJson("/api/v1/seo/contents/{$id}/publish", [], $this->tenantHeader($tenant))
            ->assertForbidden();

        $this->deleteJson("/api/v1/seo/contents/{$id}", [], $this->tenantHeader($tenant))
            ->assertForbidden();

        // Instructor can still update their own content.
        $this->putJson("/api/v1/seo/contents/{$id}", [
            'excerpt' => 'ملخص محدّث',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.excerpt', 'ملخص محدّث');
    }

    public function test_draft_and_noindex_content_are_not_publicly_visible(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $draft = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'مقال غير منشور',
            'slug' => 'unpublished-article',
        ], $this->tenantHeader($tenant))->json('data');

        $this->getJson('/api/v1/public/seo/articles/unpublished-article', $this->tenantHeader($tenant))
            ->assertNotFound();

        // Published but noindex → still hidden.
        $this->postJson("/api/v1/seo/contents/{$draft['id']}/publish", [], $this->tenantHeader($tenant))->assertOk();
        $this->patchJson("/api/v1/seo/contents/{$draft['id']}", [
            'indexable' => false,
        ], $this->tenantHeader($tenant))->assertOk();

        $this->getJson('/api/v1/public/seo/articles/unpublished-article', $this->tenantHeader($tenant))
            ->assertNotFound();
    }

    public function test_published_indexable_content_is_publicly_available(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $created = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'أساسيات الفيزياء',
            'slug' => 'physics-basics',
            'seo_description' => 'أساسيات الفيزياء للمبتدئين بشكل مبسط.',
            'content' => 'محتوى المقال الكامل حول أساسيات الفيزياء.',
        ], $this->tenantHeader($tenant));

        $this->postJson("/api/v1/seo/contents/{$created->json('data.id')}/publish", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->getJson('/api/v1/public/seo/articles/physics-basics', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.title', 'أساسيات الفيزياء')
            ->assertJsonPath('data.publicPath', '/articles/physics-basics');
    }

    public function test_public_index_returns_only_published_articles(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'مسودة مخفية',
            'slug' => 'hidden-draft',
        ], $this->tenantHeader($tenant))->assertCreated();

        $published = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'مقال منشور',
            'slug' => 'visible-article',
        ], $this->tenantHeader($tenant));
        $this->postJson("/api/v1/seo/contents/{$published->json('data.id')}/publish", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->getJson('/api/v1/public/seo/articles', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'visible-article');
    }

    public function test_cross_tenant_canonical_url_is_rejected(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'محاولة اختراق canonical',
            'canonical_url' => 'https://evil.example.com/page',
        ], $this->tenantHeader($tenant))
            ->assertStatus(422);

        // Relative same-origin canonical is fine.
        $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'رابط أساسي صحيح',
            'canonical_url' => '/articles/ok',
        ], $this->tenantHeader($tenant))
            ->assertCreated();
    }

    public function test_html_content_is_sanitized_on_save(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $response = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'محتوى آمن',
            'content_format' => 'html',
            'content' => '<p>نص آمن</p><script>alert(1)</script><iframe src="https://evil.example.com"></iframe>',
        ], $this->tenantHeader($tenant));

        $response->assertCreated();

        $content = SeoContent::withoutGlobalScopes()->where('tenant_id', $tenant->id)->firstOrFail();
        $this->assertStringNotContainsString('<script', $content->content);
        $this->assertStringNotContainsString('<iframe', $content->content);
        $this->assertStringContainsString('<p>نص آمن</p>', $content->content);
    }

    public function test_cross_tenant_content_access_is_blocked(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        $adminA = $this->memberWithRole($tenantA, 'admin');
        $adminB = $this->memberWithRole($tenantB, 'admin');

        Sanctum::actingAs($adminA->user);
        $created = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'محتوى المؤسسة الأولى',
            'slug' => 'tenant-a-only',
        ], $this->tenantHeader($tenantA))->assertCreated();

        // Admin of tenant B must not see, edit, or delete tenant A's content.
        Sanctum::actingAs($adminB->user);
        $this->getJson("/api/v1/seo/contents/{$created->json('data.id')}", $this->tenantHeader($tenantB))
            ->assertNotFound();
        $this->putJson("/api/v1/seo/contents/{$created->json('data.id')}", [
            'title' => 'تعديل مخالف',
        ], $this->tenantHeader($tenantB))
            ->assertNotFound();
        $this->deleteJson("/api/v1/seo/contents/{$created->json('data.id')}", [], $this->tenantHeader($tenantB))
            ->assertNotFound();
    }

    public function test_cross_tenant_media_asset_is_rejected(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        $adminA = $this->memberWithRole($tenantA, 'admin');
        $adminB = $this->memberWithRole($tenantB, 'admin');

        // Tenant B owns an image.
        Sanctum::actingAs($adminB->user);
        $assetB = $this->createMediaAsset($tenantB);

        // Tenant A tries to use it as the featured image.
        Sanctum::actingAs($adminA->user);
        $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'صورة من مؤسسة أخرى',
            'featured_image_asset_id' => $assetB->id,
        ], $this->tenantHeader($tenantA))
            ->assertStatus(422);
    }

    public function test_seo_relevant_update_creates_a_revision(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $created = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'نسخة أولى',
        ], $this->tenantHeader($tenant))->json('data');

        $this->putJson("/api/v1/seo/contents/{$created['id']}", [
            'seo_title' => 'عنوان جديد محسّن',
        ], $this->tenantHeader($tenant))->assertOk();

        $this->assertDatabaseHas('seo_revisions', [
            'seo_content_id' => (int) $created['id'],
            'action' => 'updated',
        ]);
        $revision = SeoRevision::query()->where('seo_content_id', (int) $created['id'])->firstOrFail();
        $this->assertSame('نسخة أولى', $revision->snapshot['title']);
    }

    public function test_overview_returns_real_counts_and_console_status(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'مقال منشور',
            'slug' => 'published-overview',
        ], $this->tenantHeader($tenant));
        $draft = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'guide',
            'title' => 'دليل مسودة',
            'slug' => 'draft-overview',
        ], $this->tenantHeader($tenant))->json('data');

        // Publish the first one.
        $publishedId = SeoContent::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'published-overview')->firstOrFail()->id;
        $this->postJson("/api/v1/seo/contents/{$publishedId}/publish", [], $this->tenantHeader($tenant))->assertOk();

        $this->getJson('/api/v1/seo/overview', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.summary.totalContents', 2)
            ->assertJsonPath('data.summary.published', 1)
            ->assertJsonPath('data.summary.draft', 1)
            ->assertJsonPath('data.searchConsole.connected', false)
            ->assertJsonPath('data.typeBreakdown.article', 1)
            ->assertJsonPath('data.typeBreakdown.guide', 1);
    }

    public function test_keywords_crud(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $created = $this->postJson('/api/v1/seo/keywords', [
            'keyword' => 'رياضيات ابتدائي',
            'keyword_type' => 'focus',
            'search_intent' => 'informational',
            'notes' => 'كلمة أساسية للمحتوى الجديد',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('data.keyword', 'رياضيات ابتدائي')
            ->assertJsonPath('data.keywordType', 'focus');

        $id = $created->json('data.id');

        $this->putJson("/api/v1/seo/keywords/{$id}", [
            'search_intent' => 'transactional',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.searchIntent', 'transactional');

        $this->getJson('/api/v1/seo/keywords?search=رياضيات', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->deleteJson("/api/v1/seo/keywords/{$id}", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseMissing('seo_keywords', ['id' => (int) $id]);
    }

    public function test_settings_update_requires_manage_settings_permission(): void
    {
        $tenant = Tenant::factory()->create();
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $admin = $this->memberWithRole($tenant, 'admin');

        Sanctum::actingAs($instructor->user);
        $this->putJson('/api/v1/seo/settings', [
            'organization_name' => 'أكاديمية مخترقة',
        ], $this->tenantHeader($tenant))->assertForbidden();

        Sanctum::actingAs($admin->user);
        $this->putJson('/api/v1/seo/settings', [
            'organization_name' => 'أكاديمية النور',
            'default_robots_policy' => 'index_follow',
            'sitemap_include_default' => true,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.organizationName', 'أكاديمية النور');
    }

    public function test_link_search_is_tenant_scoped(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        $adminA = $this->memberWithRole($tenantA, 'admin');
        $adminB = $this->memberWithRole($tenantB, 'admin');

        Sanctum::actingAs($adminA->user);
        $articleA = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'استراتيجيات المذاكرة الفعالة',
            'slug' => 'study-strategies',
        ], $this->tenantHeader($tenantA))->json('data');
        $this->postJson("/api/v1/seo/contents/{$articleA['id']}/publish", [], $this->tenantHeader($tenantA))->assertOk();

        Sanctum::actingAs($adminB->user);
        $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'article',
            'title' => 'استراتيجيات المذاكرة الفعالة من مؤسسة أخرى',
            'slug' => 'other-tenant-strategies',
        ], $this->tenantHeader($tenantB));
        $this->getJson('/api/v1/seo/link-search?search=استراتيجيات', $this->tenantHeader($tenantB))
            ->assertOk()
            ->assertJsonCount(0, 'data');

        Sanctum::actingAs($adminA->user);
        $this->getJson('/api/v1/seo/link-search?search=استراتيجيات', $this->tenantHeader($tenantA))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'seo_content');
    }

    public function test_link_search_returns_stages_routed_by_id_without_slug_column(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $stage = EducationalStage::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $admin->id,
            'name' => 'مرحلة اختبار المسارات التجريبية',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/seo/link-search?search=المسارات', $this->tenantHeader($tenant));
        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'stage')
            ->assertJsonPath('data.0.title', 'مرحلة اختبار المسارات التجريبية')
            ->assertJsonPath('data.0.url', "/stages/{$stage->id}");
    }

    public function test_deleted_slug_is_reused_with_suffix_instead_of_duplicate_error(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $created = $this->postJson('/api/v1/seo/contents', [
            'title' => 'دليل المراجعة النهائية',
            'slug' => 'final-review',
            'content_type' => 'guide',
        ], $this->tenantHeader($tenant))->assertCreated()->json('data');

        $this->deleteJson("/api/v1/seo/contents/{$created['id']}", [], $this->tenantHeader($tenant))->assertOk();

        // Soft-deleted rows still hold the unique (tenant_id, slug) index slot,
        // so a re-create must get a suffixed slug, never a duplicate-key 500.
        $this->postJson('/api/v1/seo/contents', [
            'title' => 'دليل المراجعة النهائية',
            'slug' => 'final-review',
            'content_type' => 'guide',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('data.slug', 'final-review-2');
    }

    public function test_public_show_hides_unpublished_faqs(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        Sanctum::actingAs($admin->user);

        $created = $this->postJson('/api/v1/seo/contents', [
            'content_type' => 'faq_collection',
            'title' => 'أسئلة شائعة عن المنصة',
            'slug' => 'faq-platform',
            'faqs' => [
                ['question' => 'سؤال مرئي؟', 'answer' => 'إجابة منشورة.', 'is_published' => true],
                ['question' => 'سؤال مخفي؟', 'answer' => 'إجابة مخفية.', 'is_published' => false],
            ],
        ], $this->tenantHeader($tenant));

        $created->assertCreated();
        $this->assertSame(2, SeoFaq::withoutGlobalScopes()->where('tenant_id', $tenant->id)->count());

        $this->postJson("/api/v1/seo/contents/{$created->json('data.id')}/publish", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->getJson('/api/v1/public/seo/faq-collections/faq-platform', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'data.faqs')
            ->assertJsonPath('data.faqs.0.question', 'سؤال مرئي؟');
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        $this->seed(IdentityAccessSeeder::class);

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

        // Production registers these gates at boot from the permissions table;
        // a fresh test DB is empty at boot, so register them per-test instead.
        foreach (Permission::query()->pluck('slug') as $slug) {
            Gate::define($slug, function ($user) use ($slug) {
                return app(AuthorizationService::class)->hasPermission($user, $slug);
            });
        }

        return $membership->load('user');
    }

    private function createMediaAsset(Tenant $tenant): MediaAsset
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        return MediaAsset::create([
            'provider' => 'local',
            'provider_service' => 'local',
            'type' => 'image',
            'status' => 'ready',
            'visibility' => 'private',
            'metadata' => [],
            'original_name' => 'image.png',
            'mime_type' => 'image/png',
            'size_bytes' => 1024,
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
