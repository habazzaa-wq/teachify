<?php

$baseDomain = env('APP_BASE_DOMAIN', 'academy.test');
$escapedBase = preg_quote($baseDomain, '~');

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'https://teachify.tech,https://www.teachify.tech')))),

    'allowed_origins_patterns' => [
        '~https?://([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)*' . $escapedBase . '(:\d+)?~',
        '~https?://' . $escapedBase . '(:\d+)?~',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 7200,

    'supports_credentials' => true,

];
