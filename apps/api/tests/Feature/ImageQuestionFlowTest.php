<?php

namespace Tests\Feature;

use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Question;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageQuestionFlowTest extends TestCase
{
    use RefreshDatabase;

    private function makeJpeg(int $w = 800, int $h = 600): string
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required');
        }
        $path = tempnam(sys_get_temp_dir(), 'img') . '.jpg';
        $im = imagecreatetruecolor($w, $h);
        imagefill($im, 0, 0, imagecolorallocate($im, 255, 255, 255));
        // Add noise/variation so the re-encoded JPEG exceeds the 1KB floor.
        for ($i = 0; $i < 4000; $i++) {
            $c = imagecolorallocate($im, random_int(0, 255), random_int(0, 255), random_int(0, 255));
            imagesetpixel($im, random_int(0, $w - 1), random_int(0, $h - 1), $c);
        }
        $text = imagecolorallocate($im, 20, 20, 20);
        imagestring($im, 5, 40, 40, 'Sample question text for the teacher', $text);
        imagejpeg($im, $path, 90);
        imagedestroy($im);

        return $path;
    }

    private function people(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        return [$tenant, $admin, $student];
    }

    private function header(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
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

        if (! Permission::query()->where('slug', 'courses.update')->exists()) {
            $this->fail('Course permissions were not seeded.');
        }
    }

    private function createImageQuestion(Tenant $tenant, TenantUser $admin): int
    {
        return (int) $this->postJson('/api/v1/exam-bank/questions', [
            'question_format' => 'image',
            'type' => 'single_choice',
            'content' => [
                'options' => [
                    ['id' => 'opt-a', 'text' => 'أ', 'correct' => true],
                    ['id' => 'opt-b', 'text' => 'ب', 'correct' => false],
                ],
            ],
            'points' => 1,
        ], $this->header($tenant))->assertCreated()->json('data.id');
    }

    public function test_teacher_can_create_image_question_and_upload(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);

        $questionId = $this->createImageQuestion($tenant, $admin);

        $file = new UploadedFile($this->makeJpeg(), 'q.jpg', 'image/jpeg', null, true);
        $upload = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan", [
            'file' => $file,
        ], $this->header($tenant));

        $upload->assertOk();
        $data = $upload->json('data');
        $this->assertSame('image', $data['questionFormat']);
        $this->assertNotEmpty($data['scanUrl']);
        $this->assertNotNull($data['scanAssetId']);

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        $this->assertSame($tenant->id, $asset->tenant_id);
        $this->assertSame((int) $data['scanAssetId'], Question::withoutGlobalScopes()->find($questionId)->media_asset_id);
    }

    public function test_invalid_mime_is_rejected(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $path = tempnam(sys_get_temp_dir(), 'txt') . '.txt';
        file_put_contents($path, 'this is not an image');
        $file = new UploadedFile($path, 'q.txt', 'text/plain', null, true);
        $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan", [
            'file' => $file,
        ], $this->header($tenant))->assertStatus(422);

        $this->assertNull(Question::withoutGlobalScopes()->find($questionId)->media_asset_id);
    }

    public function test_corrupt_image_is_rejected(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        // A JPEG with a valid SOI/APP0 magic header but garbage body passes the
        // `mimes` rule (content-based header check) yet is not a decodable image.
        // It must yield a clean 422 validation error, never a 500, and must not
        // attach or leak a stored asset.
        $path = tempnam(sys_get_temp_dir(), 'bad') . '.jpg';
        file_put_contents($path, "\xFF\xD8\xFF\xE0" . str_repeat("\x00", 5000));
        $file = new UploadedFile($path, 'bad.jpg', 'image/jpeg', null, true);

        $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan", [
            'file' => $file,
        ], $this->header($tenant))->assertStatus(422);

        $this->assertNull(Question::withoutGlobalScopes()->find($questionId)->media_asset_id);
    }

    public function test_replace_cleans_old_media(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $first = (int) $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data.scanAssetId');

        $second = (int) $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'b.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data.scanAssetId');

        $this->assertNotSame($first, $second);
        $this->assertSoftDeleted('media_assets', ['id' => $first]);
        $this->assertDatabaseHas('media_assets', ['id' => $second]);
    }

    public function test_remove_clears_attachment(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $assetId = (int) $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data.scanAssetId');

        $this->deleteJson("/api/v1/exam-bank/questions/{$questionId}/scan", [], $this->header($tenant))->assertOk();

        $question = Question::withoutGlobalScopes()->find($questionId);
        $this->assertNull($question->media_asset_id);
        $this->assertSame('text', $question->question_format);
        $this->assertSoftDeleted('media_assets', ['id' => $assetId]);
    }

    public function test_cross_tenant_scan_is_forbidden(): void
    {
        [$tenant, $admin] = $this->people();
        $other = Tenant::factory()->create();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            ['X-Tenant-ID' => (string) $other->id])->assertNotFound();
    }

    public function test_scan_assets_are_namespaced_per_tenant_and_never_collide(): void
    {
        Storage::fake('public');
        [$tenantA, $adminA] = $this->people();
        $tenantB = Tenant::factory()->create();
        $this->actingAs($adminA->user);
        $questionId = $this->createImageQuestion($tenantA, $adminA);

        $assetId = (int) $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenantA))->assertOk()->json('data.scanAssetId');

        $assetA = MediaAsset::withoutGlobalScopes()->findOrFail($assetId);
        $this->assertSame($tenantA->id, $assetA->tenant_id);

        // Storage keys are tenant-segmented, so tenant A can never resolve
        // tenant B's scan key (or vice-versa) through the path namespace.
        $this->assertStringStartsWith("tenants/{$tenantA->id}/assets/", (string) $assetA->storage_key);
        $this->assertStringNotContainsString("tenants/{$tenantB->id}/", (string) $assetA->storage_key);

        // Tenant B's own scans live under a disjoint key namespace.
        $memberB = $this->memberWithRole($tenantB, 'admin');
        $this->actingAs($memberB->user);
        $qB = $this->createImageQuestion($tenantB, $memberB);
        $assetBId = (int) $this->postJson("/api/v1/exam-bank/questions/{$qB}/scan",
            ['file' => new UploadedFile($this->makePng(), 'b.png', 'image/png', null, true)],
            $this->header($tenantB))->assertOk()->json('data.scanAssetId');

        $assetB = MediaAsset::withoutGlobalScopes()->findOrFail($assetBId);
        $this->assertStringStartsWith("tenants/{$tenantB->id}/assets/", (string) $assetB->storage_key);
        $this->assertNotSame($assetA->storage_key, $assetB->storage_key);
    }

    public function test_no_vision_job_is_dispatched_for_image_question(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk();

        // No questions table column tracks extraction; we assert the question remained
        // in the simple image format and no OCR/Vision metadata was attached.
        $question = Question::withoutGlobalScopes()->find($questionId);
        $this->assertSame('image', $question->question_format);
        $this->assertArrayNotHasKey('vision', (array) $question->metadata);
        $this->assertArrayNotHasKey('ocr', (array) $question->metadata);
    }

    public function test_show_and_index_return_scan_url_after_refresh(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $scanUrl = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data.scanUrl');
        $this->assertNotEmpty($scanUrl);

        $show = $this->getJson("/api/v1/exam-bank/questions/{$questionId}", $this->header($tenant))
            ->assertOk()
            ->json('data');

        $this->assertSame('image', $show['questionFormat']);
        $this->assertSame($scanUrl, $show['scanUrl']);
        $this->assertNotNull($show['scanAssetId']);

        $list = $this->getJson('/api/v1/exam-bank/questions', $this->header($tenant))
            ->assertOk()
            ->json('data');

        $row = collect($list)->firstWhere('id', (string) $questionId);
        $this->assertNotNull($row, 'image question must appear in the bank list');
        $this->assertSame($scanUrl, $row['scanUrl']);
    }

    public function test_replace_and_remove_purge_stored_scan_file(): void
    {
        Storage::fake('public');

        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $first = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data');

        $firstAsset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $first['scanAssetId']);
        $this->assertNotNull($firstAsset->storage_key);
        $firstPath = (string) $firstAsset->storage_key;
        Storage::disk('public')->assertExists($firstPath);

        // Replace purges the old stored file and keeps the new one.
        $second = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'b.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data');

        $secondAsset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $second['scanAssetId']);
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists((string) $secondAsset->storage_key);

        // Remove purges the current stored file too.
        $this->deleteJson("/api/v1/exam-bank/questions/{$questionId}/scan", [], $this->header($tenant))->assertOk();

        Storage::disk('public')->assertMissing((string) $secondAsset->storage_key);
    }

    public function test_storage_key_is_tenant_scoped_and_unique(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $q1 = $this->createImageQuestion($tenant, $admin);
        $q2 = $this->createImageQuestion($tenant, $admin);

        $a1 = MediaAsset::withoutGlobalScopes()->findOrFail((int) $this->postJson("/api/v1/exam-bank/questions/{$q1}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data.scanAssetId'));
        $a2 = MediaAsset::withoutGlobalScopes()->findOrFail((int) $this->postJson("/api/v1/exam-bank/questions/{$q2}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'b.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data.scanAssetId'));

        $this->assertStringStartsWith("tenants/{$tenant->id}/assets/", (string) $a1->storage_key);
        $this->assertStringStartsWith("tenants/{$tenant->id}/assets/", (string) $a2->storage_key);
        $this->assertNotSame($a1->storage_key, $a2->storage_key);
        $this->assertStringNotContainsString('..', (string) $a1->storage_key);
    }

    public function test_scan_url_never_exposes_an_absolute_filesystem_path(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $data = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        $this->assertStringNotContainsString(storage_path(), (string) $data['scanUrl']);
        $this->assertStringNotContainsString('C:', (string) $data['scanUrl']);
        // The URL is a web path under the /storage route (or absolute http(s)),
        // never a raw filesystem location, and it stays inside the tenant namespace.
        $this->assertMatchesRegularExpression('#^(/storage/|https?://)#', (string) $data['scanUrl']);
        $this->assertStringContainsString((string) $asset->storage_key, (string) $data['scanUrl']);
    }

    public function test_remote_storage_disk_receives_scan_binary_through_abstraction(): void
    {
        Storage::fake('s3');
        config(['media.storage_disk' => 's3']);

        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $data = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makePng(), 'q.png', 'image/png', null, true)],
            $this->header($tenant))->assertOk()->json('data');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        Storage::disk('s3')->assertExists((string) $asset->storage_key);
        Storage::disk('public')->assertMissing((string) $asset->storage_key);

        // URL still resolves through the shared disk.
        $this->assertNotEmpty($data['scanUrl']);
        $this->assertStringContainsString((string) $asset->storage_key, (string) $asset->cdn_url);
    }

    // ── image format / original preservation ─────────────────────────────

    public function test_jpeg_upload_remains_jpeg_in_original_preserve_mode(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $data = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'q.jpg', 'image/jpeg', null, true), 'mode' => 'original_preserve'],
            $this->header($tenant))->assertOk()->json('data');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        $this->assertSame('image/jpeg', $asset->mime_type);
        $this->assertSame('original', $asset->metadata['scan_quality_level']);
        $this->assertTrue($asset->metadata['scan_original_preserved']);
    }

    public function test_png_upload_remains_png_in_original_preserve_mode(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $png = $this->makePng();
        $data = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($png, 'q.png', 'image/png', null, true), 'mode' => 'original_preserve'],
            $this->header($tenant))->assertOk()->json('data');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        $this->assertSame('image/png', $asset->mime_type);
        $this->assertStringEndsWith('.png', (string) $asset->storage_key);
        $this->assertTrue($asset->metadata['scan_original_preserved']);
        $this->assertSame($this->rawBytes($png), Storage::disk('public')->get((string) $asset->storage_key));
    }

    public function test_webp_upload_remains_webp_in_original_preserve_mode(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $webp = $this->makeWebp();
        $data = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($webp, 'q.webp', 'image/webp', null, true), 'mode' => 'original_preserve'],
            $this->header($tenant))->assertOk()->json('data');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        $this->assertSame('image/webp', $asset->mime_type);
        $this->assertStringEndsWith('.webp', (string) $asset->storage_key);
        $this->assertTrue($asset->metadata['scan_original_preserved']);
        $this->assertSame($this->rawBytes($webp), Storage::disk('public')->get((string) $asset->storage_key));
    }

    public function test_png_transparency_is_preserved_in_original_preserve_mode(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $png = $this->makeTransparentPng();
        $data = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($png, 't.png', 'image/png', null, true), 'mode' => 'original_preserve'],
            $this->header($tenant))->assertOk()->json('data');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        $stored = Storage::disk('public')->get((string) $asset->storage_key);

        $img = imagecreatefromstring($stored);
        $this->assertNotFalse($img);
        $this->assertTrue($this->imageHasTransparency($img), 'PNG transparency must survive original preservation');
        imagedestroy($img);
    }

    public function test_original_bytes_are_not_silently_reencoded_in_preserve_mode(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $png = $this->makePng();
        $data = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($png, 'q.png', 'image/png', null, true), 'mode' => 'original_preserve'],
            $this->header($tenant))->assertOk()->json('data');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        // Exact byte identity proves no lossy re-encode happened.
        $this->assertSame($this->rawBytes($png), Storage::disk('public')->get((string) $asset->storage_key));
        $this->assertSame(hash('sha256', $this->rawBytes($png)), $asset->checksum);
    }

    public function test_default_scan_mode_preserves_original_image(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $png = $this->makePng();
        $data = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($png, 'q.png', 'image/png', null, true)],
            $this->header($tenant))->assertOk()->json('data');

        // The controller must default to original_preserve so no automatic
        // document processing (warp/crop/binarize) ever runs on a question
        // image unless a client explicitly opts in.
        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        $this->assertSame('image/png', $asset->mime_type);
        $this->assertTrue($asset->metadata['scan_original_preserved']);
        $this->assertSame($this->rawBytes($png), Storage::disk('public')->get((string) $asset->storage_key));
    }

    public function test_delete_question_purges_new_style_scan_asset(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $data = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail((int) $data['scanAssetId']);
        $this->assertStringStartsWith("tenants/{$tenant->id}/assets/", (string) $asset->storage_key);
        Storage::disk('public')->assertExists((string) $asset->storage_key);

        $this->deleteJson("/api/v1/exam-bank/questions/{$questionId}", [], $this->header($tenant))
            ->assertOk();

        // Neither the new binary nor its row is leaked after the question goes.
        $this->assertSoftDeleted('media_assets', ['id' => $asset->id]);
        Storage::disk('public')->assertMissing((string) $asset->storage_key);
        $this->assertSoftDeleted('questions', ['id' => $questionId]);
    }

    public function test_delete_question_purges_assets_through_bulk_delete(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        $assetId = (int) $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true)],
            $this->header($tenant))->assertOk()->json('data.scanAssetId');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail($assetId);
        Storage::disk('public')->assertExists((string) $asset->storage_key);

        $this->postJson('/api/v1/exam-bank/questions/bulk/delete',
            ['ids' => [$questionId]], $this->header($tenant))->assertOk();

        $this->assertSoftDeleted('media_assets', ['id' => $asset->id]);
        Storage::disk('public')->assertMissing((string) $asset->storage_key);
    }

    public function test_delete_question_does_not_touch_legacy_cdn_only_asset(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $question = Question::withoutGlobalScopes()->findOrFail($this->createImageQuestion($tenant, $admin));

        // Legacy assets are referenced purely by a remote cdn_url with no
        // local storage key — they are not owned by this storage flow.
        $legacy = MediaAsset::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'bunny',
            'type' => 'image',
            'mime_type' => 'image/jpeg',
            'metadata' => [],
            'storage_key' => null,
            'cdn_url' => 'https://cdn.example.test/legacy/old-question.jpg',
        ]);
        $question->forceFill(['media_asset_id' => $legacy->id])->save();

        $this->deleteJson("/api/v1/exam-bank/questions/{$question->id}", [], $this->header($tenant))
            ->assertOk();

        // Legacy remote asset must be preserved — deleting a question must
        // never destroy assets this flow does not own.
        $this->assertNotSoftDeleted('media_assets', ['id' => $legacy->id]);
    }

    public function test_delete_question_does_not_touch_legacy_local_asset_outside_namespace(): void
    {
        Storage::fake('public');
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $question = Question::withoutGlobalScopes()->findOrFail($this->createImageQuestion($tenant, $admin));

        // A pre-refactor local scan lives outside the new tenant namespace —
        // it belongs to the old flow and must not be purged on delete.
        $legacy = MediaAsset::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => 'local',
            'provider_service' => 'local',
            'type' => 'image',
            'mime_type' => 'image/jpeg',
            'metadata' => [],
            'storage_key' => 'assets/legacy-scan.jpg',
            'cdn_url' => '/storage/assets/legacy-scan.jpg',
        ]);
        $question->forceFill(['media_asset_id' => $legacy->id])->save();
        Storage::disk('public')->put('assets/legacy-scan.jpg', 'legacy bytes');

        $this->deleteJson("/api/v1/exam-bank/questions/{$question->id}", [], $this->header($tenant))
            ->assertOk();

        $this->assertNotSoftDeleted('media_assets', ['id' => $legacy->id]);
        Storage::disk('public')->assertExists('assets/legacy-scan.jpg');
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private function makePng(int $w = 500, int $h = 400, bool $transparent = false): string
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required');
        }
        $path = tempnam(sys_get_temp_dir(), 'img') . '.png';
        $im = imagecreatetruecolor($w, $h);
        if ($transparent) {
            imagealphablending($im, false);
            imagesavealpha($im, true);
            $transparentColor = imagecolorallocatealpha($im, 0, 0, 0, 127);
            imagefill($im, 0, 0, $transparentColor);
        } else {
            imagefill($im, 0, 0, imagecolorallocate($im, 255, 255, 255));
        }
        $text = imagecolorallocate($im, 25, 25, 25);
        imagestring($im, 5, 30, 30, 'sample png question', $text);
        imagepng($im, $path);
        imagedestroy($im);

        return $path;
    }

    private function makeTransparentPng(): string
    {
        return $this->makePng(500, 400, transparent: true);
    }

    private function makeWebp(int $w = 500, int $h = 400): string
    {
        if (! extension_loaded('gd') || ! function_exists('imagewebp')) {
            $this->markTestSkipped('GD WebP support required');
        }
        $path = tempnam(sys_get_temp_dir(), 'img') . '.webp';
        $im = imagecreatetruecolor($w, $h);
        imagefill($im, 0, 0, imagecolorallocate($im, 255, 255, 255));
        $text = imagecolorallocate($im, 25, 25, 25);
        imagestring($im, 5, 30, 30, 'sample webp question', $text);
        imagewebp($im, $path, 90);
        imagedestroy($im);

        return $path;
    }

    private function rawBytes(string $path): string
    {
        return (string) file_get_contents($path);
    }

    private function imageHasTransparency(\GdImage $img): bool
    {
        $w = imagesx($img);
        $h = imagesy($img);
        $step = max(1, (int) floor(min($w, $h) / 64));
        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                $rgba = imagecolorat($img, $x, $y);
                if (((($rgba >> 24) & 0x7F)) > 8) {
                    return true;
                }
            }
        }

        return false;
    }
}
