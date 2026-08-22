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

    public function test_image_rows_convert_to_structured_legacy_documents_and_column_is_dropped(): void
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

        $converted = $this->questionRow($withUrl);
        $this->assertSame('structured', $converted->question_format);

        $document = json_decode((string) $converted->content_document, true);
        $this->assertSame('image', $document['meta']['legacy']);
        $this->assertSame('legacy_image', $document['blocks'][0]['type']);
        $this->assertSame('https://cdn.example.com/legacy/scan.png', $document['blocks'][0]['url']);

        foreach ([$withoutUrl, $noAsset] as $degraded) {
            $row = $this->questionRow($degraded);
            $this->assertSame('text', $row->question_format);
            $this->assertNull($row->content_document);
        }

        $this->assertSame('structured', $this->questionRow($structured)->question_format);
        $this->assertSame('نص أصلي', json_decode((string) $this->questionRow($structured)->content_document, true)['blocks'][0]['runs'][0]['text']);
        $this->assertSame('text', $this->questionRow($plain)->question_format);

        $this->assertFalse(Schema::hasColumn('questions', 'media_asset_id'));
        $this->assertDatabaseHas('media_assets', ['id' => $assetId]);
    }

    private function simulateLegacySchema(): void
    {
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
