<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Exam Answer Page Variants (Phase F)
    |--------------------------------------------------------------------------
    |
    | Dimension and quality ceilings for the optimized / thumbnail variants that
    | are generated in the background for every confirmed photographed answer
    | page. The style follows config/scanner.php (env-keyed, quality-first), but
    | the Media Library variant pipeline has no pre-existing dimension/quality
    | convention of its own to inherit — these are the defaults this phase
    | defines. JPEG is the only output format, matching the document scanner's
    | explicit processing modes (DocumentScanProcessor.php:387).
    |
    */

    // Largest edge (px) of the "optimized" variant. Large enough to keep text
    // legible for grading pan/zoom, far below the 3200px scanner ceiling.
    'optimized_max_dimension' => (int) env('EXAM_ANSWER_OPTIMIZED_MAX_DIMENSION', 2000),

    // JPEG quality of the optimized variant. Below the scanner's 92 (which is a
    // quality-first ceiling) because this is a compression variant, not a scan.
    'optimized_jpeg_quality' => (int) env('EXAM_ANSWER_OPTIMIZED_JPEG_QUALITY', 85),

    // Largest edge (px) of the "thumbnail" variant — a small queue/preview image.
    'thumbnail_max_dimension' => (int) env('EXAM_ANSWER_THUMBNAIL_MAX_DIMENSION', 256),

    'thumbnail_jpeg_quality' => (int) env('EXAM_ANSWER_THUMBNAIL_JPEG_QUALITY', 75),

];
