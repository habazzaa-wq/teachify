<?php

namespace Tests\Feature;

use App\Jobs\ExamBank\GradeExamAttemptJob;
use App\Queue\Middleware\SetCorrelationContext;
use App\Queue\Middleware\SetTenantContext;
use App\Support\Correlation;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Queue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Tests\TestCase;

class JobCorrelationTest extends TestCase
{
    public function test_correlation_propagated_from_job_payload(): void
    {
        Correlation::set('req_from_http');

        $captured = null;
        $job = new FakeCorrelatedJob(['correlation_id' => 'req_from_http']);

        (new SetCorrelationContext())->handle($job, function () use (&$captured) {
            $captured = Correlation::id();
        });

        $this->assertSame('req_from_http', $captured);
        // Context is cleared after the job so it never leaks across jobs.
        $this->assertNull(Correlation::id());
    }

    public function test_background_job_gets_independent_id(): void
    {
        Correlation::set(null);

        $captured = null;
        $job = new FakeCorrelatedJob([]);

        (new SetCorrelationContext())->handle($job, function () use (&$captured) {
            $captured = Correlation::id();
        });

        $this->assertNotNull($captured);
        $this->assertStringStartsWith('job_', $captured);
        $this->assertNull(Correlation::id());
    }

    public function test_request_context_propagates_into_job_payload(): void
    {
        Correlation::set('req_dispatch');

        $payload = $this->createPayload(new CorrelationProbeJob());

        $this->assertSame('req_dispatch', $payload['correlation_id'] ?? null);

        Correlation::set(null);
        $payload = $this->createPayload(new CorrelationProbeJob());

        $this->assertArrayNotHasKey('correlation_id', $payload);
    }

    private function createPayload(object $job): array
    {
        $connection = Queue::connection();

        $ref = new \ReflectionMethod($connection, 'createPayload');
        $ref->setAccessible(true);

        return json_decode($ref->invoke($connection, $job, 'default'), true);
    }

    public function test_exam_jobs_keep_tenant_context_middleware(): void
    {
        $job = new GradeExamAttemptJob(1, 2);

        $classes = array_map(fn ($m) => get_class($m), $job->middleware());

        $this->assertContains(SetTenantContext::class, $classes);
        $this->assertContains(SetCorrelationContext::class, $classes);
    }
}

class FakeCorrelatedJob
{
    public function __construct(private readonly array $payload)
    {
    }

    public function payload(): array
    {
        return $this->payload;
    }
}

class CorrelationProbeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public ?string $captured = null;

    public function middleware(): array
    {
        return [new SetCorrelationContext()];
    }

    public function handle(): void
    {
        $this->captured = Correlation::id();
    }
}
