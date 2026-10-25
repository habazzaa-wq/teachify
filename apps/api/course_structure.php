<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "modules cols: " . json_encode(Schema::getColumnListing('course_modules')) . "\n";
echo "sections cols: " . json_encode(Schema::getColumnListing('course_sections')) . "\n";
echo "lessons cols: " . json_encode(Schema::getColumnListing('course_lessons')) . "\n";

$tenant = Tenant::find(1);
app()->instance('currentTenant', $tenant);

echo "=== Course 26 structure ===\n";
$orderCol = 'sort_order';
if (! in_array('sort_order', Schema::getColumnListing('course_modules'), true)) {
    $orderCol = 'order';
}

$modules = DB::table('course_modules')->where('tenant_id', 1)->where('course_id', 26)->orderBy($orderCol)->get();
foreach ($modules as $mod) {
    echo "MODULE {$mod->id}: {$mod->title} (status={$mod->status})\n";
    $sections = DB::table('course_sections')->where('tenant_id', 1)->where('course_id', 26)->where('course_module_id', $mod->id)->orderBy('sort_order')->get();
    foreach ($sections as $sec) {
        echo "  SECTION {$sec->id}: {$sec->title} (status={$sec->status})\n";
        $lessons = DB::table('course_lessons')->where('tenant_id', 1)->where('course_id', 26)->where('course_section_id', $sec->id)->orderBy('sort_order')->get();
        foreach ($lessons as $l) {
            $lv = DB::table('lesson_videos')->where('course_lesson_id', $l->id)->first();
            $asset = $lv ? DB::table('media_assets')->where('id', $lv->media_asset_id)->first() : null;
            echo "    LESSON {$l->id}: {$l->title} (type={$l->lesson_type}, status={$l->status}, vis={$l->visibility}, preview={$l->free_preview})"
                . " asset=" . ($asset->id ?? '-')
                . " svc=" . ($asset->provider_service ?? '-')
                . " deleted=" . (($asset && $asset->deleted_at) ? 'YES' : 'no')
                . "\n";
        }
    }
}

echo "\n=== All soft-deleted bunny video assets ===\n";
$deleted = DB::table('media_assets')->where('provider', 'bunny')->where('type', 'video')->whereNotNull('deleted_at')->get(['id', 'tenant_id', 'provider_service', 'status', 'bunny_video_id', 'bunny_library_id', 'original_filename', 'deleted_at']);
foreach ($deleted as $d) {
    echo "asset={$d->id} svc={$d->provider_service} status={$d->status} video_id={$d->bunny_video_id} lib={$d->bunny_library_id} file={$d->original_filename} deleted_at={$d->deleted_at}\n";
}
