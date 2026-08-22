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

    // Abandoned non-finalized imports are reaped after this many days.
    'retention_days' => (int) env('QUESTION_IMPORT_RETENTION_DAYS', 7),
];
