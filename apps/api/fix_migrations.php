<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$migrations = [
    '2026_06_19_010300_create_role_tenant_user_table',
    '2026_06_19_010400_create_permission_role_table',
    '2026_06_19_020000_add_last_accessed_at_to_tenant_users_table',
    '2026_06_19_020100_create_platform_admins_table',
    '2026_06_19_020200_create_tenant_invitations_table',
    '2026_06_19_020300_create_tenant_invitation_role_table',
    '2026_06_19_030000_create_tenant_settings_table',
    '2026_06_19_030100_create_tenant_domains_table',
    '2026_06_19_030200_create_tenant_integrations_table',
    '2026_06_19_030300_create_tenant_provisioning_steps_table',
    '2026_06_19_040000_create_course_instructors_table',
    '2026_06_19_040100_create_categories_table',
    '2026_06_19_040200_create_course_categories_table',
    '2026_06_19_040300_create_tags_table',
    '2026_06_19_040400_create_course_tags_table',
    '2026_06_19_040500_create_course_settings_table',
    '2026_06_19_050000_create_course_sections_table',
    '2026_06_19_060000_create_course_lessons_table',
    '2026_06_19_070000_create_media_collections_table',
    '2026_06_19_070100_create_media_assets_table',
    '2026_06_19_070200_create_media_asset_variants_table',
    '2026_06_19_070300_create_media_asset_captions_table',
    '2026_06_19_070400_create_media_asset_usages_table',
    '2026_06_19_070500_create_media_upload_sessions_table',
    '2026_06_19_080000_create_lesson_videos_table',
    '2026_06_19_080100_create_lesson_files_table',
    '2026_06_19_080200_create_lesson_texts_table',
    '2026_06_19_090000_create_student_learning_tables',
    '2026_06_19_091000_create_course_access_tables',
    '2026_06_19_092000_create_quiz_foundation_tables',
    '2026_06_19_093000_create_assignment_foundation_tables',
    '2026_06_19_094000_create_certificate_foundation_tables',
    '2026_06_19_095000_create_video_playback_sessions_table',
    '2026_06_19_096000_create_lesson_notes_and_bookmarks_tables',
    '2026_06_19_097000_create_analytics_foundation_tables',
    '2026_06_19_098000_create_notification_foundation_tables',
    '2026_06_19_099000_create_discussion_foundation_tables',
];

echo "Migrations found: " . count($migrations) . "\n";

foreach ($migrations as $migration) {
    $exists = \Illuminate\Support\Facades\DB::table('migrations')
        ->where('migration', $migration)
        ->exists();
    
    if (!$exists) {
        \Illuminate\Support\Facades\DB::table('migrations')->insert([
            'migration' => $migration,
            'batch' => 1,
        ]);
        echo "Inserted: $migration\n";
    } else {
        echo "Already exists: $migration\n";
    }
}

echo "Done.\n";
