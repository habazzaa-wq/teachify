<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Page Analysis
    |--------------------------------------------------------------------------
    |
    | Geometry/layout analysis runs on a downscaled copy of the upload purely
    | for pixel work; OCR itself runs on the original resolution file.
    |
    */

    'analysis' => [
        'max_side' => env('QUESTION_IMPORT_ANALYSIS_MAX_SIDE', 1400),
    ],

    /*
    |--------------------------------------------------------------------------
    | OCR (Tesseract CLI)
    |--------------------------------------------------------------------------
    |
    | The binary is probed at runtime; when missing or lacking language packs,
    | imports fail with an actionable message instead of fake results.
    | PSM 3 = fully automatic page segmentation (default), 6 = single block.
    |
    */

    'ocr' => [
        'binary' => env('TESSERACT_BINARY', 'tesseract'),
        'languages' => ['ara', 'eng'],
        'psm' => env('QUESTION_IMPORT_OCR_PSM', '3'),
        'timeout' => (int) env('QUESTION_IMPORT_OCR_TIMEOUT', 120),
    ],

    /*
    |--------------------------------------------------------------------------
    | Uploads & Lifecycle
    |--------------------------------------------------------------------------
    |
    */

    'upload' => [
        'max_size' => 10 * 1024 * 1024, // 10 MB
        'allowed_mimes' => ['image/jpeg', 'image/png', 'image/webp'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Source Image Storage
    |--------------------------------------------------------------------------
    |
    | Upload bytes are persisted under question-imports/{tenant_id}/{uuid}.bin
    | on this filesystem disk (see config/filesystems.php) instead of inside
    | the database row. "local" keeps current single-server behaviour; swap to
    | an S3-compatible disk for multi-node deployments without code changes.
    |
    */

    'storage' => [
        'disk' => env('QUESTION_IMPORT_STORAGE_DISK', 'local'),
    ],

    // Abandoned non-finalized imports are reaped after this many days.
    'retention_days' => (int) env('QUESTION_IMPORT_RETENTION_DAYS', 7),

    'vision' => [
        'enabled' => env('QUESTION_IMPORT_VISION_ENABLED', false),
        'endpoint' => env('QUESTION_IMPORT_VISION_ENDPOINT', ''),
        'api_key' => env('QUESTION_IMPORT_VISION_API_KEY', ''),
        'model' => env('QUESTION_IMPORT_VISION_MODEL', 'gpt-4o-mini'),
        'timeout' => (int) env('QUESTION_IMPORT_VISION_TIMEOUT', 45),
        'max_retries' => (int) env('QUESTION_IMPORT_VISION_MAX_RETRIES', 1),
        'daily_limit' => (int) env('QUESTION_IMPORT_VISION_DAILY_LIMIT', 50),
        'rate_limit' => (int) env('QUESTION_IMPORT_VISION_RATE_LIMIT', 10),
    ],

    'limits' => [
        'vision_daily' => (int) env('QUESTION_IMPORT_VISION_DAILY_LIMIT', 50),
        'vision_rate' => (int) env('QUESTION_IMPORT_VISION_RATE_LIMIT', 10),
    ],
];
