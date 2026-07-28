<?php

$baseDomain = env('APP_BASE_DOMAIN', 'academy.test');
$escapedBase = preg_quote($baseDomain, '~');

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [],

    'allowed_origins_patterns' => [
        // Platform domain and all subdomains (e.g. teachify.tech, *.teachify.tech)
        '~^https?://([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)*' . $escapedBase . '(:\d+)?$~i',
        '~^https?://' . $escapedBase . '(:\d+)?$~i',

        // Custom / arbitrary domains (unlimited)
        '~^https?://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.?$~i',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 7200,

    'supports_credentials' => true,

];
