<?php

namespace Tests\Feature;

use App\Models\Tenant;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class LegacyImageQuestionMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_image_rows_are_preserved_and_media_column_is_retained(): void
    {
        $this->simulateLegacySchema();

        $tenant = Tenant::factory()->create();

        $assetId = $this->insertMediaAsset($tenant->id, 'https://cdn.example.com/legacy/scan.png');

        $withUrl = $this->insertQuestion($tenant->id, 'image', $assetId, title: 'سؤال مصوّر');
        $withoutUrl = $this->insertQuestion($tenant->id, 'image', $this->insertMediaAsset($tenant->id, null), title: 'أصل بلا رابط');
        $noAsset = $this->insertQuestion($tenant->id, 'image', null, title: 'بلا أصل');
        $structured = $this->insertQuestion($tenant->id, 'structured', null, title: 'سؤال منظم', document: [
            'version' => 1,
            'direction' => 'rtl',
            'language' => 'ar',
            'meta' => [],
            'blocks' => [
                ['type' => 'paragraph', 'runs' => [['kind' => 'text', 'text' => 'نص أصلي']]],
            ],
        ]);
        $plain = $this->insertQuestion($tenant->id, 'text', null, title: 'سؤال نصي');

        $migration = require database_path(
            'migrations/2026_08_22_000003_remove_legacy_image_questions_from_questions_table.php'
        );
        $migration->up();

        // Image questions keep their format and media reference.
        $this->assertSame('image', $this->questionRow($withUrl)->question_format);
        $this->assertSame($assetId, (int) $this->questionRow($withUrl)->media_asset_id);

        $this->assertSame('image', $this->questionRow($withoutUrl)->question_format);
        $this->assertSame('image', $this->questionRow($noAsset)->question_format);

        // Other formats are untouched.
        $this->assertSame('structured', $this->questionRow($structured)->question_format);
        $this->assertSame('نص أصلي', json_decode((string) $this->questionRow($structured)->content_document, true)['blocks'][0]['runs'][0]['text']);
        $this->assertSame('text', $this->questionRow($plain)->question_format);

        // The canonical image-question column is preserved.
        $this->assertTrue(Schema::hasColumn('questions', 'media_asset_id'));
        $this->assertDatabaseHas('media_assets', ['id' => $assetId]);
    }

    private function simulateLegacySchema(): void
    {
        if (Schema::hasColumn('questions', 'media_asset_id')) {
            return;
        }

        Schema::table('questions', function (Blueprint $table): void {
            $table->unsignedBigInteger('media_asset_id')->nullable();
        });

        Schema::table('questions', function (Blueprint $table): void {
            $table->foreign('media_asset_id')->references('id')->on('media_assets')->nullOnDelete();
        });
    }

    private function insertMediaAsset(int $tenantId, ?string $cdnUrl): int
    {
        return DB::table('media_assets')->insertGetId([
            'tenant_id' => $tenantId,
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'type' => 'image',
            'status' => 'ready',
            'metadata' => json_encode([]),
            'cdn_url' => $cdnUrl,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertQuestion(int $tenantId, string $format, ?int $assetId, string $title, ?array $document = null): int
    {
        return DB::table('questions')->insertGetId([
            'tenant_id' => $tenantId,
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'title' => $title,
            'slug' => \Illuminate\Support\Str::slug($title).'-'.strtolower(\Illuminate\Support\Str::random(6)),
            'type' => 'single_choice',
            'question_format' => $format,
            'media_asset_id' => $assetId,
            'content_document' => $document !== null ? json_encode($document, JSON_UNESCAPED_UNICODE) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function questionRow(int $id): object
    {
        return DB::table('questions')->where('id', $id)->firstOrFail();
    }
}
