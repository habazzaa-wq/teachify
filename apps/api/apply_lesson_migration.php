<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Running ADD COLUMNS for course_lessons...\n";

$columns = [
    "ADD COLUMN `lesson_type` varchar(20) NOT NULL DEFAULT 'video' AFTER `order`",
    "ADD COLUMN `short_description` text NULL AFTER `slug`",
    "ADD COLUMN `description` longtext NULL AFTER `short_description`",
    "ADD COLUMN `estimated_duration` int NULL AFTER `duration_seconds`",
    "ADD COLUMN `free_preview` tinyint(1) NOT NULL DEFAULT 0 AFTER `estimated_duration`",
    "ADD COLUMN `downloadable` tinyint(1) NOT NULL DEFAULT 0 AFTER `free_preview`",
    "ADD COLUMN `featured` tinyint(1) NOT NULL DEFAULT 0 AFTER `downloadable`",
    "ADD COLUMN `comments_enabled` tinyint(1) NOT NULL DEFAULT 1 AFTER `featured`",
    "ADD COLUMN `notes` text NULL AFTER `comments_enabled`",
    "ADD COLUMN `color` varchar(7) NULL AFTER `notes`",
    "ADD COLUMN `icon` varchar(50) NULL AFTER `color`",
    "ADD COLUMN `published_at` timestamp NULL AFTER `icon`",
    "ADD COLUMN `deleted_at` timestamp NULL AFTER `published_at`",
];

$addStatements = [];
foreach ($columns as $col) {
    $colName = explode('`', $col)[1];
    $check = DB::select("SHOW COLUMNS FROM `course_lessons` WHERE Field = ?", [$colName]);
    if (empty($check)) {
        $addStatements[] = $col;
        echo "  + $colName\n";
    } else {
        echo "  . $colName (already exists)\n";
    }
}

if (!empty($addStatements)) {
    $sql = "ALTER TABLE `course_lessons` " . implode(", ", $addStatements);
    DB::statement($sql);
    echo "ALTER TABLE executed successfully.\n";
} else {
    echo "No columns to add.\n";
}

// Add indexes
$indexes = [
    ['name' => 'course_lessons_lesson_type_index', 'cols' => 'lesson_type'],
    ['name' => 'course_lessons_free_preview_index', 'cols' => 'free_preview'],
    ['name' => 'course_lessons_featured_index', 'cols' => 'featured'],
    ['name' => 'course_lessons_downloadable_index', 'cols' => 'downloadable'],
];

foreach ($indexes as $idx) {
    $check = DB::select("SHOW INDEX FROM `course_lessons` WHERE Key_name = ?", [$idx['name']]);
    if (empty($check)) {
        DB::statement("ALTER TABLE `course_lessons` ADD INDEX `{$idx['name']}` (`{$idx['cols']}`)");
        echo "  INDEX {$idx['name']} added.\n";
    } else {
        echo "  INDEX {$idx['name']} already exists.\n";
    }
}

// Check if lesson_type has default value from type column
$hasLessonType = DB::select("SHOW COLUMNS FROM `course_lessons` WHERE Field = 'lesson_type'");
if (!empty($hasLessonType)) {
    DB::statement("UPDATE `course_lessons` SET lesson_type = `type` WHERE lesson_type IS NULL OR lesson_type = ''");
    echo "Migrated type -> lesson_type values.\n";
}

echo "\nMigration complete.\n";
