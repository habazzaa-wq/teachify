<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Request correlation
    |--------------------------------------------------------------------------
    |
    | Every incoming API request gets a correlation id that is echoed back in
    | the response header, attached to queued jobs, and included in logs so a
    | single request can be traced across HTTP, queue workers, and the DB.
    */

    'request_id_header' => env('REQUEST_ID_HEADER', 'X-Request-Id'),

    /*
    |--------------------------------------------------------------------------
    | Slow request logging
    |--------------------------------------------------------------------------
    |
    | Requests slower than this threshold (milliseconds) are logged with their
    | correlation id, method, path, status, and duration. Set to 0 to disable.
    */

    'slow_request_ms' => (int) env('SLOW_REQUEST_THRESHOLD_MS', 1000),

    /*
    |--------------------------------------------------------------------------
    | Slow query logging
    |--------------------------------------------------------------------------
    |
    | Queries slower than this threshold (milliseconds) are logged with their
    | correlation id, connection, duration, and the SQL (placeholders only -
    | bindings are never logged). Set to 0 to disable.
    */

    'slow_query_ms' => (int) env('SLOW_QUERY_THRESHOLD_MS', 200),

    /*
    |--------------------------------------------------------------------------
    | Readiness checks
    |--------------------------------------------------------------------------
    |
    | The readiness endpoint only verifies critical configured dependencies so
    | it stays safe for unauthenticated infrastructure health checks.
    */

    'readiness' => [
        // When true, readiness also verifies a shared cache backend
        // (redis / memcached / dynamodb / octane). Local drivers (array,
        // file, database) are skipped: database-backed cache is already
        // covered by the database check and local drivers are node-local.
        'check_cache' => env('READINESS_CHECK_CACHE', true),
    ],

];
