<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Document Scanner Pipeline
    |--------------------------------------------------------------------------
    |
    | Quality-first configuration for exam question scanning. Text readability
    | always outranks file size. Every limit here is a safety ceiling, not a
    | target to hit on every image.
    |
    */

    'max_dimension' => (int) env('SCAN_MAX_DIMENSION', 3200),

    // Upper bound on decoded pixels (width * height) for uploaded scans. Used as
    // a pre-decode budget so a single oversized upload can never force the GD
    // pipeline to decode a decompression bomb. A value of 0 disables the check.
    'max_pixels' => (int) env('SCAN_MAX_PIXELS', 25000000),

    'jpeg_quality' => (int) env('SCAN_JPEG_QUALITY', 92),

    'min_jpeg_quality' => 88,
    'max_jpeg_quality' => 95,

    'min_output_dimension' => 250,

    'analysis_sample_size' => 512,

    'detection_sample_size' => 480,

    // Minimum confidence (0..1) required before a perspective warp is applied.
    'perspective_confidence_threshold' => 0.72,

    // Quads covering at least this fraction of the frame are treated as
    // full-frame captures: warping them would only resample and lose quality.
    'full_frame_area_ratio' => 0.93,

    'modes' => ['bw_document', 'auto', 'color_document', 'grayscale_document', 'original_preserve'],

];
