<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tables = DB::select('SHOW TABLES');
$existing = [];
foreach ($tables as $t) {
    $vals = array_values((array)$t);
    $existing[] = $vals[0];
}

echo "Existing tables:\n";
foreach ($existing as $t) echo "  $t\n";

echo "\nPending migrations that reference existing tables:\n";
$pending = DB::table('migrations')->where('batch', 0)->orWhereNull('batch')->get();

$migrationToTable = [
    '2026_06_19_010300_create_role_tenant_user_table' => 'role_tenant_user',
    '2026_06_19_010400_create_permission_role_table' => 'permission_role',
    '2026_06_19_020000_add_last_accessed_at_to_tenant_users_table' => 'tenant_users',
    '2026_06_19_020100_create_platform_admins_table' => 'platform_admins',
    '2026_06_19_020200_create_tenant_invitations_table' => 'tenant_invitations',
    '2026_06_19_020300_create_tenant_invitation_role_table' => 'tenant_invitation_role',
    '2026_06_19_030000_create_tenant_settings_table' => 'tenant_settings',
    '2026_06_19_030100_create_tenant_domains_table' => 'tenant_domains',
    '2026_06_19_030200_create_tenant_integrations_table' => 'tenant_integrations',
    '2026_06_19_030300_create_tenant_provisioning_steps_table' => 'tenant_provisioning_steps',
    '2026_06_19_040000_create_course_instructors_table' => 'course_instructors',
    '2026_06_19_040100_create_categories_table' => 'categories',
    '2026_06_19_040200_create_course_categories_table' => 'course_categories',
    '2026_06_19_040300_create_tags_table' => 'tags',
    '2026_06_19_040400_create_course_tags_table' => 'course_tags',
    '2026_06_19_040500_create_course_settings_table' => 'course_settings',
    '2026_06_19_050000_create_course_sections_table' => 'course_sections',
    '2026_06_19_060000_create_course_lessons_table' => 'course_lessons',
    '2026_06_19_070000_create_media_collections_table' => 'media_collections',
    '2026_06_19_070100_create_media_assets_table' => 'media_assets',
    '2026_06_19_070200_create_media_asset_variants_table' => 'media_asset_variants',
    '2026_06_19_070300_create_media_asset_captions_table' => 'media_asset_captions',
    '2026_06_19_070400_create_media_asset_usages_table' => 'media_asset_usages',
    '2026_06_19_070500_create_media_upload_sessions_table' => 'media_upload_sessions',
    '2026_06_19_080000_create_lesson_videos_table' => 'lesson_videos',
    '2026_06_19_080100_create_lesson_files_table' => 'lesson_files',
    '2026_06_19_080200_create_lesson_texts_table' => 'lesson_texts',
    '2026_06_19_090000_create_student_learning_tables' => null,
    '2026_06_19_091000_create_course_access_tables' => null,
    '2026_06_19_092000_create_quiz_foundation_tables' => null,
    '2026_06_19_093000_create_assignment_foundation_tables' => null,
    '2026_06_19_094000_create_certificate_foundation_tables' => null,
    '2026_06_19_095000_create_video_playback_sessions_table' => null,
    '2026_06_19_096000_create_lesson_notes_and_bookmarks_tables' => null,
    '2026_06_19_097000_create_analytics_foundation_tables' => null,
    '2026_06_19_098000_create_notification_foundation_tables' => null,
    '2026_06_19_099000_create_discussion_foundation_tables' => null,
];

$count = 0;
foreach ($migrationToTable as $migration => $table) {
    if ($table === null) continue;
    if (in_array($table, $existing)) {
        echo "  $migration -> $table (EXISTS)\n";
        $count++;
    } else {
        echo "  $migration -> $table (MISSING)\n";
    }
}

echo "\nTotal matching existing tables: $count\n";
