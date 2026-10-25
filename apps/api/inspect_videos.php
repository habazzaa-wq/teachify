<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$videos = DB::table('media_assets')
    ->where('provider', 'bunny')
    ->where('type', 'video')
    ->select('id', 'tenant_id', 'provider_service', 'status', 'bunny_video_id', 'bunny_library_id', 'external_id', 'cdn_url', 'bunny_stream_url', 'original_filename')
    ->orderByDesc('id')
    ->limit(30)
    ->get();

foreach ($videos as $v) {
    echo "asset={$v->id} tenant={$v->tenant_id} svc={$v->provider_service} status={$v->status} video_id={$v->bunny_video_id} lib={$v->bunny_library_id} ext={$v->external_id} file={$v->original_filename}\n";
}

$lessons = DB::table('course_lessons')
    ->where('lesson_type', 'video')
    ->select('id', 'course_id', 'title')
    ->orderByDesc('id')
    ->limit(10)
    ->get();

echo "\n--- LESSONS ---\n";
foreach ($lessons as $l) {
    $lv = DB::table('lesson_videos')->where('lesson_id', $l->id)->first();
    $asset = $lv ? DB::table('media_assets')->where('id', $lv->media_asset_id)->first() : null;
    echo "lesson={$l->id} course={$l->course_id} title={$l->title} asset=" . ($asset->id ?? 'N/A') . " svc=" . ($asset->provider_service ?? 'N/A') . " status=" . ($asset->status ?? 'N/A') . " video_id=" . ($asset->bunny_video_id ?? 'N/A') . " lib=" . ($asset->bunny_library_id ?? 'N/A') . " ext=" . ($asset->external_id ?? 'N/A') . "\n";
}
