<?php

namespace Tests\Feature;

use App\Observability\SlowQueryLogger;
use App\Observability\SlowRequestLogger;
use App\Support\Correlation;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

/**
 * P3 slow-operation observability. The mechanism is tested directly so no
 * real wall-clock timing is asserted; bindings are confirmed absent from logs.
 */
class SlowOperationLoggingTest extends TestCase
{
    public function test_slow_query_logged_with_metadata_only(): void
    {
        config(['observability.slow_query_ms' => 200]);
        Correlation::set('req_1');
        Log::spy();

        $conn = Mockery::mock(\Illuminate\Database\Connection::class);
        $conn->shouldReceive('getName')->andReturn('mysql');

        $event = new QueryExecuted(
            'select * from users where id = ?',
            ['secret-binding'],
            500.0,
            $conn,
        );

        (new SlowQueryLogger())($event);

        Log::shouldHaveReceived('warning')->withArgs(function ($message, $context) {
            return $message === 'db.query.slow'
                && ($context['request_id'] ?? null) === 'req_1'
                && ($context['connection'] ?? null) === 'mysql'
                && ($context['duration_ms'] ?? null) === 500
                && ($context['sql'] ?? null) === 'select * from users where id = ?'
                && ! array_key_exists('bindings', $context);
        });
    }

    public function test_fast_query_not_logged(): void
    {
        config(['observability.slow_query_ms' => 200]);
        Log::spy();

        $conn = Mockery::mock(\Illuminate\Database\Connection::class);
        $conn->shouldReceive('getName')->andReturn('mysql');

        $event = new QueryExecuted('select 1', [], 5.0, $conn);
        (new SlowQueryLogger())($event);

        Log::shouldNotHaveReceived('warning');
    }

    public function test_slow_request_logged_with_context(): void
    {
        Correlation::set('req_2');
        Log::spy();

        // Exceeds the high test-env threshold (SLOW_REQUEST_THRESHOLD_MS) so
        // the slow path is exercised without depending on config override.
        (new SlowRequestLogger())->logIfSlow(200000.0, [
            'method' => 'POST',
            'path' => 'api/v1/x',
            'status' => 200,
        ]);

        Log::shouldHaveReceived('warning')->withArgs(function ($message, $context) {
            return $message === 'http.request.slow'
                && ($context['request_id'] ?? null) === 'req_2'
                && ($context['duration_ms'] ?? null) === 200000
                && ($context['path'] ?? null) === 'api/v1/x';
        });
    }

    public function test_fast_request_not_logged(): void
    {
        Log::spy();

        (new SlowRequestLogger())->logIfSlow(10.0, [
            'method' => 'GET',
            'path' => '/',
            'status' => 200,
        ]);

        Log::shouldNotHaveReceived('warning');
    }
}
